import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space,
  Typography, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { productAPI, outletAPI } from '../services/api'

const { Title } = Typography

export default function Products() {
  const [data, setData] = useState([])
  const [outlets, setOutlets] = useState([])
  const [selectedOutlet, setSelectedOutlet] = useState(null)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => { loadOutlets() }, [])
  useEffect(() => { if (selectedOutlet) loadProducts() }, [selectedOutlet])

  const loadOutlets = async () => {
    try {
      const res = await outletAPI.list()
      const list = res.data?.outlets || []
      setOutlets(list)
      if (list.length > 0) setSelectedOutlet(list[0].id)
    } catch (e) { message.error('加载摊位失败') }
  }

  const loadProducts = async () => {
    if (!selectedOutlet) return
    setLoading(true)
    try {
      const res = await productAPI.list(selectedOutlet)
      setData(res.data?.products || [])
    } catch (e) { message.error('加载产品失败') }
    finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ outlet_id: selectedOutlet, is_active: true })
    setModalOpen(true)
  }

  const openEdit = (record) => {
    setEditing(record)
    form.setFieldsValue(record)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editing) {
        await productAPI.update(editing.id, values)
        message.success('更新成功')
      } else {
        await productAPI.create(values)
        message.success('创建成功')
      }
      setModalOpen(false)
      loadProducts()
    } catch (e) {
      if (e?.errorFields) return
      message.error(e.response?.data?.message || '操作失败')
    }
  }

  const handleDelete = async (id) => {
    try {
      await productAPI.delete(id)
      message.success('已删除')
      loadProducts()
    } catch (e) { message.error('删除失败') }
  }

  const columns = [
    { title: '产品名称', dataIndex: 'name', key: 'name' },
    { title: '分类', dataIndex: 'category', key: 'category',
      render: v => v ? <Tag color="geekblue">{v}</Tag> : '-' },
    { title: '基础价格', dataIndex: 'base_price', key: 'base_price',
      render: v => <strong>RM {parseFloat(v || 0).toFixed(2)}</strong> },
    { title: '库存', dataIndex: 'stock_quantity', key: 'stock_quantity',
      render: v => v ?? '-' },
    { title: '状态', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: v => <Tag color={v ? 'green' : 'red'}>{v ? '启用' : '停用'}</Tag> },
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
        <Title level={4} style={{ margin: 0 }}>🍹 产品库</Title>
        <Space>
          <Select
            placeholder="选择摊位"
            value={selectedOutlet}
            onChange={setSelectedOutlet}
            style={{ width: 180 }}
            options={outlets.map(o => ({ label: o.name, value: o.id }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
            disabled={!selectedOutlet}>
            新增产品
          </Button>
        </Space>
      </div>

      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        style={{ background: '#fff', borderRadius: 12 }}
      />

      <Modal
        title={editing ? '编辑产品' : '新增产品'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="保存" cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="outlet_id" hidden><Input /></Form.Item>
          <Form.Item name="name" label="产品名称" rules={[{ required: true }]}>
            <Input placeholder="例：鲜榨西瓜汁" />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Select placeholder="选择分类">
              {['果汁', '奶昔', '特饮', '套餐', '小食'].map(c => (
                <Select.Option key={c} value={c}>{c}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="base_price" label="基础价格 (RM)" rules={[{ required: true }]}>
            <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="is_active" label="状态" initialValue={true}>
            <Select>
              <Select.Option value={true}>启用</Select.Option>
              <Select.Option value={false}>停用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
