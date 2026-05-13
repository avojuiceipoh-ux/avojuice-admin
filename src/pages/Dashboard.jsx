import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Typography, Spin, Empty } from 'antd'
import {
  ShoppingCartOutlined,
  DollarOutlined,
  TeamOutlined,
  ShopOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons'
import { orderAPI, outletAPI, userAPI } from '../services/api'
import dayjs from 'dayjs'

const { Title, Text } = Typography

export default function Dashboard() {
  const [stats, setStats] = useState({ orders: 0, revenue: 0, users: 0, outlets: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [outletRes, orderRes] = await Promise.allSettled([
        outletAPI.list(),
        orderAPI.list({ limit: 10, page: 1 }),
      ])

      const outlets = outletRes.value?.data?.outlets || []
      const ordersData = orderRes.value?.data || {}
      const orders = ordersData.orders || []

      const todayRevenue = orders
        .filter(o => dayjs(o.created_at).isToday?.() || true)
        .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)

      setStats({
        outlets: outlets.length,
        orders: ordersData.total || orders.length,
        revenue: todayRevenue.toFixed(2),
        users: 0,
      })
      setRecentOrders(orders.slice(0, 8))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const statusColor = {
    pending: 'orange', confirmed: 'blue', preparing: 'purple',
    ready: 'cyan', completed: 'green', cancelled: 'red',
  }
  const statusLabel = {
    pending: '待确认', confirmed: '已确认', preparing: '制作中',
    ready: '待取餐', completed: '已完成', cancelled: '已取消',
  }

  const columns = [
    { title: '订单号', dataIndex: 'order_number', key: 'order_number', width: 140,
      render: v => <Text code style={{ fontSize: 12 }}>{v || '-'}</Text> },
    { title: '金额', dataIndex: 'total_amount', key: 'total_amount', width: 90,
      render: v => <Text strong>RM {parseFloat(v || 0).toFixed(2)}</Text> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: v => <Tag color={statusColor[v] || 'default'}>{statusLabel[v] || v}</Tag> },
    { title: '下单时间', dataIndex: 'created_at', key: 'created_at',
      render: v => v ? dayjs(v).format('MM-DD HH:mm') : '-' },
  ]

  const statCards = [
    { title: '今日营业额', value: `RM ${stats.revenue}`, icon: <DollarOutlined />, color: '#52c41a' },
    { title: '总订单数', value: stats.orders, icon: <ShoppingCartOutlined />, color: '#1890ff' },
    { title: '摊位数量', value: stats.outlets, icon: <ShopOutlined />, color: '#fa8c16' },
    { title: '注册顾客', value: stats.users, icon: <TeamOutlined />, color: '#722ed1' },
  ]

  return (
    <div>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>📊 仪表板</Title>
        <Text type="secondary">{dayjs().format('YYYY年MM月DD日 dddd')}</Text>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {statCards.map((s, i) => (
            <Col xs={24} sm={12} lg={6} key={i}>
              <Card className="stat-card" bordered={false}>
                <Statistic
                  title={s.title}
                  value={s.value}
                  prefix={React.cloneElement(s.icon, { style: { color: s.color } })}
                  valueStyle={{ color: s.color, fontWeight: 700 }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        <Card
          title="最近订单"
          style={{ marginTop: 24, borderRadius: 12 }}
          bordered={false}
          bodyStyle={{ padding: 0 }}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>最新 10 条</Text>}
        >
          {recentOrders.length > 0 ? (
            <Table
              dataSource={recentOrders}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="middle"
            />
          ) : (
            <Empty description="暂无订单" style={{ padding: '40px 0' }} />
          )}
        </Card>
      </Spin>
    </div>
  )
}
