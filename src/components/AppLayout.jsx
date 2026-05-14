import React, { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Typography, Space, Badge } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  ShopOutlined,
  CoffeeOutlined,
  ShoppingCartOutlined,
  UnorderedListOutlined,
  TeamOutlined,
  GiftOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'

const { Sider, Header, Content } = Layout
const { Text } = Typography

const menuItems = [
  { key: '/dashboard',   icon: <DashboardOutlined />,     label: '仪表板' },
  { key: '/outlets',     icon: <ShopOutlined />,          label: '摊位管理' },
  { key: '/menu',        icon: <UnorderedListOutlined />,  label: '菜单管理' },
  { key: '/products',    icon: <CoffeeOutlined />,         label: '产品库' },
  { key: '/orders',      icon: <ShoppingCartOutlined />,  label: '订单管理' },
  { key: '/promotions',  icon: <GiftOutlined />,          label: '优惠活动' },
  { key: '/users',       icon: <TeamOutlined />,          label: '顾客管理' },
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

  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={220}
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
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ border: 'none', marginTop: 8 }}
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
