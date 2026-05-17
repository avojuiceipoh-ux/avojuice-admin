import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AppLayout from './components/AppLayout'
import ComingSoon from './components/ComingSoon'
import Dashboard from './pages/Dashboard'
import Outlets from './pages/Outlets'
import Products from './pages/Products'
import Orders from './pages/Orders'
import Menu from './pages/Menu'
import Users from './pages/Users'
import Promotions from './pages/Promotions'
// V2 — 菜单管理
import Items from './pages/menu/Items'
import Categories from './pages/menu/Categories'
import Variants from './pages/menu/Variants'
import Modifiers from './pages/menu/Modifiers'
import Discounts from './pages/menu/Discounts'

function RequireAuth({ children }) {
  const token = localStorage.getItem('avo_admin_token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* ─── 仪表板 ────────────────────────────── */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dashboard/sales-summary" element={
            <ComingSoon
              title="Sales Summary"
              batch="B3"
              description="销售总览：今日/周/月/季营业额、订单数、客单价、毛利率、退款率 — 实时折线图 + 同比环比对比"
              plannedFeatures={[
                '总销售、订单数、客单价、毛利率',
                '日 / 周 / 月 / 季 / 自定义区间',
                '环比 + 同比对比（上周、上月、去年同期）',
                '按门店 / 渠道（POS / App / Grab）切分',
                '导出 CSV / Excel',
              ]}
            />
          } />
          <Route path="dashboard/sales-by-item" element={
            <ComingSoon
              title="Sales by Item"
              batch="B3"
              description="按单品看销量、销售额、毛利、毛利率、占比 — 帮你找畅销和滞销品，是茶饮店决定菜单升级的核心报表"
              plannedFeatures={[
                '产品销量排序（高/低）',
                '毛利贡献排行',
                '搭配菜单管理一键下架滞销品',
              ]}
            />
          } />
          <Route path="dashboard/sales-by-category" element={
            <ComingSoon title="Sales by Category" batch="B3" description="按品类（特调 / 鲜榨 / 奶昔 / 茶）看占比和趋势，决定下季度菜单调整方向" />
          } />
          <Route path="dashboard/sales-by-hour" element={
            <ComingSoon
              title="Sales by Hour"
              batch="B3"
              description="按时段看客流和销售，茶饮店的高峰时段直接决定备料和排班"
              plannedFeatures={[
                '24 小时 heatmap',
                '识别 Happy Hour 时段',
                '排班和备料决策依据',
              ]}
            />
          } />
          <Route path="dashboard/receipts" element={
            <ComingSoon
              title="Receipts 收据流水"
              batch="B3"
              description="所有收据列表 + 搜索 + 补打 — SST/LHDN 审计也靠它"
              plannedFeatures={[
                '搜索（收据号、手机号、金额、日期）',
                '补打小票（连蓝牙打印机）',
                '订单详情 / 商品明细 / 支付方式',
                '导出对账',
              ]}
            />
          } />
          <Route path="dashboard/discount-usage" element={
            <ComingSoon title="Discount Usage" batch="B3" description="折扣使用统计 — 每个折扣的使用次数、让利金额、订单贡献。防止员工滥用、老板必看的报表" />
          } />

          {/* ─── 菜单管理 ───────────────────────────── */}
          <Route path="menu/items" element={<Items />} />
          <Route path="menu/variants"   element={<Variants />} />
          <Route path="menu/modifiers"  element={<Modifiers />} />
          <Route path="menu/categories" element={<Categories />} />
          <Route path="menu/discounts"  element={<Discounts />} />

          {/* 兼容旧路由 */}
          <Route path="menu" element={<Menu />} />
          <Route path="products" element={<Products />} />
          <Route path="orders" element={<Orders />} />
          <Route path="promotions" element={<Promotions />} />

          {/* ─── 库存管理 ───────────────────────────── */}
          <Route path="inventory/items" element={
            <ComingSoon
              title="原料 Items"
              batch="B4"
              description="原料级库存（鳄梨、芒果、珍珠、糖浆等）— 茶饮店命脉"
              plannedFeatures={[
                '原料 CRUD（单位、成本、供应商）',
                '当前库存 + 预警阈值',
                '保质期（自动损耗提醒）',
                'SKU / 条形码',
              ]}
            />
          } />
          <Route path="inventory/recipes" element={
            <ComingSoon
              title="配方 Recipes"
              batch="B4"
              description="产品 / 变量 / 加料 ↔ 原料的配方表 — 每杯用多少 g 原料"
              plannedFeatures={[
                '为每个产品/变量/加料挂接原料 + 用量',
                '订单完成时自动扣库存',
                '真实毛利率计算（基于实际成本）',
              ]}
            />
          } />
          <Route path="inventory/purchases" element={
            <ComingSoon title="进货 Purchase Orders" batch="B4" description="供应商管理 + 进货单 + 到货验收 + 成本入库" />
          } />
          <Route path="inventory/wastage" element={
            <ComingSoon
              title="损耗 Wastage"
              batch="B4"
              description="损耗记录 — 真水果店的核心痛点，三个月数据足以支撑采购决策"
              plannedFeatures={[
                '损耗原因（变质 / 打翻 / 试做 / 客诉）',
                '自动算成本损失',
                '日 / 周 / 月报',
                '低于历史均值预警',
              ]}
            />
          } />
          <Route path="inventory/stock-count" element={
            <ComingSoon title="盘点 Stock Count" batch="B4" description="期初 + 期末盘点 + 差异分析" />
          } />

          {/* ─── 顾客管理 ───────────────────────────── */}
          <Route path="customers" element={<Users />} />
          <Route path="customers/tiers" element={
            <ComingSoon title="会员等级" batch="B4" description="Silver / Gold / Platinum 等级配置 + 升级条件" />
          } />
          <Route path="customers/loyalty" element={
            <ComingSoon
              title="积分规则"
              batch="B4"
              description="积分赚取 / 兑换规则配置"
              plannedFeatures={[
                '1 RM = X 分',
                '100 分 = RM Y',
                '过期规则（一年清零）',
                '生日加倍 / 节假日加倍',
              ]}
            />
          } />
          <Route path="customers/coupons" element={
            <ComingSoon title="优惠码" batch="B4" description="批量生成、单码、一次性码、限领次数" />
          } />

          {/* ─── 员工管理 ───────────────────────────── */}
          <Route path="employees" element={
            <ComingSoon
              title="员工列表"
              batch="B4"
              description="员工档案 + 角色 + 时薪 + POS 登录 PIN"
              plannedFeatures={[
                '基本信息 + 角色（Owner / Manager / Cashier / Barista）',
                'POS 4 位 PIN 登录码',
                '时薪 + 工时统计',
                '入职 / 离职',
              ]}
            />
          } />
          <Route path="employees/shifts" element={
            <ComingSoon title="班次 / 排班" batch="B4" description="周排班表 + 排班冲突检查" />
          } />
          <Route path="employees/time-entries" element={
            <ComingSoon
              title="打卡记录"
              batch="B4"
              description="员工上下班打卡 — 商家端 App 操作"
              plannedFeatures={[
                'Clock in / out（商家端 App 一键）',
                '休息时长统计',
                '工时报表 + 工资计算',
                '迟到 / 早退提醒',
              ]}
            />
          } />
          <Route path="employees/roles" element={
            <ComingSoon
              title="角色 / 权限"
              batch="B4"
              description="角色级权限控制 — 退款、改价、看报表、改菜单都可独立授权"
            />
          } />

          {/* ─── 高级报表 ───────────────────────────── */}
          <Route path="reports/sales-by-employee" element={
            <ComingSoon title="员工业绩报表" batch="B3" description="每个员工的销售贡献 + 工时换算" />
          } />
          <Route path="reports/wastage" element={
            <ComingSoon title="损耗报表" batch="B4" description="按时间 / 原料 / 原因切分的损耗分析" />
          } />
          <Route path="reports/tax" element={
            <ComingSoon title="SST 报表" batch="B3" description="6% SST 汇总（LHDN/RMCD 申报用）" />
          } />

          {/* ─── 门店管理 ───────────────────────────── */}
          <Route path="outlets" element={<Outlets />} />

          {/* ─── 设置 ───────────────────────────────── */}
          <Route path="settings/business" element={
            <ComingSoon title="商户资料" batch="B4" description="店名 / SSM / 地址 / Logo / 联系方式" />
          } />
          <Route path="settings/hours" element={
            <ComingSoon title="营业时间" batch="B4" description="周一至六 + 周日固定休息（按你的运营规则）" />
          } />
          <Route path="settings/payments" element={
            <ComingSoon
              title="支付方式"
              batch="B4"
              description="启用 / 禁用各支付方式"
              plannedFeatures={[
                '现金 / DuitNow QR / Touch’n Go / GrabPay / 信用卡',
                '商户绑定（TnG 商户审核完了在这里接入）',
                '自定义支付方式（备用）',
              ]}
            />
          } />
          <Route path="settings/tax" element={
            <ComingSoon title="税率 / SST" batch="B4" description="SST 6% 配置 + 按品类豁免（F&B 现行规则）" />
          } />
          <Route path="settings/receipt" element={
            <ComingSoon
              title="收据模板"
              batch="B4"
              description="自定义小票上下文案、Logo、QR 评价"
              plannedFeatures={[
                '顶部 Logo + 店铺信息',
                '底部文案（自定义感谢语）',
                'QR Code 链接（评价 / 顾客 App）',
                '58mm / 80mm 切换',
              ]}
            />
          } />
          <Route path="settings/printers" element={
            <ComingSoon
              title="打印机配置"
              batch="B4"
              description="蓝牙打印机连接 + 多机配置（前台小票 + 后厨制作单）"
              plannedFeatures={[
                '扫描配对蓝牙打印机',
                '前台收据机 + 后厨制作机分别配置',
                '测试打印',
                '断线自动重连',
                '推荐型号：Xprinter XP-58IIH (RM200) + XP-T80B (RM350)',
              ]}
            />
          } />
          <Route path="settings/loyalty" element={
            <ComingSoon title="积分规则（全局）" batch="B4" description="跟「顾客 → 积分规则」联动；这里是全局开关 + 默认规则" />
          } />
          <Route path="settings/features" element={
            <ComingSoon
              title="功能开关 Feature Toggles"
              batch="B4"
              description="所有 V2 模块全建好，按这里的开关启用"
              plannedFeatures={[
                'KDS 后厨显示屏',
                '自取 / 外卖',
                '会员系统',
                '员工打卡',
                '损耗追踪',
                '配方 / 自动扣库存',
              ]}
            />
          } />
          <Route path="settings/integrations" element={
            <ComingSoon title="集成 / API" batch="B4" description="Grab / Foodpanda / SQL Accounting 等第三方集成" />
          } />
          <Route path="settings/billing" element={
            <ComingSoon title="账单 & 订阅" batch="B4" description="平台订阅状态、付款记录、发票下载" />
          } />

          {/* 兼容旧路由（避免老链接 404）*/}
          <Route path="users" element={<Users />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
