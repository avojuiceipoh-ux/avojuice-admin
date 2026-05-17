import React, { useState } from 'react'
import {
  Card, Table, Button, Modal, Form, Select, InputNumber,
  Space, Tag, message, Popconfirm, Typography, Alert,
} from 'antd'
import { PlusOutlined, DeleteOutlined, BookOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryAPI, productsAPI } from '../../services/api'

const { Text, Title } = Typography

export default function Recipes() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const recipesQuery = useQuery({
    queryKey: ['admin-recipes'],
    queryFn: () => inventoryAPI.listRecipes().then((r) => r.data.recipes || []),
  })
  const productsQuery = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => productsAPI.list().then((r) => r.data.products || []),
  })
  const invQuery = useQuery({
    queryKey: ['admin-inventory'],
    queryFn: () => inventoryAPI.list().then((r) => r.data.items || []),
  })

  const createMut = useMutation({
    mutationFn: (data) => inventoryAPI.createRecipe(data),
    onSuccess: () => { message.success('已添加'); setModalOpen(false); form.resetFields(); qc.invalidateQueries({ queryKey: ['admin-recipes'] }) },
    onError: (e) => message.error(e.response?.data?.message ?? '添加失败'),
  })
  const deleteMut = useMutation({
    mutationFn: (id) => inventoryAPI.deleteRecipe(id),
    onSuccess: () => { message.success('已删除'); qc.invalidateQueries({ queryKey: ['admin-recipes'] }) },
  })

  // 按产品分组
  const recipes = recipesQuery.data ?? []
  const byProduct = recipes.reduce((acc, r) => {
    const key = r.product_id || 'modifier-or-variant'
    if (!acc[key]) acc[key] = { product_name: r.product_name || '加料 / 变量', recipes: [] }
    acc[key].recipes.push(r)
    return acc
  }, {})

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}><BookOutlined /> 配方 Recipes</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            产品 ↔ 原料用量挂接 · 共 {recipes.length} 条配方
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true) }}>
          挂接新配方
        </Button>
      </div>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="配方逻辑"
        description="为每个产品（或变量/加料）挂接所需原料 + 用量。订单完成时自动按配方扣库存。例如：1 杯招牌牛油果奶昔 = 0.18 kg 鳄梨 + 200 ml 牛奶 + 15 g 蜂蜜。"
      />

      {recipesQuery.isLoading ? (
        <Card loading />
      ) : Object.keys(byProduct).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          还没有配方。点"挂接新配方"开始
        </div>
      ) : (
        Object.values(byProduct).map((bucket, idx) => (
          <Card key={idx} type="inner" title={bucket.product_name} size="small" style={{ marginBottom: 12 }}>
            <Table
              size="small"
              rowKey="id"
              dataSource={bucket.recipes}
              pagination={false}
              columns={[
                { title: '原料', dataIndex: 'item_name',
                  render: (v, row) => <Text strong>{v}</Text>,
                },
                { title: '用量', key: 'qty', width: 130, align: 'right',
                  render: (_, row) => <Text>{Number(row.quantity_per_unit).toFixed(3)} {row.unit}</Text>,
                },
                { title: '单位成本', dataIndex: 'cost_per_unit', width: 110, align: 'right',
                  render: (v) => v ? <Text type="secondary">RM {Number(v).toFixed(4)}</Text> : '—',
                },
                { title: '配方成本', key: 'cost', width: 110, align: 'right',
                  render: (_, row) => row.cost_per_unit ? (
                    <Text strong style={{ color: '#52c41a' }}>
                      RM {(Number(row.quantity_per_unit) * Number(row.cost_per_unit)).toFixed(2)}
                    </Text>
                  ) : '—',
                },
                { title: '挂接对象', key: 'target', width: 140,
                  render: (_, row) => {
                    if (row.variant_option_name) return <Tag color="cyan">变量: {row.variant_option_name}</Tag>
                    if (row.modifier_name) return <Tag color="purple">加料: {row.modifier_name}</Tag>
                    return <Tag color="green">主产品</Tag>
                  },
                },
                { title: '操作', width: 80,
                  render: (_, row) => (
                    <Popconfirm title="删除配方？" onConfirm={() => deleteMut.mutate(row.id)} okText="删除" cancelText="取消">
                      <Button type="link" danger size="small" icon={<DeleteOutlined />} />
                    </Popconfirm>
                  ),
                },
              ]}
            />
          </Card>
        ))
      )}

      <Modal
        title="挂接新配方"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={async () => {
          try {
            const v = await form.validateFields()
            createMut.mutate(v)
          } catch { message.error('请检查表单') }
        }}
        confirmLoading={createMut.isPending}
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="挂接产品（主产品）" name="product_id" rules={[{ required: true, message: '必选' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={(productsQuery.data ?? []).map((p) => ({ value: p.id, label: p.name_cn }))}
            />
          </Form.Item>
          <Form.Item label="原料" name="inventory_id" rules={[{ required: true, message: '必选' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={(invQuery.data ?? []).map((i) => ({ value: i.id, label: `${i.item_name} (${i.unit})` }))}
            />
          </Form.Item>
          <Form.Item label="用量（每杯用多少）" name="quantity_per_unit" rules={[{ required: true, message: '必填' }]}>
            <InputNumber min={0} step={0.001} precision={4} style={{ width: '100%' }} placeholder="例如 0.18" />
          </Form.Item>
          <Text type="secondary" style={{ fontSize: 12 }}>
            提示：用量单位跟原料一致。例如鳄梨单位是 kg → 用量 0.18 = 180 克。
          </Text>
        </Form>
      </Modal>
    </Card>
  )
}
