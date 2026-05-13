import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import App from './App'
import './index.css'

dayjs.locale('zh-cn')

ReactDOM.createRoot(document.getElementById('root')).render(
  <ConfigProvider
    locale={zhCN}
    theme={{
      token: {
        colorPrimary: '#52c41a',
        colorLink: '#52c41a',
        borderRadius: 8,
        fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
      },
    }}
  >
    <App />
  </ConfigProvider>
)
