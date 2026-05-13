import React, { useEffect, useState } from 'react'
import { Table, Input, Typography, message, Tag, Avatar, Space } from 'antd'
import { SearchOutlined, UserOutlined } from '@ant-design/icons'
import { userAPI } from '../services/api'
import dayjs from 'dayjs'

const { Title } = Typography

export default function Users() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })

  useEffect(() => { loadData() }, [pagination.current, search])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await userAPI.list({
        page: pagination.current,
        limit: pagination.pageSize,
        ...(search && { search }),
      })
      const d = res.data || {}
      setData(d.users || [])
      setPagination(p => ({ ...p, total: d.total || 0 }))
    } catch (e) {
      message.error('加载顾客数据失败')
    } finally { setLoading(false) }
  }

  const columns = [
    { title: '顾客', key: 'user',
      render: (_, r) => (
        <Space>
          <Avatar style={{ background: '#52c41a' }} icon={<UserOutlined />} size="small" />
          <span>{r.name || r.phone || '未知'}</span>
        </Space>
      ),
    },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    { title: '会员等级', dataIndex: 'membership_tier', key: 'membership_tier',
      render: v => {
        const colors = { bronze: 'orange', silver: 'silver', gold: 'gold', platinum: 'purple' }
        return v ? <Tag color={colors[v] || 'default'}>{v?.toUpperCase()}</Tag> : '-'
      },
    },
    { title: '钱包余额', dataIndex: 'wallet_balance', key: 'wallet_balance',
      render: v => v ? `RM ${parseFloat(v).toFixed(2)}` : 'RM 0.00' },
    { title: '注册时间', dataIndex: 'created_at', key: 'created_at',
      render: v => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
  ]

  return (
    <div>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>👥 顾客管理</Title>
        <Input
          prefix={<SearchOutlined />}
          placeholder="搜索电话 / 姓名"
          style={{ width: 220 }}
          value={search}
          onChange={e => setSearch(e.target.value)}
          allowClear
        />
      </div>

      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        style={{ background: '#fff', borderRadius: 12 }}
        pagination={{
          ...pagination,
          onChange: page => setPagination(p => ({ ...p, current: page })),
          showTotal: total => `共 ${total} 位顾客`,
        }}
      />
    </div>
  )
}
