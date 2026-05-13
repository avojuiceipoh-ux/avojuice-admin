import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space,
  Typography, message, Popconfirm, Upload } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import { menuAPI, outletAPI } from '../services/api'

const { Title } = Typography

export default function Menu() {
  const [data, setData] = useState([])
  const [outlets, setOutlets] = useState([])
  const [selectedOutlet, setSelectedOutlet] = useState(null)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => { loadOutlets() }, [])
  useEffect(() => { if (selectedOutlet) loadMenu() }, [selectedOutlet])

  const loadOutlets = async () => {
    try {
      const res = await outletAPI.list()
      const list = res.data?.outlets || []
      setOutlets(list)
      if (list.length > 0) setSelectedOutlet(list[0].id)
    } catch (e) { message.error('加载摊位失败') }
  }

  const loadMenu = async () => {
    if (!selectedOutlet) return
    setLoading(true)
    try {
      const res = await menuAPI.list(selectedOutlet)
      setData(res.data?.items || res.data?.menu || [])
    } catch (e) {
      message.error('加载菜单失败')
    } finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ outlet_id: selectedOutlet, is_available: true })
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
        await menuAPI.update(editing.id, values)
        message.success('更新成功')
      } else {
        await menuAPI.create(values)
        message.success('创建成功')
      }
      setModalOpen(false)
      loadMenu()
    } catch (e) {
      if (e?.errorFields) return
      message.error(e.response?.data?.message || '操作失败')
    }
  }

  const handleDelete = async (id) => {
    try {
      await menuAPI.delete(id)
      message.success('已删除')
      loadMenu()
    } catch (e) { message.error('删除失败') }
  }

  const columns = [
    { title: '商品名', dataIndex: 'name', key: 'name' },
    { title: '分类', dataIndex: 'category', key: 'category',
      render: v => <Tag color="blue">{v || '-'}</Tag> },
    { title: '价格 (RM)', dataIndex: 'price', key: 'price',
      render: v => <strong>RM {parseFloat(v || 0).toFixed(2)}</strong> },
    { title: '状态', dataIndex: 'is_available', key: 'is_available',
      width: 80,
      render: v => <Tag color={v ? 'green' : 'red'}>{v ? '上架' : '下架'}</Tag> },
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
        <Title level={4} style={{ margin: 0 }}>🧃 菜单管理</Title>
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
            新增菜品
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
        title={editing ? '编辑菜品' : '新增菜品'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="outlet_id" hidden><Input /></Form.Item>
          <Form.Item name="name" label="菜品名称" rules={[{ required: true }]}>
            <Input placeholder="例：鲜榨芒果汁" />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Select placeholder="选择分类">
              <Select.Option value="果汁">果汁</Select.Option>
              <Select.Option value="奶昔">奶昔</Select.Option>
              <Select.Option value="特饮">特饮</Select.Option>
              <Select.Option value="套餐">套餐</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="price" label="价格 (RM)" rules={[{ required: true }]}>
            <InputNumber min={0} step={0.5} style={{ width: '100%' }} prefix="RM" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="简单介绍这款饮品..." />
          </Form.Item>
          <Form.Item name="is_available" label="上架状态" initialValue={true}>
            <Select>
              <Select.Option value={true}>上架中</Select.Option>
              <Select.Option value={false}>已下架</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
