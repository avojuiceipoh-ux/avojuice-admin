import React, { useState } from 'react'
import { Card, Table, Typography, Tag, Space, Row, Col, Statistic } from 'antd'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import DateRangePicker, { rangeToParams } from '../../components/DateRangePicker'
import { reportsV2API } from '../../services/api'

const { Text, Title } = Typography

const TYPE_LABEL = {
  percentage: '百分比',
  fixed:      '固定金额',
  percent:    '百分比',
  amount:     '固定金额',
}

export default function DiscountUsage() {
  const [range, setRange] = useState([dayjs().subtract(29, 'day').startOf('day'), dayjs().endOf('day')])

  const query = useQuery({
    queryKey: ['report-discount-usage', range[0]?.toISOString(), range[1]?.toISOString()],
    queryFn: () => reportsV2API.discountUsage(rangeToParams(range)).then((r) => r.data),
    enabled: !!range[0] && !!range[1],
  })

  const discounts = query.data?.discounts ?? []
  const totalDiscount = discounts.reduce((s, d) => s + Number(d.total_discount), 0)
  const totalUsage = discounts.reduce((s, d) => s + Number(d.used_count), 0)

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>Discount Usage 折扣使用</Title>
          <DateRangePicker value={range} onChange={setRange} />
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="总让利金额" value={totalDiscount} precision={2} prefix="RM" valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="总使用次数" value={totalUsage} suffix="次" />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="折扣种类" value={discounts.length} suffix="个" />
          </Card>
        </Col>
      </Row>

      <Card loading={query.isLoading}>
        <Table
          rowKey="id"
          dataSource={discounts}
          pagination={false}
          size="middle"
          columns={[
            {
              title: '名称',
              key: 'name',
              render: (_, row) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{row.name}</div>
                  {row.code && <Tag color="cyan" style={{ marginTop: 4 }}>码: {row.code}</Tag>}
                </div>
              ),
            },
            {
              title: '类型',
              dataIndex: 'type',
              width: 100,
              render: (v) => <Tag>{TYPE_LABEL[v] || v}</Tag>,
            },
            {
              title: '优惠值',
              dataIndex: 'value',
              width: 100,
              align: 'right',
              render: (v, row) => {
                if (row.type === 'percentage' || row.type === 'percent') return `${v}% off`
                if (row.type === 'fixed' || row.type === 'amount') return `RM ${Number(v).toFixed(2)}`
                return v
              },
            },
            {
              title: '使用次数',
              dataIndex: 'used_count',
              width: 100,
              align: 'right',
              sorter: (a, b) => a.used_count - b.used_count,
            },
            {
              title: '影响订单',
              dataIndex: 'order_count',
              width: 100,
              align: 'right',
              render: (v) => `${v} 单`,
            },
            {
              title: '总让利',
              dataIndex: 'total_discount',
              width: 130,
              align: 'right',
              sorter: (a, b) => a.total_discount - b.total_discount,
              defaultSortOrder: 'descend',
              render: (v) => <Text strong style={{ color: '#faad14' }}>RM {Number(v).toFixed(2)}</Text>,
            },
          ]}
        />
      </Card>
    </div>
  )
}
