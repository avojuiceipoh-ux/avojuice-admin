/**
 * Variants.jsx — 变量管理（独立页面）
 *
 * 可独立添加/编辑/删除变量组和选项，无需进产品页。
 * 产品页里只需勾选要使用的变量组。
 */

import React, { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Empty, Typography, Button, Space, Popconfirm,
  message, Modal, Form, Input, InputNumber, Select, Switch,
} from 'antd'
import {
  ExperimentOutlined, EditOutlined, DeleteOutlined, PlusOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { variantsAPI, productsAPI } from '../../services/api'

const { Text, Title } = Typography

export default function Variants() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [editingOptionKey, setEditingOptionKey] = useState('') // 格式: "groupId:optionId"
  const [form] = Form.useForm()

  const groupsQuery = useQuery({
    queryKey: ['admin-variants-all'],
    queryFn: () => variantsAPI.listGroups().then((r) => r.data.groups || []),
  })

  const productsQuery = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => productsAPI.list().then((r) => r.data.products || []),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => variantsAPI.deleteGroup(id),
    onSuccess: () => { message.success('已删除'); qc.invalidateQueries({ queryKey: ['admin-variants-all'] }) },
    onError: () => message.error('删除失败'),
  })

  const saveMut = useMutation({
    mutationFn: async (values) => {
      const payload = { ...values }
      if (!payload.product_id) delete payload.product_id
      if (editingGroup) {
        await variantsAPI.updateGroup(editingGroup.id, payload)
      } else {
        await variantsAPI.createGroup(payload)
      }
    },
    onSuccess: () => {
      message.success(editingGroup ? '已更新' : '已创建')
      setModalOpen(false)
      form.resetFields()
      qc.invalidateQueries({ queryKey: ['admin-variants-all'] })
    },
    onError: (e) => message.error(e.response?.data?.message ?? '保存失败'),
  })

  const groups = groupsQuery.data ?? []
  const products = productsQuery.data ?? []

  const openNew = () => {
    setEditingGroup(null)
    form.resetFields()
    form.setFieldsValue({ is_required: true, selection_type: 'single', sort_order: groups.length, product_id: null })
    setModalOpen(true)
  }

  const openEdit = (group) => {
    setEditingGroup(group)
    form.setFieldsValue({
      name: group.name,
      product_id: group.product_id || null,
      is_required: group.is_required,
      selection_type: group.selection_type,
      sort_order: group.sort_order,
    })
    setModalOpen(true)
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}><ExperimentOutlined /> 变量 Variants</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>管理所有变量组（杯型/茶基/糖度等）—— 产品页勾选即可使用</Text>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openNew}>新建变量组</Button>
      </div>

      {groupsQuery.isLoading ? (
        <Empty description="加载中..." />
      ) : groups.length === 0 ? (
        <Empty description={<div><div>还没有变量组</div><Text type="secondary">点击「新建变量组」</Text></div>} />
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
              dataSource={g.options}
              pagination={false}
              columns={[
                { title: '选项', dataIndex: 'name', width: 200 },
                { title: '价格调整', dataIndex: 'price_delta', width: 120, render: (v) => Number(v) === 0 ? <Text type="secondary">±0</Text> : <Text strong>{v > 0 ? `+RM ${v}` : `-RM ${Math.abs(v)}`}</Text> },
                { title: '默认', dataIndex: 'is_default', width: 80, render: (v) => v ? <Tag color="green">默认</Tag> : null },
                { title: '状态', dataIndex: 'is_available', width: 80, render: (v) => v ? <Tag color="success">在售</Tag> : <Tag>下架</Tag> },
                { title: '操作', width: 140, render: (_, row) => (
                  <Space size={0}>
                    <Button type="link" size="small" onClick={() => setEditingOptionKey(`${g.id}:${row.id}`)}>编辑</Button>
                    <Button type="link" danger size="small" onClick={() => {
                      variantsAPI.deleteOption(row.id).then(() => qc.invalidateQueries({ queryKey: ['admin-variants-all'] })).catch(() => message.error('删除失败'))
                    }}>删除</Button>
                  </Space>
                )},
              ]}
            />
            <AddOptionRow groupId={g.id} options={g.options} editingKey={editingOptionKey} onDone={() => { setEditingOptionKey(''); qc.invalidateQueries({ queryKey: ['admin-variants-all'] }) }} />
          </Card>
        ))
      )}

      <Modal
        title={editingGroup ? '编辑变量组' : '新建变量组'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saveMut.isPending}
      >
        <Form form={form} layout="vertical" onFinish={(v) => saveMut.mutate(v)}>
          <Form.Item label="变量组名称" name="name" rules={[{ required: true, message: '必填' }]}>
            <Input placeholder="杯型 / 茶基 / 糖度" />
          </Form.Item>
          <Form.Item label="关联产品（可选，留空=全局）" name="product_id">
            <Select
              allowClear
              placeholder="选择产品（不选则为全局变量）"
              showSearch
              optionFilterProp="label"
              onChange={(val) => form.setFieldValue('product_id', val || undefined)}
              options={products.map((p) => ({ value: p.id, label: p.name_cn }))}
            />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Form.Item label="必选" name="is_required" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item label="选择方式" name="selection_type">
              <Select options={[{ value: 'single', label: '单选' }, { value: 'multi', label: '多选' }]} />
            </Form.Item>
            <Form.Item label="排序" name="sort_order">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </Card>
  )
}

