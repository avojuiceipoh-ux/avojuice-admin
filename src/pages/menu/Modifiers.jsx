/**
 * Modifiers.jsx — 加料管理 overview（V2）
 */

import React from 'react'
import { Card, Table, Tag, Empty, Typography, Alert, Button, Space, Popconfirm, message } from 'antd'
import { CoffeeOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { modifiersAPI } from '../../services/api'

const { Text, Title } = Typography

export default function Modifiers() {
  const qc = useQueryClient()

  const groupsQuery = useQuery({
    queryKey: ['admin-modifiers-all'],
    queryFn: () => modifiersAPI.listGroups().then((r) => r.data.groups || []),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => modifiersAPI.deleteGroup(id),
    onSuccess: () => {
      message.success('已删除')
      qc.invalidateQueries({ queryKey: ['admin-modifiers-all'] })
    },
    onError: () => message.error('删除失败'),
  })

  const groups = groupsQuery.data ?? []

  const grouped = groups.reduce((acc, g) => {
    const key = g.product_id || 'global'
    if (!acc[key]) acc[key] = { product_name: g.product_id ? g.product_name : '全局共享 Modifier', groups: [] }
    acc[key].groups.push(g)
    return acc
  }, {})

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <CoffeeOutlined /> 加料 Modifiers
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          所有产品的加料项（珍珠 / 椰果 / 燕麦奶等）总览
        </Text>
      </div>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="提示"
        description={
          <span>
            产品独有的加料，请到 <Link to="/menu/items">产品 Items</Link> → 产品详情 → 加料 Tab 添加（操作更直观）。这里也支持创建全局共享 Modifier 组（不绑定特定产品）。
          </span>
        }
      />

      {groupsQuery.isLoading ? (
        <Empty description="加载中..." />
      ) : Object.keys(grouped).length === 0 ? (
        <Empty
          description={
            <div>
              <div>还没有任何加料组</div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                在产品详情页 → 加料 Tab 里添加（珍珠、椰果、燕麦奶等）
              </Text>
            </div>
          }
        />
      ) : (
        Object.values(grouped).map((bucket, idx) => (
          <Card key={idx} type="inner" title={bucket.product_name} style={{ marginBottom: 12 }} size="small">
            {bucket.groups.map((g) => (
              <div key={g.id} style={{ marginBottom: 10 }}>
                <Space style={{ marginBottom: 6 }}>
                  <Text strong>{g.name}</Text>
                  <Tag color={g.is_required ? 'green' : 'default'}>
                    {g.is_required ? '必选' : '可选'}
                  </Tag>
                  <Tag>{g.selection_type === 'single' ? '单选' : '多选'}</Tag>
                  <Tag color="cyan">{g.min_select}~{g.max_select} 选</Tag>
                  <Popconfirm
                    title={`删除加料组「${g.name}」？`}
                    onConfirm={() => deleteMut.mutate(g.id)}
                    okText="删除"
                    cancelText="取消"
                  >
                    <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除组</Button>
                  </Popconfirm>
                </Space>
                <Table
                  size="small"
                  rowKey="id"
                  dataSource={g.modifiers}
                  pagination={false}
                  columns={[
                    { title: '加料项', dataIndex: 'name', width: 220 },
                    {
                      title: '加价',
                      dataIndex: 'price',
                      width: 110,
                      render: (v) => <Text strong style={{ color: '#52c41a' }}>+RM {Number(v).toFixed(2)}</Text>,
                    },
                    {
                      title: '成本',
                      dataIndex: 'cost',
                      width: 100,
                      render: (v) => v ? `RM ${Number(v).toFixed(2)}` : <Text type="secondary">—</Text>,
                    },
                    {
                      title: '状态',
                      dataIndex: 'is_available',
                      width: 80,
                      render: (v) => v ? <Tag color="success">在售</Tag> : <Tag>下架</Tag>,
                    },
                  ]}
                />
              </div>
            ))}
          </Card>
        ))
      )}
    </Card>
  )
}
