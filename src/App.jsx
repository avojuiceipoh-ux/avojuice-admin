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
// V2 — 报表
import SalesSummary from './pages/reports/SalesSummary'
import SalesByItem from './pages/reports/SalesByItem'
import SalesByCategory from './pages/reports/SalesByCategory'
import SalesByHour from './pages/reports/SalesByHour'
import Receipts from './pages/reports/Receipts'
import DiscountUsage from './pages/reports/DiscountUsage'
// V2 — 员工
import Employees from './pages/employees/Employees'
import TimeEntries from './pages/employees/TimeEntries'
import Shifts from './pages/employees/Shifts'
import Roles from './pages/employees/Roles'
// V2 — 库存
import InventoryItems from './pages/inventory/Items'
import Wastage from './pages/inventory/Wastage'
import Recipes from './pages/inventory/Recipes'
import Purchases from './pages/inventory/Purchases'
import StockCount from './pages/inventory/StockCount'
// V2 — 顾客
import CustomerList from './pages/customers/CustomerList'
import MembershipTiers from './pages/customers/MembershipTiers'
import LoyaltyRules from './pages/customers/LoyaltyRules'
// V2 — 设置
import BusinessSettings from './pages/settings/Business'
import FeatureToggles from './pages/settings/Features'
import ReceiptSettings from './pages/settings/Receipt'
import HoursSettings from './pages/settings/Hours'
import PaymentsSettings from './pages/settings/Payments'
import TaxSettings from './pages/settings/Tax'
import LoyaltyGlobal from './pages/settings/LoyaltyGlobal'
import Integrations from './pages/settings/Integrations'
import Billing from './pages/settings/Billing'

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
          <Route path="dashboard/sales-summary"     element={<SalesSummary />} />
          <Route path="dashboard/sales-by-item"      element={<SalesByItem />} />
          <Route path="dashboard/sales-by-category"  element={<SalesByCategory />} />
          <Route path="dashboard/sales-by-hour"      element={<SalesByHour />} />
          <Route path="dashboard/receipts"           element={<Receipts />} />
          <Route path="dashboard/discount-usage"     element={<DiscountUsage />} />

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
          <Route path="inventory/items"       element={<InventoryItems />} />
          <Route path="inventory/wastage"     element={<Wastage />} />
          <Route path="inventory/recipes"     element={<Recipes />} />
          <Route path="inventory/purchases"   element={<Purchases />} />
          <Route path="inventory/stock-count" element={<StockCount />} />

          {/* ─── 顾客管理 ───────────────────────────── */}
          <Route path="customers"          element={<CustomerList />} />
          <Route path="customers/tiers"    element={<MembershipTiers />} />
          <Route path="customers/loyalty"  element={<LoyaltyRules />} />
          <Route path="customers/coupons" element={
            <ComingSoon title="优惠码" batch="B4" description="已挂在「菜单 → 折扣」管理。这里日后整合批量生成、一次性码" />
          } />

          {/* ─── 员工管理 ───────────────────────────── */}
          <Route path="employees"                element={<Employees />} />
          <Route path="employees/time-entries"   element={<TimeEntries />} />
          <Route path="employees/shifts" element={<Shifts />} />
          <Route path="employees/roles"  element={<Roles />} />

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
          <Route path="settings/business" element={<BusinessSettings />} />
          <Route path="settings/hours"    element={<HoursSettings />} />
          <Route path="settings/payments" element={<PaymentsSettings />} />
          <Route path="settings/tax"      element={<TaxSettings />} />
          <Route path="settings/receipt" element={<ReceiptSettings />} />
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
          <Route path="settings/loyalty"      element={<LoyaltyGlobal />} />
          <Route path="settings/features"     element={<FeatureToggles />} />
          <Route path="settings/integrations" element={<Integrations />} />
          <Route path="settings/billing"      element={<Billing />} />

          {/* 兼容旧路由（避免老链接 404）*/}
          <Route path="users" element={<Users />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