// ─── 添加 / 编辑选项行 ─────────────────────────────────
function AddOptionRow({ groupId, options, editingKey, onDone }) {
  const [open, setOpen] = useState(false)

  // editingKey 格式: "groupId:optionId"，匹配时自动展开并预填
  const editTarget = editingKey.startsWith(`${groupId}:`)
    ? options.find(o => editingKey === `${groupId}:${o.id}`)
    : null

  const [name, setName] = useState(editTarget?.name || '')
  const [priceDelta, setPriceDelta] = useState(editTarget?.price_delta || 0)
  const [costDelta, setCostDelta] = useState(editTarget?.cost_delta || 0)

  // 当 editingKey 变化且匹配时，预填数据
  if (editTarget && !open) {
    setName(editTarget.name); setPriceDelta(editTarget.price_delta); setCostDelta(editTarget.cost_delta || 0); setOpen(true)
  }

  const handleSubmit = async () => {
    if (!name.trim()) return
    try {
      if (editTarget) {
        await variantsAPI.updateOption(editTarget.id, { name: name.trim(), price_delta: priceDelta, cost_delta: costDelta })
      } else {
        await variantsAPI.createOption({ variant_group_id: groupId, name: name.trim(), price_delta: priceDelta, cost_delta: costDelta, sort_order: options.length })
      }
      setName(''); setPriceDelta(0); setCostDelta(0); setOpen(false); onDone()
    } catch (e) { message.error('保存失败') }
  }

  if (!open) {
    return <Button size="small" icon={<PlusOutlined />} style={{ marginTop: 8 }} onClick={() => setOpen(true)}>添加选项</Button>
  }

  return (
    <Space style={{ marginTop: 8 }}>
      <Input placeholder="选项名（如：中杯 / 全糖）" value={name} onChange={(e) => setName(e.target.value)} style={{ width: 160 }} />
      <InputNumber placeholder="价格调整" value={priceDelta} onChange={setPriceDelta} prefix="RM" style={{ width: 110 }} />
      <InputNumber placeholder="成本" value={costDelta} onChange={setCostDelta} prefix="RM" style={{ width: 100 }} />
      <Button type="primary" size="small" onClick={handleSubmit}>{editTarget ? '保存' : '添加'}</Button>
      <Button size="small" onClick={() => { setOpen(false); setName(''); setPriceDelta(0); setCostDelta(0); onDone() }}>取消</Button>
    </Space>
  )
}
