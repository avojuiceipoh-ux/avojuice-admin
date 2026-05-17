/**
 * Discounts.jsx — 折扣 / 优惠码管理（V2）
 */

import React, { useState } from 'react'
import {
  Table, Button, Space, Drawer, Form, Input, InputNumber, Select, Switch,
  DatePicker, Tag, message, Popconfirm, Card, Typography, Divider,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, GiftOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { discountsAPI } from '../../services/api'

const { Text, Title } = Typography
const { RangePicker } = DatePicker

const TYPE_LABEL = {
  percent: { label: '百分比', color: 'blue' },
  amount:  { label: '固定金额', color: 'green' },
  bogo:    { label: '买 X 送 Y', color: 'purple' },
  bundle:  { label: '套餐捆绑', color: 'orange' },
}

const APPLIES_LABEL = {
  all:      '全部产品',
  category: '指定分类',
  product:  '指定产品',
}

export default function Discounts() {
  const qc = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()

  const listQuery = useQuery({
    queryKey: ['admin-discounts'],
    queryFn: () => discountsAPI.list().then((r) => r.data.discounts || []),
  })

  const createMut = useMutation({
    mutationFn: (data) => discountsAPI.create(data),
    onSuccess: () => {
      message.success('已添加')
      setDrawerOpen(false); form.resetFields()
      qc.invalidateQueries({ queryKey: ['admin-discounts'] })
    },
    onError: (e) => message.error(e.response?.data?.message ?? '添加失败'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => discountsAPI.update(id, data),
    onSuccess: () => {
      message.success('已更新')
      setDrawerOpen(false); setEditing(null); form.resetFields()
      qc.invalidateQueries({ queryKey: ['admin-discounts'] })
    },
    onError: (e) => message.error(e.response?.data?.message ?? '更新失败'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => discountsAPI.delete(id),
    onSuccess: () => {
      message.success('已停用')
      qc.invalidateQueries({ queryKey: ['admin-discounts'] })
    },
    onError: () => message.error('停用失败'),
  })

  const openDrawer = (record) => {
    setEditing(record)
    if (record) {
      form.setFieldsValue({
        ...record,
        period: record.starts_at && record.ends_at ? [dayjs(record.starts_at), dayjs(record.ends_at)] : null,
      })
    } else {
      form.resetFields()
      form.setFieldsValue({
        type: 'percent',
        applies_to: 'all',
        is_stackable: false,
        is_active: true,
      })
    }
    setDrawerOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const v = await form.validateFields()
      const data = {
        ...v,
        starts_at: v.period?.[0]?.toISOString() ?? null,
        ends_at:   v.period?.[1]?.toISOString() ?? null,
      }
      delete data.period
      if (editing) updateMut.mutate({ id: editing.id, data })
      else createMut.mutate(data)
    } catch {
      message.error('请检查表单')
    }
  }

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{v}</div>
          {row.code && <Tag color="cyan" style={{ marginTop: 4 }}>码：{row.code}</Tag>}
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (v) => {
        const t = TYPE_LABEL[v] || { label: v, color: 'default' }
        return <Tag color={t.color}>{t.label}</Tag>
      },
    },
    {
      title: '优惠',
      key: 'value',
      width: 110,
      render: (_, row) => {
        if (row.type === 'percent') return <Text strong>{row.value}% off</Text>
        if (row.type === 'amount') return <Text strong style={{ color: '#52c41a' }}>RM {row.value}</Text>
        return <Text type="secondary">—</Text>
      },
    },
    {
      title: '适用范围',
      dataIndex: 'applies_to',
      width: 100,
      render: (v) => APPLIES_LABEL[v] || v,
    },
    {
      title: '使用 / 上限',
      key: 'usage',
      width: 100,
      align: 'center',
      render: (_, row) => `${row.used_count}${row.usage_limit ? ` / ${row.usage_limit}` : ''}`,
    },
    {
      title: '生效期',
      key: 'period',
      width: 200,
      render: (_, row) => {
        if (!row.starts_at && !row.ends_at) return <Text type="secondary">永久</Text>
        return (
          <Text style={{ fontSize: 12 }}>
            {row.starts_at ? dayjs(row.starts_at).format('MM-DD') : '∞'} ~{' '}
            {row.ends_at ? dayjs(row.ends_at).format('MM-DD') : '∞'}
          </Text>
        )
      },
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 80,
      render: (v) => v ? <Tag color="success">启用</Tag> : <Tag>停用</Tag>,
    },
    {
      title: '操作',
      width: 160,
      render: (_, row) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openDrawer(row)}>编辑</Button>
          <Popconfirm title="停用此折扣？" onConfirm={() => deleteMut.mutate(row.id)} okText="停用" cancelText="取消">
            <Button type="link" danger icon={<DeleteOutlined />}>停用</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <GiftOutlined /> 折扣 Discounts
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            管理优惠码、满减、买送活动 · 共 {listQuery.data?.length ?? 0} 个
          </Text>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => openDrawer(null)}>
          新建折扣
        </Button>
      </div>

      <Table
        loading={listQuery.isLoading}
        rowKey="id"
        columns={columns}
        dataSource={listQuery.data ?? []}
        pagination={{ pageSize: 20 }}
        size="middle"
      />

      <Drawer
        title={editing ? '编辑折扣' : '新建折扣'}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null) }}
        width={520}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" loading={createMut.isPending || updateMut.isPending} onClick={handleSubmit}>
              保存
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '必填' }]}>
            <Input placeholder="新客 9 折 / 中午满 RM 30 减 RM 5" />
          </Form.Item>

          <Form.Item label="类型" name="type" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'percent', label: '百分比 (例如 10% off)' },
                { value: 'amount',  label: '固定金额 (例如 RM 5 off)' },
                { value: 'bogo',    label: '买 X 送 Y' },
                { value: 'bundle',  label: '套餐捆绑' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="优惠值"
            name="value"
            tooltip="百分比类型填 10 = 10%；固定金额类型填 5 = RM 5"
          >
            <InputNumber min={0} step={0.5} precision={2} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="优惠码（可选）" name="code" tooltip="留空 = 手动应用，需员工/系统选择">
            <Input placeholder="WELCOME10" style={{ textTransform: 'uppercase' }} />
          </Form.Item>

          <Divider>使用规则</Divider>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label="最低消费 RM" name="min_subtotal" tooltip="满多少才能用">
              <InputNumber min={0} step={1} style={{ width: '100%' }} placeholder="可选" />
            </Form.Item>
            <Form.Item label="最高优惠 RM" name="max_discount" tooltip="百分比折扣的封顶">
              <InputNumber min={0} step={1} style={{ width: '100%' }} placeholder="可选" />
            </Form.Item>
          </div>

          <Form.Item label="适用范围" name="applies_to">
            <Select
              options={[
                { value: 'all',      label: '全部产品' },
                { value: 'category', label: '指定分类（target_ids）' },
                { value: 'product',  label: '指定产品（target_ids）' },
              ]}
            />
          </Form.Item>

          <Form.Item label="总使用次数限制" name="usage_limit" tooltip="留空 = 无限">
            <InputNumber min={1} style={{ width: '100%' }} placeholder="可选" />
          </Form.Item>

          <Form.Item label="生效期" name="period" tooltip="留空 = 永久有效">
            <RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Divider>开关</Divider>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label="可叠加" name="is_stackable" valuePropName="checked" tooltip="跟其他折扣同时使用">
              <Switch />
            </Form.Item>
            <Form.Item label="启用" name="is_active" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Drawer>
    </Card>
  )
}
