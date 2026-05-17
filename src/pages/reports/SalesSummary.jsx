import React, { useState } from 'react'
import { Card, Row, Col, Statistic, Table, Typography, Tag, Space } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, DollarOutlined, ShoppingCartOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import DateRangePicker, { rangeToParams } from '../../components/DateRangePicker'
import { reportsV2API } from '../../services/api'

const { Text, Title } = Typography

export default function SalesSummary() {
  const [range, setRange] = useState([dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')])

  const query = useQuery({
    queryKey: ['report-sales-summary', range[0]?.toISOString(), range[1]?.toISOString()],
    queryFn: () => reportsV2API.salesSummary(rangeToParams(range)).then((r) => r.data),
    enabled: !!range[0] && !!range[1],
  })

  const data = query.data
  const summary = data?.summary
  const growth = data?.growth
  const byDay = data?.by_day ?? []

  const renderGrowth = (val) => {
    if (val === null || val === undefined) return <Text type="secondary">—</Text>
    const num = Number(val)
    const up = num >= 0
    return (
      <Text style={{ color: up ? '#52c41a' : '#ff4d4f', fontSize: 13 }}>
        {up ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(num)}%
      </Text>
    )
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>Sales Summary 销售总览</Title>
          <DateRangePicker value={range} onChange={setRange} />
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card loading={query.isLoading}>
            <Statistic
              title={<Space>营业额 <RiseOutlined style={{ color: '#52c41a' }} /></Space>}
              value={Number(summary?.revenue ?? 0)}
              precision={2}
              prefix="RM"
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8 }}>
              对比上期 {renderGrowth(growth?.revenue)}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={query.isLoading}>
            <Statistic
              title={<Space>订单数 <ShoppingCartOutlined /></Space>}
              value={summary?.order_count ?? 0}
              suffix="单"
            />
            <div style={{ marginTop: 8 }}>
              对比上期 {renderGrowth(growth?.orders)}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={query.isLoading}>
            <Statistic
              title="客单价 AOV"
              value={Number(summary?.aov ?? 0)}
              precision={2}
              prefix="RM"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={query.isLoading}>
            <Statistic
              title={<Space>优惠让利 <FallOutlined style={{ color: '#faad14' }} /></Space>}
              value={Number(summary?.discount_given ?? 0)}
              precision={2}
              prefix="RM"
              valueStyle={{ color: '#faad14' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              退款 {summary?.refund_count ?? 0} 单
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="每日明细" loading={query.isLoading}>
        <Table
          rowKey={(r) => r.date}
          dataSource={byDay}
          pagination={false}
          size="middle"
          columns={[
            {
              title: '日期',
              dataIndex: 'date',
              render: (v) => (
                <Space>
                  {dayjs(v).format('YYYY-MM-DD')}
                  <Tag>{dayjs(v).format('ddd')}</Tag>
                </Space>
              ),
            },
            {
              title: '订单数',
              dataIndex: 'orders',
              align: 'right',
              render: (v) => <Text>{v} 单</Text>,
            },
            {
              title: '营业额',
              dataIndex: 'revenue',
              align: 'right',
              render: (v) => <Text strong style={{ color: '#52c41a' }}>RM {Number(v).toFixed(2)}</Text>,
            },
            {
              title: '客单价',
              key: 'aov',
              align: 'right',
              render: (_, r) => (r.orders > 0 ? `RM ${(r.revenue / r.orders).toFixed(2)}` : '—'),
            },
          ]}
        />
      </Card>
    </div>
  )
}
