import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import subsetFont from 'subset-font'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const 中文字符白名单 = '玄锐暮简历'

async function 查找得意黑源文件() {
  const 候选路径 = [
    path.join(root, 'node_modules/@fontpkg/smiley-sans/SmileySans-Oblique.ttf.woff2'),
    path.join(root, 'node_modules/@fontpkg/smiley-sans/SmileySans-Oblique.otf.woff2'),
  ]

  for (const 路径 of 候选路径) {
    try {
      await fs.access(路径)
      return 路径
    } catch {
      // 继续尝试下一个
    }
  }

  throw new Error('未找到得意黑（Smiley Sans）源字体文件，请确认 @fontpkg/smiley-sans 已安装')
}

async function 子集化得意黑() {
  const 源路径 = await 查找得意黑源文件()
  const 输入 = await fs.readFile(源路径)
  const 输出 = await subsetFont(输入, 中文字符白名单, { targetFormat: 'woff2' })

  const 输出路径 = path.join(root, 'public/fonts/dyh-subset.woff2')
  await fs.mkdir(path.dirname(输出路径), { recursive: true })
  await fs.writeFile(输出路径, 输出)

  return {
    名称: 'dyh-subset.woff2',
    路径: 输出路径,
    大小: 输出.length,
    字符: 中文字符白名单,
  }
}

async function 生成清单(结果列表) {
  const 清单 = {
    generatedAt: new Date().toISOString(),
    fonts: 结果列表.map((结果) => ({
      file: path.relative(root, 结果.路径).replace(/\\/g, '/'),
      size: 结果.大小,
      characters: 结果.字符,
    })),
  }

  const 清单路径 = path.join(root, 'public/fonts/subset-manifest.json')
  await fs.writeFile(清单路径, JSON.stringify(清单, null, 2))
}

async function main() {
  const 结果列表 = []
  结果列表.push(await 子集化得意黑())
  await 生成清单(结果列表)

  console.log('字体子集化完成：', 结果列表.map((结果) => `${结果.名称} (${结果.大小} 字节)`).join('，'))
}

main().catch((错误) => {
  console.error('字体子集化失败：', 错误)
  process.exit(1)
})
