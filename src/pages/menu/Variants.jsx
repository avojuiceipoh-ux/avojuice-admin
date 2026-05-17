/**
 * Variants.jsx — 变量管理 overview（V2）
 *
 * 按产品分组列出所有变量组 + 选项。
 * 详细编辑（添加新组、加选项）仍推荐在产品详情里做（更直观）。
 */

import React from 'react'
import { Card, Table, Tag, Empty, Typography, Alert, Button, Space, Popconfirm, message } from 'antd'
import { ExperimentOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { variantsAPI } from '../../services/api'

const { Text, Title } = Typography

export default function Variants() {
  const qc = useQueryClient()

  const groupsQuery = useQuery({
    queryKey: ['admin-variants-all'],
    queryFn: () => variantsAPI.listGroups().then((r) => r.data.groups || []),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => variantsAPI.deleteGroup(id),
    onSuccess: () => {
      message.success('已删除')
      qc.invalidateQueries({ queryKey: ['admin-variants-all'] })
    },
    onError: () => message.error('删除失败'),
  })

  const groups = groupsQuery.data ?? []

  // 按产品分组
  const grouped = groups.reduce((acc, g) => {
    const key = g.product_id || 'global'
    if (!acc[key]) acc[key] = { product_name: g.product_name || '全局共享', groups: [] }
    acc[key].groups.push(g)
    return acc
  }, {})

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <ExperimentOutlined /> 变量 Variants
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          所有产品的变量（杯型 / 茶基 / 糖度 / 冰度）总览
        </Text>
      </div>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="提示"
        description={
          <span>
            添加新变量 / 选项，请到 <Link to="/menu/items">产品 Items</Link> 页面，进入产品详情 → 变量 Tab 操作（更直观）。
          </span>
        }
      />

      {groupsQuery.isLoading ? (
        <Empty description="加载中..." />
      ) : Object.keys(grouped).length === 0 ? (
        <Empty
          description={
            <div>
              <div>还没有任何变量组</div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                在产品详情页里添加变量（杯型 M/L / 茶基 / 糖度等）
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
                  <Popconfirm
                    title={`删除变量组「${g.name}」？`}
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
                  dataSource={g.options}
                  pagination={false}
                  columns={[
                    { title: '选项', dataIndex: 'name', width: 200 },
                    {
                      title: '价格调整',
                      dataIndex: 'price_delta',
                      width: 120,
                      render: (v) =>
                        Number(v) === 0 ? (
                          <Text type="secondary">±0</Text>
                        ) : (
                          <Text strong>{v > 0 ? `+RM ${v}` : `-RM ${Math.abs(v)}`}</Text>
                        ),
                    },
                    {
                      title: '默认',
                      dataIndex: 'is_default',
                      width: 80,
                      render: (v) => (v ? <Tag color="green">默认</Tag> : null),
                    },
                    {
                      title: '状态',
                      dataIndex: 'is_available',
                      width: 80,
                      render: (v) => (v ? <Tag color="success">在售</Tag> : <Tag>下架</Tag>),
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
