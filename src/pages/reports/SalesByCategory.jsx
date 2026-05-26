import React, { useState } from 'react'
import { Card, Table, Typography, Tag, Space, Progress, Row, Col, Statistic } from 'antd'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import DateRangePicker, { rangeToParams } from '../../components/DateRangePicker'
import { reportsV2API } from '../../services/api'

const { Text, Title } = Typography

export default function SalesByCategory() {
  const [range, setRange] = useState([dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')])

  const query = useQuery({
    queryKey: ['report-sales-by-category', range[0]?.toISOString(), range[1]?.toISOString()],
    queryFn: () => reportsV2API.salesByCategory(rangeToParams(range)).then((r) => r.data),
    enabled: !!range[0] && !!range[1],
  })

  const categories = query.data?.categories ?? []
  const totalRevenue = query.data?.total_revenue ?? 0

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>Sales by Category 品类销售</Title>
          <DateRangePicker value={range} onChange={setRange} />
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12}>
          <Card style={{ height: '100%' }}>
            <Statistic title="总营业额" value={Number(totalRevenue)} precision={2} prefix="RM" valueStyle={{ color: '#52c41a' }} />
            <div style={{ marginTop: 8, fontSize: 13, color: '#999' }}>{categories.length} 个品类</div>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card style={{ height: '100%' }}>
            <Statistic
              title="最大品类"
              value={categories[0]?.name ?? '—'}
              valueStyle={{ fontSize: 18 }}
            />
            <div style={{ marginTop: 8, fontSize: 13, color: '#999' }}>
              {categories[0] ? `${categories[0].percent}% · RM ${Number(categories[0].revenue).toFixed(2)}` : '暂无'}
            </div>
          </Card>
        </Col>
      </Row>

      <Card loading={query.isLoading}>
        <Table
          rowKey="id"
          dataSource={categories}
          pagination={false}
          size="middle"
          columns={[
            {
              title: '品类',
              key: 'name',
              render: (_, row) => (
                <Space>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 4,
                      background: row.color_hex || '#52c41a',
                    }}
                  />
                  <Text strong>{row.name}</Text>
                </Space>
              ),
            },
            {
              title: '销量',
              dataIndex: 'qty',
              align: 'right',
              width: 100,
              render: (v) => <Text>{v} 杯</Text>,
            },
            {
              title: '营业额',
              dataIndex: 'revenue',
              align: 'right',
              width: 130,
              render: (v) => <Text strong style={{ color: '#52c41a' }}>RM {Number(v).toFixed(2)}</Text>,
            },
            {
              title: '占比',
              dataIndex: 'percent',
              render: (v, row) => (
                <Space style={{ width: '100%' }}>
                  <Progress
                    percent={Number(v)}
                    size="small"
                    strokeColor={row.color_hex || '#52c41a'}
                    style={{ flex: 1, minWidth: 200 }}
                  />
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}
