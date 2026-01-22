import 'katex/dist/katex.min.css'
import '@/styles/lib/tailwind.css'
import '@/styles/lib/highlight.less'
import '@/styles/lib/github-markdown.less'
import '@/styles/global.less'

/** Tailwind's Preflight Style Override */

// 添加特殊的 meta 标签，告诉 Naive UI 当前环境使用了 Tailwind CSS，从而让 Naive UI 自动应用兼容性样式，避免样式冲突问题。

// 工作流程
// // main.ts
// import { setupAssets } from './plugins'

// setupAssets() // ← 调用这里
//   ↓
// naiveStyleOverride() // ← 执行这里
//   ↓
// <meta name="naive-ui-style"> // ← 添加到页面
//   ↓
// Naive UI 检测到标签，调整样式策略
function naiveStyleOverride() {
  const meta = document.createElement('meta')
  meta.name = 'naive-ui-style'
  document.head.appendChild(meta)
}

function setupAssets() {
  naiveStyleOverride()
}

export default setupAssets
