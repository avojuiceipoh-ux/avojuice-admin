import React from 'react'
import { Card, Row, Col, Statistic, Table, Typography, Tag, Space, Button, Alert } from 'antd'
import { CreditCardOutlined, DownloadOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

// 当前订阅状态（V1 hardcode，等真接 Stripe / 支付商户）
const CURRENT_PLAN = {
  name: '自托管 Self-Hosted',
  price: 'RM 25 / 月',
  description: 'Railway + Vercel 基础设施费用',
  status: 'active',
  next_billing: '2026-06-15',
}

const USAGE = [
  { resource: 'Backend API（Railway）',  usage: '约 20%',  limit: '$5/月起',   cost: 'RM 25' },
  { resource: 'PostgreSQL（Railway）',   usage: '约 5%',   limit: '1 GB',     cost: '含基础' },
  { resource: 'Redis（Railway）',        usage: '< 1%',    limit: '25 MB',    cost: '含基础' },
  { resource: 'Admin Dashboard（Vercel）', usage: '< 1%',  limit: '100 GB 带宽', cost: '免费' },
  { resource: 'Landing Page（Vercel）',  usage: '0%',      limit: '100 GB',  cost: '免费' },
]

const HISTORY = [
  { date: '2026-05-15', plan: 'Self-Hosted',  amount: 'RM 25', status: 'paid',    invoice: 'INV-202605-001' },
  { date: '2026-04-15', plan: 'Self-Hosted',  amount: 'RM 25', status: 'paid',    invoice: 'INV-202604-001' },
]

export default function Billing() {
  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}><CreditCardOutlined /> 账单 & 订阅</Title>
        <Text type="secondary" style={{ fontSize: 13 }}>当前架构 + 月度费用 + 历史账单</Text>
      </Card>

      <Alert
        type="success"
        showIcon
        style={{ marginBottom: 16 }}
        message="当前架构成本极低"
        description="后端 Railway（按用量计费起步 $5/月）+ Admin/Landing 用 Vercel 免费版。每月约 RM 25 + 域名年费 RM 50。规模到 1000 单/月之前都不用涨。"
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card title="当前订阅">
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <div>
                <Text strong style={{ fontSize: 20 }}>{CURRENT_PLAN.name}</Text>
                <Tag color="success" style={{ marginLeft: 8 }}>{CURRENT_PLAN.status}</Tag>
              </div>
              <Text>{CURRENT_PLAN.description}</Text>
              <Statistic title="月费" value={CURRENT_PLAN.price} valueStyle={{ fontSize: 24 }} />
              <Text type="secondary" style={{ fontSize: 12 }}>下次结算：{CURRENT_PLAN.next_billing}</Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="升级（未来）">
            <Space direction="vertical">
              <Text>当订单量 > 5000 / 月 → 升级 Railway Pro Plan</Text>
              <Text>当用户数 > 10,000 → 加 CDN（Cloudflare）</Text>
              <Text>当门店数 ≥ 3 → 加专业监控（Sentry / DataDog）</Text>
              <Button type="primary" disabled>查看升级方案（V2）</Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="基础设施用量" style={{ marginBottom: 16 }}>
        <Table
          rowKey="resource"
          dataSource={USAGE}
          pagination={false}
          size="middle"
          columns={[
            { title: '资源', dataIndex: 'resource' },
            { title: '当前用量', dataIndex: 'usage', width: 120 },
            { title: '套餐上限', dataIndex: 'limit', width: 160 },
            { title: '本月成本', dataIndex: 'cost', width: 100, align: 'right',
              render: (v) => <Text strong style={{ color: v === '免费' || v === '含基础' ? '#52c41a' : '#171717' }}>{v}</Text>,
            },
          ]}
        />
      </Card>

      <Card title="账单历史">
        <Table
          rowKey="date"
          dataSource={HISTORY}
          pagination={false}
          size="middle"
          columns={[
            { title: '日期', dataIndex: 'date', width: 120 },
            { title: '套餐', dataIndex: 'plan' },
            { title: '金额', dataIndex: 'amount', width: 100, align: 'right',
              render: (v) => <Text strong>{v}</Text>,
            },
            { title: '状态', dataIndex: 'status', width: 100,
              render: (v) => <Tag color={v === 'paid' ? 'success' : 'warning'}>{v === 'paid' ? '已付' : '待付'}</Tag>,
            },
            { title: '发票', dataIndex: 'invoice', width: 140 },
            { title: '', width: 60,
              render: () => <Button type="link" icon={<DownloadOutlined />} disabled />,
            },
          ]}
        />
      </Card>
    </div>
  )
}
