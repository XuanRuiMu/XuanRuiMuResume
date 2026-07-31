import { createServer } from 'vite'
import WebSocket from 'ws'
import { encode } from '@msgpack/msgpack'

const PORT = 5190

async function main() {
  const logs = []
  const origLog = console.log
  console.log = (...args) => {
    logs.push(args.join(' '))
    origLog(...args)
  }

  const server = await createServer({
    root: process.cwd(),
    server: { port: PORT, strictPort: true },
    logLevel: 'silent',
  })
  await server.listen()

  await new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${PORT}/__observability`)
    ws.binaryType = 'arraybuffer'

    ws.on('open', () => {
      const entry = {
        timestamp: Date.now(),
        level: 'info',
        category: 1,
        spanId: 0,
        message: '测试日志消息',
        source: 'test.ts:42',
        context: { userId: 123 },
      }
      const entryEncoded = encode(entry)
      const msg = encode({ type: 'log', data: entryEncoded })
      ws.send(msg)

      setTimeout(() => {
        ws.close()
        server.close()
        console.log = origLog

        const hasInfo = logs.some(l => l.includes('[INFO]'))
        const hasRuntime = logs.some(l => l.includes('Runtime'))
        const hasMsg = logs.some(l => l.includes('测试日志消息'))

        if (hasInfo && hasRuntime && hasMsg) {
          console.log('✓ 测试通过: 日志正确打印到终端')
          process.exit(0)
        } else {
          console.log('✗ 测试失败: 日志未正确打印')
          console.log('捕获的输出:', logs)
          process.exit(1)
        }
      }, 1000)
    })

    ws.on('error', reject)
    ws.on('unexpected-response', (req, res) => {
      reject(new Error(`Unexpected response: ${res.statusCode}`))
    })
  })
}

main().catch(err => {
  console.error('测试失败:', err)
  process.exit(1)
})
