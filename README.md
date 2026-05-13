# 爱我果饮 Admin Web Dashboard

React + Ant Design 管理后台

## 快速启动

```bash
cd 07-软件开发团队/admin
npm install
npm run dev
```

浏览器打开：http://localhost:3001

## 登录

用商户账号登录（通过后端 /merchant/login）

## 页面

| 路径 | 功能 |
|------|------|
| /dashboard | 仪表板 |
| /outlets | 摊位管理 |
| /menu | 菜单管理 |
| /products | 产品库 |
| /orders | 订单管理 |
| /promotions | 优惠活动 |
| /users | 顾客管理 |

## 部署到 Railway

1. 把 admin/ 推到 GitHub（可以同一个 repo 的 admin 分支，或独立 repo）
2. 在 Railway 新建 Service → GitHub → 选 admin 目录
3. Railway 会自动检测 Vite + React，设置 build command: `npm run build`, output: `dist`

## 后端 API

`https://avojuice-backend-production.up.railway.app`
