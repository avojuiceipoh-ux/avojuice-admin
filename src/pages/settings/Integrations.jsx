import React from 'react'
import { Card, List, Switch, Typography, Tag, Space, Button, Alert } from 'antd'
import { ApiOutlined, LinkOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

const INTEGRATIONS = [
  { key: 'grab',          name: 'Grab Food',       category: '外卖平台', status: 'pending', desc: '同步订单、菜单到 Grab Food', emoji: '🚖' },
  { key: 'foodpanda',     name: 'Foodpanda',       category: '外卖平台', status: 'pending', desc: '同步订单、菜单到 Foodpanda', emoji: '🛵' },
  { key: 'shopeefood',    name: 'ShopeeFood',      category: '外卖平台', status: 'pending', desc: '同步订单到 ShopeeFood', emoji: '📦' },
  { key: 'tng_business',  name: 'TnG for Business', category: '支付',    status: 'pending', desc: 'Touch ’n Go QR 收款（4-8 周审核）', emoji: '📱' },
  { key: 'ipay88',        name: 'iPay88',          category: '支付',    status: 'pending', desc: 'FPX / 信用卡 / 银行', emoji: '💳' },
  { key: 'billplz',       name: 'Billplz',         category: '支付',    status: 'pending', desc: '本地热门支付聚合', emoji: '💸' },
  { key: 'sql_accounting',name: 'SQL Accounting',  category: '会计',    status: 'pending', desc: '马来西亚本地会计软件，自动同步销售', emoji: '📊' },
  { key: 'autocount',     name: 'AutoCount',       category: '会计',    status: 'pending', desc: '马来西亚本地会计软件', emoji: '📈' },
  { key: 'mailchimp',     name: 'Mailchimp',       category: '营销',    status: 'pending', desc: '会员 EDM', emoji: '📧' },
  { key: 'meta',          name: 'Meta Pixel',      category: '营销',    status: 'pending', desc: 'IG / FB 广告追踪转化', emoji: '👁' },
  { key: 'webhooks',      name: 'Webhooks',        category: '开发者',  status: 'ready',   desc: '自定义 HTTP 回调（订单 / 顾客等事件）', emoji: '🔗' },
  { key: 'public_api',    name: 'Public API',      category: '开发者',  status: 'pending', desc: '第三方 OAuth 接入', emoji: '🔑' },
]

const STATUS_TAG = {
  ready: { color: 'green',  label: '可用' },
  pending: { color: 'orange', label: '待接入' },
}

export default function Integrations() {
  return (
    <Card>
      <Title level={4} style={{ margin: '0 0 4px' }}><ApiOutlined /> 集成 / API</Title>
      <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 24 }}>
        连接第三方系统 — 大部分需要先申请商户 / API key
      </Text>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="集成顺序建议"
        description="第 1 阶段：TnG / iPay88（支付）。第 2 阶段：Grab / Foodpanda（外卖）。第 3 阶段：会计 + 营销。规模到 RM 10k/月再考虑外卖，避免被高佣金吃利润。"
      />

      <List
        dataSource={INTEGRATIONS}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Tag color={STATUS_TAG[item.status].color} key="status">{STATUS_TAG[item.status].label}</Tag>,
              <Switch key="toggle" disabled={item.status === 'pending'} />,
              <Button key="config" type="link" icon={<LinkOutlined />} disabled={item.status === 'pending'}>配置</Button>,
            ]}
          >
            <List.Item.Meta
              avatar={<span style={{ fontSize: 28 }}>{item.emoji}</span>}
              title={
                <Space>
                  <Text strong>{item.name}</Text>
                  <Tag>{item.category}</Tag>
                </Space>
              }
              description={item.desc}
            />
          </List.Item>
        )}
      />
    </Card>
  )
}
