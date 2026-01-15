import express from 'express'
import type { RequestProps } from './types'
import type { ChatMessage } from './chatgpt'
import { chatConfig, chatReplyProcess, currentModel } from './chatgpt'
import { auth } from './middleware/auth'
import { limiter } from './middleware/limiter'
import { isNotEmptyString } from './utils/is'

const app = express() //创建express实例
const router = express.Router() //创建路由实例,组织和管理 API 路由

// 1. app.use用于注册中间件
// 基本语法：app.use([path,] middleware [, middleware...])
// 参数说明：
// path (可选): 字符串、路径模式或正则表达式，指定中间件挂载的路径
// middleware: 中间件函数，可以是单个函数或多个函数

// 中间件函数的标准签名，接收三个参数：req, res, next，其中 next 是一个函数
// function middleware(req, res, next) {
//   // 处理请求
//   next()  // 调用下一个中间件
// }

// 2.执行顺序
// 请求到达 → Express 按注册顺序匹配中间件
// 路径匹配 → 检查请求路径是否匹配中间件的路径
// 中间件执行 → 依次执行匹配的中间件
// 调用 next() → 传递控制权给下一个中间件
// 响应返回 → 最终中间件处理响应

// app.use匹配所有的http方法
app.use(express.static('public')) // 配置静态文件服务中间件，让服务器能够提供静态资源, 配置静态文件服务中间件，让服务器能够提供静态资源
app.use(express.json()) //解析 JSON 格式的请求体中间件

// app.all用于注册中间件，匹配所有HTTP方法（与 app.use() 类似，但通常用于路由）
// 这个中间件会拦截服务器收到的所有请求
app.all('*', (_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*') // 表示允许任何域名的请求
  res.header('Access-Control-Allow-Headers', 'authorization, Content-Type')//允许的请求头: 允许客户端发送 authorization 和 Content-Type 头
  res.header('Access-Control-Allow-Methods', '*') //表示允许所有HTTP方法
  next() //将控制权传递给下一个中间件
})

// auth 身份验证中间件（检查 Authorization 头）   limiter请求限流中间件（防止滥用）
// 请求到达 → auth 中间件 → limiter 中间件 → 路由处理器 → 响应返回
router.post('/chat-process', [auth, limiter], async (req, res) => {
  // 只有所有中间件都通过后才会执行这里的代码
  res.setHeader('Content-type', 'application/octet-stream') // 告诉浏览器这是流式数据，不是普通的JSON响应

  try {
    const { prompt, options = {}, systemMessage, temperature, top_p } = req.body as RequestProps //类型断言，"我确信 req.body 的类型是 RequestProps，请按此类型进行类型检查
    let firstChunk = true
    // 调用 ChatGPT API 进行流式对话
    await chatReplyProcess({
      message: prompt,
      lastContext: options,
      // 回调函数，每收到一个 ChatGPT 的响应块就立即发送给客户端
      process: (chat: ChatMessage) => {
        // res.write() 立即将数据块发送给客户端
        res.write(firstChunk ? JSON.stringify(chat) : `\n${JSON.stringify(chat)}`)
        firstChunk = false
      },
      systemMessage,
      temperature,
      top_p,
    })
  }
  catch (error) {
    res.write(JSON.stringify(error))
  }
  finally {
    res.end() //// 确保流正确关闭
  }
})

router.post('/config', auth, async (req, res) => {
  try {
    const response = await chatConfig()
    // 发送响应数据给客户端
    res.send(response)
  }
  catch (error) {
    res.send(error)
  }
})

router.post('/session', async (req, res) => {
  try {
    const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY
    const hasAuth = isNotEmptyString(AUTH_SECRET_KEY)
    res.send({ status: 'Success', message: '', data: { auth: hasAuth, model: currentModel() } })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body as { token: string }
    if (!token)
      throw new Error('Secret key is empty')

    if (process.env.AUTH_SECRET_KEY !== token)
      throw new Error('密钥无效 | Secret key is invalid')

    res.send({ status: 'Success', message: 'Verify successfully', data: null })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

// 将相同路由挂在到根路径或 /api 路径的作用是支持两种访问方式,避免破坏现有前端代码,/api 是 RESTful API 的标准前缀
app.use('', router) //路由挂载到根路径，所有路由都直接在根域名下访问，前端接口访问：POST /config
app.use('/api', router) // 将同一个路由器挂载到 /api 路径 前端接口访问：POST /api/config，请求/config或/api/config都会执行相同的处理逻辑

// 没有 trust proxy
// req.ip // → 代理服务器IP (如 127.0.0.1)

// // 设置 trust proxy 后
// req.ip // → 真实客户端IP (如 192.168.1.100)
app.set('trust proxy', 1) //设置是否信任代理服务器，代理场景：Nginx、负载均衡器等代理你的 Express 应用

app.listen(3002, () => globalThis.console.log('Server is running on port 3002')) //启动 HTTP 服务器并监听指定端口
