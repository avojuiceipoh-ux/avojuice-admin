import React, { useState } from 'react'
import { Card, Table, Button, Modal, Form, Input, InputNumber, Space, Tag, message, Popconfirm, Typography } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CrownOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersAPI } from '../../services/api'

const { Text, Title } = Typography

export default function MembershipTiers() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()

  const listQuery = useQuery({
    queryKey: ['admin-tiers'],
    queryFn: () => customersAPI.listTiers().then((r) => r.data.tiers || []),
  })

  const createMut = useMutation({
    mutationFn: (data) => customersAPI.createTier(data),
    onSuccess: () => { message.success('已添加'); setModalOpen(false); form.resetFields(); qc.invalidateQueries({ queryKey: ['admin-tiers'] }) },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => customersAPI.updateTier(id, data),
    onSuccess: () => { message.success('已更新'); setModalOpen(false); setEditing(null); form.resetFields(); qc.invalidateQueries({ queryKey: ['admin-tiers'] }) },
  })
  const deleteMut = useMutation({
    mutationFn: (id) => customersAPI.deleteTier(id),
    onSuccess: () => { message.success('已删除'); qc.invalidateQueries({ queryKey: ['admin-tiers'] }) },
  })

  const openModal = (record) => {
    setEditing(record)
    if (record) form.setFieldsValue(record)
    else { form.resetFields(); form.setFieldsValue({ point_multiplier: 1.0 }) }
    setModalOpen(true)
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}><CrownOutlined /> 会员等级</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>设定升级门槛 + 积分倍率</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal(null)}>新建等级</Button>
      </div>

      <Table
        loading={listQuery.isLoading}
        rowKey="id"
        dataSource={listQuery.data ?? []}
        pagination={false}
        columns={[
          { title: '等级名', dataIndex: 'name', render: (v) => <Tag color="gold">{v}</Tag> },
          { title: '年消费门槛', dataIndex: 'min_spend_year', width: 160, align: 'right',
            render: (v) => v ? `RM ${Number(v).toFixed(2)}` : <Text type="secondary">—</Text>,
          },
          { title: '积分倍率', dataIndex: 'point_multiplier', width: 110, align: 'right',
            render: (v) => v ? `${Number(v).toFixed(2)}×` : '1.00×',
          },
          { title: '操作', width: 160,
            render: (_, row) => (
              <Space>
                <Button type="link" icon={<EditOutlined />} onClick={() => openModal(row)}>编辑</Button>
                <Popconfirm title="确认删除？" onConfirm={() => deleteMut.mutate(row.id)} okText="删除" cancelText="取消">
                  <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? '编辑等级' : '新建等级'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null) }}
        onOk={async () => {
          try {
            const v = await form.validateFields()
            if (editing) updateMut.mutate({ id: editing.id, data: v })
            else createMut.mutate(v)
          } catch { message.error('请检查表单') }
        }}
        confirmLoading={createMut.isPending || updateMut.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="等级名" name="name" rules={[{ required: true, message: '必填' }]}>
            <Input placeholder="Silver / Gold / Platinum / 鲜榨达人 / 果饮大师" />
          </Form.Item>
          <Form.Item label="年消费门槛 RM" name="min_spend_year" tooltip="顾客一年内累计消费达到这个数就升级">
            <InputNumber min={0} step={50} style={{ width: '100%' }} placeholder="例如 500" />
          </Form.Item>
          <Form.Item label="积分倍率" name="point_multiplier" tooltip="该等级顾客的积分获取倍数。1.5 = 1.5 倍">
            <InputNumber min={1} max={5} step={0.1} precision={2} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
