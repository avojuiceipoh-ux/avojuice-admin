import React from 'react'
import { Card, Table, Tag, Typography, Statistic, Row, Col, Avatar } from 'antd'
import { TeamOutlined, UserOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { customersAPI } from '../../services/api'

const { Text, Title } = Typography

export default function CustomerList() {
  const query = useQuery({
    queryKey: ['admin-customers'],
    queryFn: () => customersAPI.list().then((r) => r.data.customers || []),
  })

  const customers = query.data ?? []
  const totalSpent = customers.reduce((s, c) => s + Number(c.total_spent), 0)
  const vipCount = customers.filter((c) => c.tier_name).length

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}><Card style={{ height: '100%' }}><Statistic title="总顾客数" value={customers.length} prefix={<TeamOutlined />} /></Card></Col>
        <Col xs={24} sm={8}><Card style={{ height: '100%' }}><Statistic title="累计消费" value={totalSpent} precision={2} prefix="RM" valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={24} sm={8}><Card style={{ height: '100%' }}><Statistic title="会员顾客" value={vipCount} suffix={`/ ${customers.length}`} /></Card></Col>
      </Row>

      <Card title={<Title level={4} style={{ margin: 0 }}>顾客列表</Title>} loading={query.isLoading}>
        <Table
          rowKey="id"
          size="middle"
          dataSource={customers}
          pagination={{ pageSize: 30 }}
          columns={[
            { title: '顾客', key: 'name',
              render: (_, row) => (
                <div>
                  <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8, background: '#52c41a' }} />
                  <Text strong>{row.name || '匿名'}</Text>
                  <div><Text type="secondary" style={{ fontSize: 12 }}>{row.phone}</Text></div>
                </div>
              ),
            },
            { title: '会员等级', dataIndex: 'tier_name', width: 110,
              render: (v) => v ? <Tag color="gold">{v}</Tag> : <Text type="secondary">普通</Text>,
            },
            { title: '总订单', dataIndex: 'total_orders', width: 100, align: 'right',
              render: (v) => `${v} 单`,
            },
            { title: '累计消费', dataIndex: 'total_spent', width: 130, align: 'right',
              sorter: (a, b) => a.total_spent - b.total_spent,
              defaultSortOrder: 'descend',
              render: (v) => <Text strong style={{ color: '#52c41a' }}>RM {Number(v).toFixed(2)}</Text>,
            },
            { title: '钱包余额', dataIndex: 'wallet_balance', width: 110, align: 'right',
              render: (v) => `RM ${Number(v).toFixed(2)}`,
            },
            { title: '推荐码', dataIndex: 'referral_code', width: 110,
              render: (v) => v ? <Tag color="cyan">{v}</Tag> : <Text type="secondary">—</Text>,
            },
            { title: '最近下单', dataIndex: 'last_order_at', width: 140,
              render: (v) => v ? dayjs(v).format('MM-DD HH:mm') : <Text type="secondary">未下单</Text>,
            },
            { title: '注册', dataIndex: 'created_at', width: 120,
              render: (v) => dayjs(v).format('YYYY-MM-DD'),
            },
          ]}
        />
      </Card>
    </div>
  )
}
