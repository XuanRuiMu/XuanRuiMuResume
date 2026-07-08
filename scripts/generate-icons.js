import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const publicDir = path.join(root, 'public')

const svgBuffer = await fs.readFile(path.join(publicDir, 'favicon.svg'))

async function generateIcon(size, outputName) {
  const outputPath = path.join(publicDir, outputName)
  await sharp(svgBuffer)
    .resize(size, size, { fit: 'contain', background: { r: 11, g: 12, b: 21, alpha: 1 } })
    .png()
    .toFile(outputPath)
  return outputPath
}

async function generateOgImage() {
  const outputPath = path.join(publicDir, 'og-image.png')
  const icon = await sharp(svgBuffer).resize(160, 160, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()

  const canvas = sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 3,
      background: { r: 11, g: 12, b: 21 },
    },
  })

  const compositeIcon = await sharp(icon).png().toBuffer()
  await canvas
    .composite([{ input: compositeIcon, gravity: 'center' }])
    .png()
    .toFile(outputPath)
  return outputPath
}

const outputs = []
outputs.push(await generateIcon(192, 'icon-192x192.png'))
outputs.push(await generateIcon(512, 'icon-512x512.png'))
outputs.push(await generateIcon(180, 'apple-touch-icon.png'))
outputs.push(await generateOgImage())

console.log('Generated icons:', outputs.map((p) => path.relative(root, p)).join(', '))
