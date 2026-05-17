import React, { useState } from 'react'
import {
  Table, Card, Button, Drawer, Form, Input, InputNumber, Select,
  Space, Tag, message, Popconfirm, Typography, Alert,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, InboxOutlined, WarningOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryAPI, outletsAPI } from '../../services/api'

const { Text, Title } = Typography

const UNIT_OPTIONS = ['kg', 'g', 'L', 'ml', 'pcs', 'box', 'pack', 'cup']
const TYPE_OPTIONS = [
  { value: 'ingredient',  label: '原料（水果/糖浆/茶基）' },
  { value: 'packaging',   label: '包材（杯/盖/吸管）' },
  { value: 'consumable',  label: '耗材（纸巾/手套）' },
  { value: 'other',       label: '其他' },
]

export default function InventoryItems() {
  const qc = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()

  const listQuery = useQuery({
    queryKey: ['admin-inventory'],
    queryFn: () => inventoryAPI.list().then((r) => r.data.items || []),
  })
  const outletsQuery = useQuery({
    queryKey: ['outlets'],
    queryFn: () => outletsAPI.list().then((r) => r.data.outlets || []),
  })

  const createMut = useMutation({
    mutationFn: (data) => inventoryAPI.create(data),
    onSuccess: () => { message.success('已添加'); setDrawerOpen(false); form.resetFields(); qc.invalidateQueries({ queryKey: ['admin-inventory'] }) },
    onError: (e) => message.error(e.response?.data?.message ?? '添加失败'),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => inventoryAPI.update(id, data),
    onSuccess: () => { message.success('已更新'); setDrawerOpen(false); setEditing(null); form.resetFields(); qc.invalidateQueries({ queryKey: ['admin-inventory'] }) },
    onError: (e) => message.error(e.response?.data?.message ?? '更新失败'),
  })
  const deleteMut = useMutation({
    mutationFn: (id) => inventoryAPI.delete(id),
    onSuccess: () => { message.success('已删除'); qc.invalidateQueries({ queryKey: ['admin-inventory'] }) },
  })

  const items = listQuery.data ?? []
  const lowStock = items.filter((i) => i.is_low)

  const openDrawer = (record) => {
    setEditing(record)
    if (record) form.setFieldsValue(record)
    else { form.resetFields(); form.setFieldsValue({ item_type: 'ingredient', quantity: 0 }) }
    setDrawerOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const v = await form.validateFields()
      if (editing) updateMut.mutate({ id: editing.id, data: v })
      else createMut.mutate(v)
    } catch { message.error('请检查表单') }
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}><InboxOutlined /> 原料 / 库存</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>共 {items.length} 项 · 低库存 {lowStock.length} 项</Text>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => openDrawer(null)}>新增原料</Button>
      </div>

      {lowStock.length > 0 && (
        <Alert type="warning" showIcon icon={<WarningOutlined />} style={{ marginBottom: 16 }}
          message={`${lowStock.length} 项原料低库存`}
          description={lowStock.map((i) => i.item_name).join('、')}
        />
      )}

      <Table
        loading={listQuery.isLoading}
        rowKey="id"
        size="middle"
        dataSource={items}
        pagination={{ pageSize: 30 }}
        columns={[
          { title: '名称', dataIndex: 'item_name',
            render: (v, row) => (
              <Space>
                <Text strong>{v}</Text>
                {row.is_low && <Tag color="red">低库存</Tag>}
              </Space>
            ),
          },
          { title: '类型', dataIndex: 'item_type', width: 100,
            render: (v) => <Tag>{TYPE_OPTIONS.find((o) => o.value === v)?.label || v}</Tag>,
          },
          { title: '门店', dataIndex: 'outlet_name', width: 140 },
          { title: '当前量', key: 'qty', width: 120, align: 'right',
            render: (_, row) => <Text strong>{Number(row.quantity).toFixed(2)} {row.unit}</Text>,
          },
          { title: '预警阈值', dataIndex: 'low_threshold', width: 100, align: 'right',
            render: (v, row) => v ? `${v} ${row.unit}` : <Text type="secondary">—</Text>,
          },
          { title: '单位成本', dataIndex: 'cost_per_unit', width: 110, align: 'right',
            render: (v, row) => v ? `RM ${Number(v).toFixed(2)}/${row.unit}` : <Text type="secondary">—</Text>,
          },
          { title: '保质期', dataIndex: 'shelf_life_days', width: 90, align: 'center',
            render: (v) => v ? `${v} 天` : <Text type="secondary">—</Text>,
          },
          { title: '供应商', dataIndex: 'supplier_name', width: 140 },
          { title: '操作', width: 160,
            render: (_, row) => (
              <Space>
                <Button type="link" icon={<EditOutlined />} onClick={() => openDrawer(row)}>编辑</Button>
                <Popconfirm title="确认删除？" onConfirm={() => deleteMut.mutate(row.id)} okText="删除" cancelText="取消">
                  <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Drawer
        title={editing ? '编辑原料' : '新增原料'}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null) }}
        width={480}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" loading={createMut.isPending || updateMut.isPending} onClick={handleSubmit}>保存</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item label="名称" name="item_name" rules={[{ required: true, message: '必填' }]}>
            <Input placeholder="鳄梨 / 芒果 / 珍珠..." />
          </Form.Item>
          <Form.Item label="门店" name="outlet_id" rules={[{ required: true, message: '必填' }]}>
            <Select options={(outletsQuery.data ?? []).map((o) => ({ value: o.id, label: o.name }))} />
          </Form.Item>
          <Form.Item label="类型" name="item_type">
            <Select options={TYPE_OPTIONS} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <Form.Item label="当前库存量" name="quantity">
              <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="单位" name="unit" rules={[{ required: true, message: '必填' }]}>
              <Select options={UNIT_OPTIONS.map((u) => ({ value: u, label: u }))} />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label="预警阈值（低于即提醒）" name="low_threshold">
              <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="单位成本 RM" name="cost_per_unit">
              <InputNumber min={0} step={0.01} precision={4} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label="SKU" name="sku"><Input /></Form.Item>
            <Form.Item label="保质期（天）" name="shelf_life_days">
              <InputNumber min={1} max={3650} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item label="供应商" name="supplier_name"><Input /></Form.Item>
          <Form.Item label="备注" name="notes"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Drawer>
    </Card>
  )
}
