import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker,
  Tag, Space, Typography, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, GiftOutlined } from '@ant-design/icons'
import { promoAPI } from '../services/api'
import dayjs from 'dayjs'

const { Title } = Typography
const { RangePicker } = DatePicker

export default function Promotions() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await promoAPI.list()
      setData(res.data?.promotions || [])
    } catch (e) { message.error('加载优惠活动失败') }
    finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (record) => {
    setEditing(record)
    form.setFieldsValue({
      ...record,
      date_range: record.start_date && record.end_date
        ? [dayjs(record.start_date), dayjs(record.end_date)]
        : null,
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const { date_range, ...rest } = values
      const payload = {
        ...rest,
        start_date: date_range?.[0]?.toISOString(),
        end_date: date_range?.[1]?.toISOString(),
      }
      if (editing) {
        await promoAPI.update(editing.id, payload)
        message.success('更新成功')
      } else {
        await promoAPI.create(payload)
        message.success('创建成功')
      }
      setModalOpen(false)
      loadData()
    } catch (e) {
      if (e?.errorFields) return
      message.error(e.response?.data?.message || '操作失败')
    }
  }

  const handleDelete = async (id) => {
    try {
      await promoAPI.delete(id)
      message.success('已删除')
      loadData()
    } catch (e) { message.error('删除失败') }
  }

  const typeLabel = { percentage: '折扣 %', fixed: '固定减免', free_item: '免费赠品', cashback: '返现' }

  const columns = [
    { title: '活动名称', dataIndex: 'name', key: 'name',
      render: v => <Space><GiftOutlined style={{ color: '#fa8c16' }} />{v}</Space> },
    { title: '类型', dataIndex: 'type', key: 'type',
      render: v => <Tag color="orange">{typeLabel[v] || v}</Tag> },
    { title: '折扣值', dataIndex: 'discount_value', key: 'discount_value',
      render: (v, r) => r.type === 'percentage' ? `${v}%` : `RM ${v}` },
    { title: '有效期', key: 'period',
      render: (_, r) => r.start_date
        ? `${dayjs(r.start_date).format('MM/DD')} ~ ${dayjs(r.end_date).format('MM/DD')}`
        : '-' },
    { title: '状态', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: v => <Tag color={v ? 'green' : 'default'}>{v ? '进行中' : '已停止'}</Tag> },
    {
      title: '操作', key: 'action', width: 100,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>🎁 优惠活动</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新建活动
        </Button>
      </div>

      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        style={{ background: '#fff', borderRadius: 12 }}
      />

      <Modal
        title={editing ? '编辑活动' : '新建优惠活动'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="保存" cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="活动名称" rules={[{ required: true }]}>
            <Input placeholder="例：开学特惠 9 折" />
          </Form.Item>
          <Form.Item name="type" label="优惠类型" rules={[{ required: true }]}>
            <Select placeholder="选择类型">
              {Object.entries(typeLabel).map(([v, l]) => (
                <Select.Option key={v} value={v}>{l}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="discount_value" label="折扣值" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="折扣 % 或 固定金额" />
          </Form.Item>
          <Form.Item name="min_order_amount" label="最低消费 (RM)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="date_range" label="有效期">
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="is_active" label="状态" initialValue={true}>
            <Select>
              <Select.Option value={true}>进行中</Select.Option>
              <Select.Option value={false}>已停止</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
