/**
 * Modifiers.jsx — 加料管理（独立页面）
 *
 * 可独立添加/编辑/删除加料组和加料项，无需进产品页。
 * 产品页里只需勾选要使用的加料组。
 */

import React, { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Empty, Typography, Button, Space, Popconfirm,
  message, Modal, Form, Input, InputNumber, Select, Switch,
} from 'antd'
import {
  CoffeeOutlined, EditOutlined, DeleteOutlined, PlusOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { modifiersAPI, productsAPI } from '../../services/api'

const { Text, Title } = Typography

export default function Modifiers() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [editingItemKey, setEditingItemKey] = useState('') // "groupId:itemId"
  const [form] = Form.useForm()

  const groupsQuery = useQuery({
    queryKey: ['admin-modifiers-all'],
    queryFn: () => modifiersAPI.listGroups().then((r) => r.data.groups || []),
  })

  const productsQuery = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => productsAPI.list().then((r) => r.data.products || []),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => modifiersAPI.deleteGroup(id),
    onSuccess: () => { message.success('已删除'); qc.invalidateQueries({ queryKey: ['admin-modifiers-all'] }) },
    onError: () => message.error('删除失败'),
  })

  const saveMut = useMutation({
    mutationFn: async (values) => {
      const payload = { ...values }
      if (payload._is_global) payload.product_id = null
      delete payload._is_global
      if (editingGroup) {
        await modifiersAPI.updateGroup(editingGroup.id, payload)
      } else {
        if (!payload.product_id) delete payload.product_id
        await modifiersAPI.createGroup(payload)
      }
    },
    onSuccess: () => {
      message.success(editingGroup ? '已更新' : '已创建')
      setModalOpen(false)
      form.resetFields()
      qc.invalidateQueries({ queryKey: ['admin-modifiers-all'] })
    },
    onError: (e) => message.error(e.response?.data?.message ?? '保存失败'),
  })

  const groups = groupsQuery.data ?? []
  const products = productsQuery.data ?? []

  const openNew = () => {
    setEditingGroup(null)
    form.resetFields()
    form.setFieldsValue({
      is_required: false, selection_type: 'multi',
      min_select: 0, max_select: 99,
      sort_order: groups.length, product_id: null, _is_global: true,
    })
    setModalOpen(true)
  }

  const openEdit = (group) => {
    setEditingGroup(group)
    form.setFieldsValue({
      name: group.name,
      product_id: group.product_id || null,
      _is_global: !group.product_id,
      is_required: group.is_required,
      selection_type: group.selection_type,
      min_select: group.min_select ?? 0,
      max_select: group.max_select ?? 99,
      sort_order: group.sort_order,
    })
    setModalOpen(true)
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}><CoffeeOutlined /> 加料 Modifiers</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>管理所有加料组（珍珠/椰果/燕麦奶等）—— 产品页勾选即可使用</Text>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openNew}>新建加料组</Button>
      </div>

      {groupsQuery.isLoading ? (
        <Empty description="加载中..." />
      ) : groups.length === 0 ? (
        <Empty description={<div><div>还没有加料组</div><Text type="secondary">点击「新建加料组」</Text></div>} />
      ) : (
        groups.map((g) => (
          <Card
            key={g.id}
            type="inner"
            size="small"
            style={{ marginBottom: 12 }}
            title={
              <Space>
                <Text strong>{g.name}</Text>
                {g.product_name ? <Tag color="blue">{g.product_name}</Tag> : <Tag>全局</Tag>}
                <Tag color={g.is_required ? 'green' : 'default'}>{g.is_required ? '必选' : '可选'}</Tag>
                <Tag>{g.selection_type === 'single' ? '单选' : '多选'}</Tag>
                <Tag color="cyan">{g.min_select}~{g.max_select} 选</Tag>
              </Space>
            }
            extra={
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(g)}>编辑</Button>
                <Popconfirm title={`删除「${g.name}」？`} onConfirm={() => deleteMut.mutate(g.id)} okText="删除" cancelText="取消">
                  <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
                </Popconfirm>
              </Space>
            }
          >
            <Table
              size="small"
              rowKey="id"
              dataSource={g.modifiers}
              pagination={false}
              columns={[
                { title: '加料项', dataIndex: 'name', width: 220 },
                { title: '加价', dataIndex: 'price', width: 110, render: (v) => <Text strong style={{ color: '#52c41a' }}>+RM {Number(v).toFixed(2)}</Text> },
                { title: '成本', dataIndex: 'cost', width: 100, render: (v) => v ? `RM ${Number(v).toFixed(2)}` : <Text type="secondary">—</Text> },
                { title: '状态', dataIndex: 'is_available', width: 80, render: (v) => v ? <Tag color="success">在售</Tag> : <Tag>下架</Tag> },
                { title: '操作', width: 140, render: (_, row) => (
                  <Space size={0}>
                    <Button type="link" size="small" onClick={() => setEditingItemKey(`${g.id}:${row.id}`)}>编辑</Button>
                    <Button type="link" danger size="small" onClick={() => {
                      modifiersAPI.deleteItem(row.id).then(() => qc.invalidateQueries({ queryKey: ['admin-modifiers-all'] })).catch(() => message.error('删除失败'))
                    }}>删除</Button>
                  </Space>
                )},
              ]}
            />
            <AddModifierRow groupId={g.id} items={g.modifiers} editingKey={editingItemKey} onDone={() => { setEditingItemKey(''); qc.invalidateQueries({ queryKey: ['admin-modifiers-all'] }) }} />
          </Card>
        ))
      )}

      <Modal
        title={editingGroup ? '编辑加料组' : '新建加料组'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saveMut.isPending}
      >
        <Form form={form} layout="vertical" onFinish={(v) => saveMut.mutate(v)}>
          <Form.Item label="加料组名称" name="name" rules={[{ required: true, message: '必填' }]}>
            <Input placeholder="加料 / Topping" />
          </Form.Item>

          {/* 防误绑：默认全局，关掉开关才显示产品下拉 */}
          <Form.Item
            label="全局加料（推荐 — 所有产品共享，如珍珠、椰果）"
            name="_is_global"
            valuePropName="checked"
            extra="关掉此开关后，才能把这个加料组绑给某个具体产品"
          >
            <Switch checkedChildren="全局" unCheckedChildren="单产品" />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev._is_global !== cur._is_global}
          >
            {({ getFieldValue }) => getFieldValue('_is_global') ? null : (
              <Form.Item
                label="关联产品"
                name="product_id"
                rules={[{ required: true, message: '关掉全局开关后必须选一个产品' }]}
              >
                <Select
                  allowClear
                  placeholder="选择该加料组只属于的产品"
                  showSearch
                  optionFilterProp="label"
                  options={products.map((p) => ({ value: p.id, label: p.name_cn }))}
                />
              </Form.Item>
            )}
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item label="必选" name="is_required" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item label="选择方式" name="selection_type">
              <Select options={[{ value: 'single', label: '单选' }, { value: 'multi', label: '多选' }]} />
            </Form.Item>
            <Form.Item label="最少选" name="min_select">
              <InputNumber min={0} max={99} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="最多选" name="max_select">
              <InputNumber min={1} max={99} style={{ width: '100%' }} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </Card>
  )
}

