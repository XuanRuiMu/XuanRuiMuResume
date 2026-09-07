import { z } from 'zod'
import type { FunctionContext } from '../types'
import { anonymizeIP, getClientIP } from '../lib/ip'

const contactSchema = z
  .object({
    name: z.string().min(1).max(64),
    contact: z.string().min(2).max(128).optional(),
    email: z.string().max(128).optional(),
    message: z.string().min(1).max(2000),
    website: z.string().max(64).optional(),
  })
  .refine((data) => (data.contact && data.contact.trim().length >= 2) || (data.email && data.email.trim().length > 0), {
    message: 'contact_required',
  })

const RATE_LIMIT_PREFIX = 'contact:ratelimit:'
const MESSAGE_PREFIX = 'contact:message:'
const MAX_REQUESTS_PER_HOUR = 5
const RATE_LIMIT_TTL_SECONDS = 3600

function createMessageKey(timestamp: number): string {
  const random = Math.random().toString(36).slice(2)
  return `${MESSAGE_PREFIX}${timestamp}:${random}`
}

function createEmailBody(name: string, contact: string, message: string): string {
  return `来自 ${name} <${contact}> 的留言\n\n${message}`
}

async function sendWithResend(
  apiKey: string,
  from: string,
  to: string,
  name: string,
  contact: string,
  message: string
): Promise<boolean> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: `新留言来自 ${name}`,
      text: createEmailBody(name, contact, message),
    }),
  })
  return response.ok
}

async function sendWithSendGrid(
  apiKey: string,
  from: string,
  to: string,
  name: string,
  contact: string,
  message: string
): Promise<boolean> {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
      subject: `新留言来自 ${name}`,
      content: [{ type: 'text/plain', value: createEmailBody(name, contact, message) }],
    }),
  })
  return response.ok
}

async function trySendEmail(
  env: FunctionContext['env'],
  name: string,
  contact: string,
  message: string
): Promise<boolean> {
  const provider = env.CONTACT_PROVIDER
  const from = env.CONTACT_FROM_EMAIL
  const to = env.CONTACT_TO_EMAIL

  if (!from || !to) {
    return false
  }

  if (provider === 'resend' && env.RESEND_API_KEY) {
    return sendWithResend(env.RESEND_API_KEY, from, to, name, contact, message)
  }

  if (provider === 'sendgrid' && env.SENDGRID_API_KEY) {
    return sendWithSendGrid(env.SENDGRID_API_KEY, from, to, name, contact, message)
  }

  if (env.RESEND_API_KEY) {
    return sendWithResend(env.RESEND_API_KEY, from, to, name, contact, message)
  }

  if (env.SENDGRID_API_KEY) {
    return sendWithSendGrid(env.SENDGRID_API_KEY, from, to, name, contact, message)
  }

  return false
}

async function isRateLimited(kv: FunctionContext['env']['CONTACT_KV'], ipHash: string): Promise<boolean> {
  if (!kv) {
    return false
  }
  const key = `${RATE_LIMIT_PREFIX}${ipHash}`
  const raw = await kv.get(key)
  const count = raw ? Number(raw) : 0
  return Number.isFinite(count) && count >= MAX_REQUESTS_PER_HOUR
}

async function recordRequest(kv: FunctionContext['env']['CONTACT_KV'], ipHash: string): Promise<void> {
  if (!kv) {
    return
  }
  const key = `${RATE_LIMIT_PREFIX}${ipHash}`
  const raw = await kv.get(key)
  const count = raw ? Number(raw) : 0
  const next = Number.isFinite(count) ? count + 1 : 1
  await kv.put(key, String(next), { expirationTtl: RATE_LIMIT_TTL_SECONDS })
}

export async function onRequestPost(context: FunctionContext): Promise<Response> {
  const { request, env } = context

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'invalid_json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const parseResult = contactSchema.safeParse(body)
  if (!parseResult.success) {
    return new Response(
      JSON.stringify({ success: false, error: 'validation_error', issues: parseResult.error.issues }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const { name, message, website } = parseResult.data
  const contact = (parseResult.data.contact ?? parseResult.data.email ?? '').trim()

  if (website && website.length > 0) {
    return new Response(JSON.stringify({ success: true, mode: 'ignored' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const ipHash = await anonymizeIP(getClientIP(request))

  if (await isRateLimited(env.CONTACT_KV, ipHash)) {
    return new Response(JSON.stringify({ success: false, error: 'rate_limited' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  await recordRequest(env.CONTACT_KV, ipHash)

  const sent = await trySendEmail(env, name, contact, message)

  if (sent) {
    return new Response(JSON.stringify({ success: true, mode: 'sent' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (env.CONTACT_KV) {
    const record = { name, contact, message, timestamp: Date.now(), ipHash }
    await env.CONTACT_KV.put(createMessageKey(Date.now()), JSON.stringify(record))
  }

  return new Response(JSON.stringify({ success: true, mode: 'queued' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
