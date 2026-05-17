/**
 * Categories.jsx — 菜单分类管理（V2）
 */

import React, { useState } from 'react'
import {
  Table, Button, Space, Modal, Form, Input, InputNumber, ColorPicker,
  Tag, message, Popconfirm, Card, Typography,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, FolderOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriesAPI } from '../../services/api'

const { Text, Title } = Typography

export default function Categories() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()

  const listQuery = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => categoriesAPI.list().then((r) => r.data.categories || []),
  })

  const createMut = useMutation({
    mutationFn: (data) => categoriesAPI.create(data),
    onSuccess: () => {
      message.success('已添加')
      setModalOpen(false)
      form.resetFields()
      qc.invalidateQueries({ queryKey: ['admin-categories'] })
    },
    onError: (e) => message.error(e.response?.data?.message ?? '添加失败'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => categoriesAPI.update(id, data),
    onSuccess: () => {
      message.success('已更新')
      setModalOpen(false)
      setEditing(null)
      form.resetFields()
      qc.invalidateQueries({ queryKey: ['admin-categories'] })
    },
    onError: (e) => message.error(e.response?.data?.message ?? '更新失败'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => categoriesAPI.delete(id),
    onSuccess: () => {
      message.success('已删除')
      qc.invalidateQueries({ queryKey: ['admin-categories'] })
    },
    onError: (e) => message.error(e.response?.data?.message ?? '删除失败'),
  })

  const openModal = (record) => {
    setEditing(record)
    if (record) {
      form.setFieldsValue({
        ...record,
        color_hex: record.color_hex || '#52c41a',
      })
    } else {
      form.resetFields()
      form.setFieldsValue({ color_hex: '#52c41a', sort_order: 0 })
    }
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      // ColorPicker 返回的可能是 Color 对象
      if (values.color_hex?.toHexString) values.color_hex = values.color_hex.toHexString()
      if (editing) updateMut.mutate({ id: editing.id, data: values })
      else createMut.mutate(values)
    } catch {
      message.error('请检查表单')
    }
  }

  const columns = [
    {
      title: '分类',
      key: 'name',
      render: (_, row) => (
        <Space>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: row.color_hex || '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FolderOutlined style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{row.name_cn}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{row.name_en}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: '产品数',
      dataIndex: 'product_count',
      width: 100,
      align: 'right',
      render: (v) => <Tag>{v}</Tag>,
    },
    { title: '排序', dataIndex: 'sort_order', width: 80, align: 'center' },
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
          <Button type="link" icon={<EditOutlined />} onClick={() => openModal(row)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除？"
            description={row.product_count > 0 ? `该分类下还有 ${row.product_count} 个产品，无法删除` : '此操作不可恢复'}
            onConfirm={() => deleteMut.mutate(row.id)}
            disabled={row.product_count > 0}
            okText="删除"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />} disabled={row.product_count > 0}>
              删除
            </Button>
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
            <FolderOutlined /> 分类 Categories
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            菜单分类管理 · 共 {listQuery.data?.length ?? 0} 个
          </Text>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => openModal(null)}>
          新建分类
        </Button>
      </div>

      <Table
        loading={listQuery.isLoading}
        rowKey="id"
        columns={columns}
        dataSource={listQuery.data ?? []}
        pagination={false}
        size="middle"
      />

      <Modal
        title={editing ? '编辑分类' : '新建分类'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null) }}
        onOk={handleSubmit}
        okText="保存"
        cancelText="取消"
        confirmLoading={createMut.isPending || updateMut.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label="中文名" name="name_cn" rules={[{ required: true, message: '必填' }]}>
              <Input placeholder="招牌特调" />
            </Form.Item>
            <Form.Item label="英文名" name="name_en" rules={[{ required: true, message: '必填' }]}>
              <Input placeholder="Signature" />
            </Form.Item>
          </div>

          <Form.Item label="颜色（POS 按钮）" name="color_hex">
            <ColorPicker />
          </Form.Item>

          <Form.Item label="分类图 URL（顾客 App 显示）" name="image_url">
            <Input placeholder="https://... (可选)" />
          </Form.Item>

          <Form.Item label="排序" name="sort_order" tooltip="数字越小越靠前">
            <InputNumber min={0} max={999} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
