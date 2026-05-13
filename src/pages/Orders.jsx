import React, { useEffect, useState } from 'react'
import { Table, Select, Tag, Typography, Space, Button, message, Badge } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { orderAPI } from '../services/api'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const STATUS_OPTIONS = [
  { value: 'pending',   label: '待确认', color: 'orange' },
  { value: 'confirmed', label: '已确认', color: 'blue' },
  { value: 'preparing', label: '制作中', color: 'purple' },
  { value: 'ready',     label: '待取餐', color: 'cyan' },
  { value: 'completed', label: '已完成', color: 'green' },
  { value: 'cancelled', label: '已取消', color: 'red' },
]

const statusMap = Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s]))

export default function Orders() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState(null)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })

  useEffect(() => { loadData() }, [statusFilter, pagination.current])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await orderAPI.list({
        page: pagination.current,
        limit: pagination.pageSize,
        ...(statusFilter && { status: statusFilter }),
      })
      const d = res.data || {}
      setData(d.orders || [])
      setPagination(p => ({ ...p, total: d.total || 0 }))
    } catch (e) {
      message.error('加载订单失败')
    } finally { setLoading(false) }
  }

  const updateStatus = async (id, status) => {
    try {
      await orderAPI.update(id, { status })
      message.success('状态已更新')
      loadData()
    } catch (e) {
      message.error(e.response?.data?.message || '更新失败')
    }
  }

  const columns = [
    { title: '订单号', dataIndex: 'order_number', key: 'order_number', width: 150,
      render: v => <Text code style={{ fontSize: 12 }}>{v || '-'}</Text> },
    { title: '金额', dataIndex: 'total_amount', key: 'total_amount', width: 100,
      render: v => <Text strong style={{ color: '#52c41a' }}>RM {parseFloat(v || 0).toFixed(2)}</Text> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 130,
      render: (v, record) => (
        <Select
          size="small"
          value={v}
          style={{ width: 110 }}
          onChange={(val) => updateStatus(record.id, val)}
          options={STATUS_OPTIONS.map(s => ({
            value: s.value,
            label: <Tag color={s.color} style={{ margin: 0 }}>{s.label}</Tag>,
          }))}
        />
      ),
    },
    { title: '取餐方式', dataIndex: 'order_type', key: 'order_type', width: 90,
      render: v => <Tag>{v === 'pickup' ? '自取' : v === 'delivery' ? '外卖' : v || '-'}</Tag> },
    { title: '下单时间', dataIndex: 'created_at', key: 'created_at',
      render: v => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
  ]

  return (
    <div>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>🛒 订单管理</Title>
        <Space>
          <Select
            placeholder="筛选状态"
            allowClear
            value={statusFilter}
            onChange={v => { setStatusFilter(v); setPagination(p => ({ ...p, current: 1 })) }}
            style={{ width: 130 }}
            options={STATUS_OPTIONS.map(s => ({
              value: s.value,
              label: <Tag color={s.color}>{s.label}</Tag>,
            }))}
          />
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            刷新
          </Button>
        </Space>
      </div>

      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        style={{ background: '#fff', borderRadius: 12 }}
        pagination={{
          ...pagination,
          onChange: (page) => setPagination(p => ({ ...p, current: page })),
          showTotal: (total) => `共 ${total} 条订单`,
        }}
      />
    </div>
  )
}
