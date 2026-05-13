import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Tag, Space, Typography, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ShopOutlined } from '@ant-design/icons'
import { outletAPI } from '../services/api'

const { Title } = Typography

export default function Outlets() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await outletAPI.list()
      setData(res.data?.outlets || [])
    } catch (e) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
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
        await outletAPI.update(editing.id, values)
        message.success('更新成功')
      } else {
        await outletAPI.create(values)
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
      await outletAPI.delete(id)
      message.success('已删除')
      loadData()
    } catch (e) {
      message.error(e.response?.data?.message || '删除失败')
    }
  }

  const columns = [
    { title: '摊位名称', dataIndex: 'name', key: 'name',
      render: (v) => <Space><ShopOutlined style={{ color: '#52c41a' }} />{v}</Space> },
    { title: '地址', dataIndex: 'address', key: 'address', ellipsis: true },
    { title: '营业时间', dataIndex: 'operating_hours', key: 'operating_hours' },
    { title: '状态', dataIndex: 'is_active', key: 'is_active',
      width: 90,
      render: v => <Tag color={v ? 'green' : 'default'}>{v ? '营业中' : '已关闭'}</Tag> },
    {
      title: '操作', key: 'action', width: 120,
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
        <Title level={4} style={{ margin: 0 }}>🏪 摊位管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增摊位
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
        title={editing ? '编辑摊位' : '新增摊位'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="摊位名称" rules={[{ required: true }]}>
            <Input placeholder="例：爱我果饮 UTAR 店" />
          </Form.Item>
          <Form.Item name="address" label="地址" rules={[{ required: true }]}>
            <Input placeholder="例：UTAR 食堂 B 区" />
          </Form.Item>
          <Form.Item name="operating_hours" label="营业时间">
            <Input placeholder="例：08:00 - 18:00" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input placeholder="例：+60123456789" />
          </Form.Item>
          <Form.Item name="is_active" label="营业状态" initialValue={true}>
            <Select>
              <Select.Option value={true}>营业中</Select.Option>
              <Select.Option value={false}>已关闭</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
