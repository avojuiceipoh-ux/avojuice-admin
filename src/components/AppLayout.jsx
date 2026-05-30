import React, { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Typography, Space } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  ShopOutlined,
  CoffeeOutlined,
  ShoppingCartOutlined,
  UnorderedListOutlined,
  TeamOutlined,
  GiftOutlined,
  PictureOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  InboxOutlined,
  IdcardOutlined,
  BarChartOutlined,
  SettingOutlined,
} from '@ant-design/icons'

const { Sider, Header, Content } = Layout
const { Text } = Typography

/** 完整菜单结构 — V2 茶饮店后台 IA */
const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '仪表板',
    children: [
      { key: '/dashboard',                       label: '今日概览' },
      { key: '/dashboard/sales-summary',          label: 'Sales summary' },
      { key: '/dashboard/sales-by-item',          label: 'Sales by item' },
      { key: '/dashboard/sales-by-category',      label: 'Sales by category' },
      { key: '/dashboard/sales-by-hour',          label: 'Sales by hour' },
      { key: '/dashboard/receipts',               label: 'Receipts' },
      { key: '/dashboard/discount-usage',         label: 'Discount usage' },
    ],
  },
  {
    key: 'menu-group',
    icon: <UnorderedListOutlined />,
    label: '菜单管理',
    children: [
      { key: '/menu/items',       label: '产品 Items' },
      { key: '/menu/variants',    label: '变量 Variants' },
      { key: '/menu/modifiers',   label: '加料 Modifiers' },
      { key: '/menu/categories',  label: '分类 Categories' },
      { key: '/menu/discounts',   label: '折扣 Discounts' },
    ],
  },
  {
    key: 'inventory-group',
    icon: <InboxOutlined />,
    label: '库存管理',
    children: [
      { key: '/inventory/items',         label: '原料 Items' },
      { key: '/inventory/purchases',     label: '进货 Purchases' },
      { key: '/inventory/wastage',       label: '损耗 Wastage' },
      { key: '/inventory/stock-count',   label: '盘点 Stock Count' },
    ],
  },
  {
    key: 'customers-group',
    icon: <TeamOutlined />,
    label: '顾客管理',
    children: [
      { key: '/customers',          label: '顾客列表' },
      { key: '/customers/tiers',    label: '会员等级' },
      { key: '/customers/loyalty',  label: '积分规则' },
      { key: '/customers/coupons',  label: '优惠码' },
    ],
  },
  {
    key: 'employees-group',
    icon: <IdcardOutlined />,
    label: '员工管理',
    children: [
      { key: '/employees',                  label: '员工列表' },
      { key: '/employees/shifts',            label: '班次 / 排班' },
      { key: '/employees/time-entries',      label: '打卡记录' },
      { key: '/employees/roles',             label: '角色 / 权限' },
    ],
  },
  {
    key: 'reports-group',
    icon: <BarChartOutlined />,
    label: '高级报表',
    children: [
      { key: '/reports/sales-by-employee',  label: '员工业绩' },
      { key: '/reports/wastage',            label: '损耗报表' },
      { key: '/reports/tax',                label: 'SST 报表' },
    ],
  },
  {
    key: '/outlets',
    icon: <ShopOutlined />,
    label: '门店管理',
  },
  {
    key: 'content-group',
    icon: <PictureOutlined />,
    label: 'App 内容',
    children: [
      { key: '/content/banners', label: '海报管理' },
    ],
  },
  {
    key: 'settings-group',
    icon: <SettingOutlined />,
    label: '设置',
    children: [
      { key: '/settings/business',        label: '商户资料' },
      { key: '/settings/hours',           label: '营业时间' },
      { key: '/settings/payments',        label: '支付方式' },
      { key: '/settings/tax',             label: '税率 / SST' },
      { key: '/settings/receipt',         label: '收据模板' },
      { key: '/settings/printers',        label: '打印机' },
      { key: '/settings/loyalty',         label: '积分规则' },
      { key: '/settings/features',        label: '功能开关' },
      { key: '/settings/integrations',    label: '集成 / API' },
      { key: '/settings/billing',         label: '账单 & 订阅' },
    ],
  },
]

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const user = JSON.parse(localStorage.getItem('avo_admin_user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('avo_admin_token')
    localStorage.removeItem('avo_admin_user')
    navigate('/login')
  }

  // 计算 selectedKeys 和 openKeys（哪个父菜单要展开）
  const selectedKeys = [pathname]
  const openKeyMap = {
    '/dashboard':  '/dashboard',
    '/menu':       'menu-group',
    '/inventory':  'inventory-group',
    '/customers':  'customers-group',
    '/employees':  'employees-group',
    '/reports':    'reports-group',
    '/settings':   'settings-group',
  }
  const matchedPrefix = Object.keys(openKeyMap).find((p) => pathname.startsWith(p))
  const defaultOpenKeys = matchedPrefix ? [openKeyMap[matchedPrefix]] : []

  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={240}
        style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}
      >
        {/* Logo */}
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 20px',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <img
            src="/logo.png"
            alt="爱我果饮"
            style={{ width: 32, height: 32, objectFit: 'contain' }}
          />
          {!collapsed && (
            <Text strong style={{ marginLeft: 10, fontSize: 15, color: '#52c41a' }}>
              爱我果饮
            </Text>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          defaultOpenKeys={defaultOpenKeys}
          items={menuItems}
          onClick={({ key }) => key.startsWith('/') && navigate(key)}
          style={{ border: 'none', marginTop: 8, paddingBottom: 24 }}
        />
      </Sider>

      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
          height: 64,
        }}>
          <Space>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              style: { fontSize: 18, cursor: 'pointer', color: '#666' },
              onClick: () => setCollapsed(!collapsed),
            })}
            <Text type="secondary" style={{ fontSize: 13 }}>
              管理后台 · Production
            </Text>
          </Space>

          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: ({ key }) => key === 'logout' && handleLogout(),
            }}
            placement="bottomRight"
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ background: '#52c41a' }} icon={<UserOutlined />} size="small" />
              <Text style={{ fontSize: 13 }}>{user.name || user.username || '管理员'}</Text>
            </Space>
          </Dropdown>
        </Header>

        <Content style={{ margin: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
