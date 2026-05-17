import React, { useState } from 'react'
import { Card, Table, Typography, Tag, Space, Input, Button } from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import DateRangePicker, { rangeToParams } from '../../components/DateRangePicker'
import { reportsV2API } from '../../services/api'

const { Text, Title } = Typography

const STATUS_LABEL = {
  pending_payment: { label: '待支付', color: 'orange' },
  paid:            { label: '已支付', color: 'blue' },
  preparing:       { label: '制作中', color: 'cyan' },
  ready:           { label: '可取餐', color: 'green' },
  completed:       { label: '已完成', color: 'success' },
  cancelled:       { label: '已取消', color: 'red' },
}

const CHANNEL_LABEL = {
  app:  'App',
  pos:  'POS',
  grab: 'Grab',
  foodpanda: 'Foodpanda',
}

export default function Receipts() {
  const [range, setRange] = useState([dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')])
  const [search, setSearch] = useState('')

  const query = useQuery({
    queryKey: ['report-receipts', range[0]?.toISOString(), range[1]?.toISOString()],
    queryFn: () => reportsV2API.receipts({ ...rangeToParams(range), limit: 200 }).then((r) => r.data),
    enabled: !!range[0] && !!range[1],
  })

  const all = query.data?.receipts ?? []
  const filtered = search
    ? all.filter((r) =>
        (r.pickup_code || '').includes(search) ||
        (r.customer_phone || '').includes(search) ||
        String(r.total_paid || '').includes(search),
      )
    : all

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <Title level={4} style={{ margin: 0 }}>Receipts 收据流水</Title>
          <Space wrap>
            <Input
              prefix={<SearchOutlined />}
              placeholder="取餐码 / 手机号 / 金额"
              allowClear
              style={{ width: 240 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <DateRangePicker value={range} onChange={setRange} />
          </Space>
        </Space>
      </Card>

      <Card loading={query.isLoading}>
        <Table
          rowKey="id"
          dataSource={filtered}
          pagination={{ pageSize: 30, showSizeChanger: true }}
          size="middle"
          columns={[
            {
              title: '时间',
              dataIndex: 'created_at',
              width: 150,
              render: (v) => (
                <div>
                  <div>{dayjs(v).format('MM-DD HH:mm')}</div>
                  <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(v).fromNow ? dayjs(v).format('ddd') : ''}</Text>
                </div>
              ),
            },
            {
              title: '取餐码',
              dataIndex: 'pickup_code',
              width: 100,
              render: (v) => <Text strong style={{ color: '#52c41a', letterSpacing: 1 }}>{v}</Text>,
            },
            {
              title: '渠道',
              dataIndex: 'channel',
              width: 80,
              render: (v) => <Tag color={v === 'pos' ? 'purple' : 'blue'}>{CHANNEL_LABEL[v] || v}</Tag>,
            },
            {
              title: '顾客',
              key: 'customer',
              width: 160,
              render: (_, row) => (
                row.customer_phone ? (
                  <div style={{ fontSize: 12 }}>
                    <div>{row.customer_name || '—'}</div>
                    <Text type="secondary">{row.customer_phone}</Text>
                  </div>
                ) : <Text type="secondary">walk-in</Text>
              ),
            },
            {
              title: '商品数',
              dataIndex: 'item_count',
              width: 70,
              align: 'center',
              render: (v) => `${v}`,
            },
            {
              title: '小计',
              dataIndex: 'subtotal',
              width: 100,
              align: 'right',
              render: (v) => `RM ${Number(v || 0).toFixed(2)}`,
            },
            {
              title: '优惠',
              dataIndex: 'discount_amount',
              width: 90,
              align: 'right',
              render: (v) => v > 0 ? <Text style={{ color: '#faad14' }}>-RM {Number(v).toFixed(2)}</Text> : '—',
            },
            {
              title: '实付',
              dataIndex: 'total_paid',
              width: 110,
              align: 'right',
              render: (v) => <Text strong style={{ color: '#52c41a' }}>RM {Number(v || 0).toFixed(2)}</Text>,
            },
            {
              title: '支付方式',
              dataIndex: 'payment_method',
              width: 100,
              render: (v) => <Tag>{v || '—'}</Tag>,
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 100,
              render: (v) => {
                const s = STATUS_LABEL[v] || { label: v, color: 'default' }
                return <Tag color={s.color}>{s.label}</Tag>
              },
            },
            {
              title: '员工',
              dataIndex: 'staff_name',
              width: 100,
              render: (v) => v || <Text type="secondary">—</Text>,
            },
          ]}
        />
      </Card>
    </div>
  )
}
