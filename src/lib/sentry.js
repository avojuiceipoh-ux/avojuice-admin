/**
 * admin Sentry 包装 — 没装包 / 没 DSN 时静默 skip
 */

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  // 动态 import，避免没装包时构建失败
  import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
      integrations: [Sentry.browserTracingIntegration?.()].filter(Boolean),
      beforeSend(event) {
        try {
          // 过滤敏感数据
          if (event.request?.data) {
            for (const k of ['otp', 'pin', 'password', 'pin_hash']) {
              if (event.request.data[k]) event.request.data[k] = '***'
            }
          }
        } catch {}
        return event
      },
    })
    console.log('[Sentry] ✅ 已启用')
  }).catch((e) => {
    console.warn('[Sentry] 加载失败：', e.message)
  })
}