// ─── 添加 / 编辑加料项行 ──────────────────────────────
function AddModifierRow({ groupId, items, editingKey, onDone }) {
  const [open, setOpen] = useState(false)

  const editTarget = editingKey.startsWith(`${groupId}:`)
    ? items.find(o => editingKey === `${groupId}:${o.id}`)
    : null

  const [name, setName] = useState(editTarget?.name || '')
  const [price, setPrice] = useState(editTarget?.price || 1)
  const [cost, setCost] = useState(editTarget?.cost || 0)

  if (editTarget && !open) {
    setName(editTarget.name); setPrice(editTarget.price); setCost(editTarget.cost || 0); setOpen(true)
  }

  const handleSubmit = async () => {
    if (!name.trim()) return
    try {
      if (editTarget) {
        await modifiersAPI.updateItem(editTarget.id, { name: name.trim(), price, cost })
      } else {
        await modifiersAPI.createItem({ modifier_group_id: groupId, name: name.trim(), price, cost, sort_order: items.length })
      }
      setName(''); setPrice(1); setCost(0); setOpen(false); onDone()
    } catch (e) { message.error('保存失败') }
  }

  if (!open) {
    return <Button size="small" icon={<PlusOutlined />} style={{ marginTop: 8 }} onClick={() => setOpen(true)}>添加加料项</Button>
  }

  return (
    <Space style={{ marginTop: 8 }}>
      <Input placeholder="加料名（珍珠 / 椰果...）" value={name} onChange={(e) => setName(e.target.value)} style={{ width: 160 }} />
      <InputNumber placeholder="加价" value={price} onChange={setPrice} prefix="RM" min={0} step={0.5} style={{ width: 100 }} />
      <InputNumber placeholder="成本" value={cost} onChange={setCost} prefix="RM" min={0} step={0.1} style={{ width: 100 }} />
      <Button type="primary" size="small" onClick={handleSubmit}>{editTarget ? '保存' : '添加'}</Button>
      <Button size="small" onClick={() => { setOpen(false); setName(''); setPrice(1); setCost(0); onDone() }}>取消</Button>
    </Space>
  )
}
