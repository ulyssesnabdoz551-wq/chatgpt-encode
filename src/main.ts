import { createApp } from 'vue'
import App from './App.vue'
import { setupI18n } from './locales/'
import { setupAssets, setupScrollbarStyle } from './plugins'
import { setupStore } from './store'
import { setupRouter } from './router'

async function bootstrap() {
  // create app instance
  const app = createApp(App)

  // 设置样式
  setupAssets()

  // 设置滚动条样式
  setupScrollbarStyle()

  // 挂载store
  setupStore(app)

  // I18n国际化
  setupI18n(app)

  // 挂载路由
  await setupRouter(app)

  // mount app
  app.mount('#app')
}

bootstrap()
