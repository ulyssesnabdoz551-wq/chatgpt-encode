import type { GlobalThemeOverrides } from 'naive-ui'
import { computed, watch } from 'vue'
import { darkTheme, useOsTheme } from 'naive-ui'
import { useAppStore } from '@/store'

export function useTheme() {
  const appStore = useAppStore() // 获取应用全局状态

  const OsTheme = useOsTheme() // 获取操作系统主题

  const isDark = computed(() => { // 计算当前是否为深色主题
    if (appStore.theme === 'auto') // 自动模式跟随系统
      return OsTheme.value === 'dark'
    else // 手动模式使用设置的主题
      return appStore.theme === 'dark'
  })

  const theme = computed(() => { // 根据深色主题状态返回对应主题
    return isDark.value ? darkTheme : undefined
  })

  const themeOverrides = computed<GlobalThemeOverrides>(() => { // 生成主题覆盖配置
    if (isDark.value) {
      return {
        common: {},
      }
    }
    return {}
  })

  watch(
    () => isDark.value,
    (dark) => {
      if (dark)
        document.documentElement.classList.add('dark') // 深色模式添加dark类
      else
        document.documentElement.classList.remove('dark') // 浅色模式移除dark类
    },
    { immediate: true }, // 立即执行一次
  )

  return { theme, themeOverrides } // 返回主题配置
}
