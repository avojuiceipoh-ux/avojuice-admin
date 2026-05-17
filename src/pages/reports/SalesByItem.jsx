import React, { useState } from 'react'
import { Card, Table, Typography, Tag, Space, Progress, Image, Statistic, Row, Col } from 'antd'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import DateRangePicker, { rangeToParams } from '../../components/DateRangePicker'
import { reportsV2API } from '../../services/api'

const { Text, Title } = Typography

export default function SalesByItem() {
  const [range, setRange] = useState([dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')])

  const query = useQuery({
    queryKey: ['report-sales-by-item', range[0]?.toISOString(), range[1]?.toISOString()],
    queryFn: () => reportsV2API.salesByItem(rangeToParams(range)).then((r) => r.data),
    enabled: !!range[0] && !!range[1],
  })

  const items = query.data?.items ?? []
  const totalRevenue = query.data?.total_revenue ?? 0

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>Sales by Item 单品销售</Title>
          <DateRangePicker value={range} onChange={setRange} />
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card><Statistic title="总营业额" value={Number(totalRevenue)} precision={2} prefix="RM" valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card><Statistic title="售出产品种类" value={items.length} suffix="种" /></Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="畅销 #1"
              value={items[0]?.name_cn ?? '—'}
              valueStyle={{ fontSize: 18 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {items[0] ? `${items[0].qty} 杯 · RM ${Number(items[0].revenue).toFixed(2)}` : '暂无数据'}
            </Text>
          </Card>
        </Col>
      </Row>

      <Card loading={query.isLoading}>
        <Table
          rowKey="id"
          dataSource={items}
          pagination={{ pageSize: 20 }}
          size="middle"
          columns={[
            {
              title: '#',
              key: 'rank',
              width: 50,
              render: (_, __, idx) => (
                <Tag color={idx === 0 ? 'gold' : idx === 1 ? 'default' : idx === 2 ? 'orange' : 'default'}>
                  {idx + 1}
                </Tag>
              ),
            },
            {
              title: '产品',
              key: 'name',
              render: (_, row) => (
                <Space>
                  {row.image_url ? (
                    <Image src={row.image_url} width={32} height={32} preview={false} style={{ borderRadius: 4 }} />
                  ) : (
                    <span style={{ fontSize: 20 }}>🥤</span>
                  )}
                  <div>
                    <div style={{ fontWeight: 600 }}>{row.name_cn}</div>
                    {row.category_name && <Tag color="green" style={{ marginTop: 2 }}>{row.category_name}</Tag>}
                  </div>
                </Space>
              ),
            },
            {
              title: '销量',
              dataIndex: 'qty',
              align: 'right',
              width: 100,
              sorter: (a, b) => a.qty - b.qty,
              render: (v) => <Text>{v} 杯</Text>,
            },
            {
              title: '营业额',
              dataIndex: 'revenue',
              align: 'right',
              width: 130,
              sorter: (a, b) => a.revenue - b.revenue,
              defaultSortOrder: 'descend',
              render: (v) => <Text strong style={{ color: '#52c41a' }}>RM {Number(v).toFixed(2)}</Text>,
            },
            {
              title: '占比',
              dataIndex: 'percent',
              width: 180,
              render: (v) => <Progress percent={Number(v)} size="small" strokeColor="#52c41a" />,
            },
            {
              title: '毛利率',
              dataIndex: 'margin_percent',
              align: 'right',
              width: 100,
              render: (v) => {
                if (v === null || v === undefined) return <Text type="secondary">—</Text>
                const n = Number(v)
                const color = n >= 60 ? '#52c41a' : n >= 40 ? '#faad14' : '#ff4d4f'
                return <Text style={{ color }}>{n.toFixed(0)}%</Text>
              },
            },
            {
              title: '出现订单',
              dataIndex: 'in_orders',
              align: 'right',
              width: 100,
              render: (v) => `${v} 单`,
            },
          ]}
        />
      </Card>
    </div>
  )
}
