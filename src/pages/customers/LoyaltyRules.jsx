import React, { useState } from 'react'
import { Card, Table, Button, Modal, Form, Input, InputNumber, Switch, Space, Tag, message, Typography, Alert } from 'antd'
import { PlusOutlined, EditOutlined, StarOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersAPI } from '../../services/api'

const { Text, Title } = Typography

export default function LoyaltyRules() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()

  const listQuery = useQuery({
    queryKey: ['admin-loyalty'],
    queryFn: () => customersAPI.listLoyalty().then((r) => r.data.rules || []),
  })

  const createMut = useMutation({
    mutationFn: (data) => customersAPI.createLoyalty(data),
    onSuccess: () => { message.success('已添加'); setModalOpen(false); form.resetFields(); qc.invalidateQueries({ queryKey: ['admin-loyalty'] }) },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => customersAPI.updateLoyalty(id, data),
    onSuccess: () => { message.success('已更新'); setModalOpen(false); setEditing(null); form.resetFields(); qc.invalidateQueries({ queryKey: ['admin-loyalty'] }) },
  })

  const openModal = (record) => {
    setEditing(record)
    if (record) form.setFieldsValue(record)
    else { form.resetFields(); form.setFieldsValue({ earn_rate: 1.0, redeem_rate: 0.01, min_redeem_points: 100, is_active: true }) }
    setModalOpen(true)
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}><StarOutlined /> 积分规则</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>设定积分赚取 / 兑换比例</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal(null)}>新建规则</Button>
      </div>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="积分逻辑"
        description="一般做法：消费 RM 1 = 赚 X 分；积满 100 分可抵 RM 1。例如 earn_rate=1.0 + redeem_rate=0.01 表示「1 RM = 1 分；100 分抵 RM 1」。"
      />

      <Table
        loading={listQuery.isLoading}
        rowKey="id"
        dataSource={listQuery.data ?? []}
        pagination={false}
        columns={[
          { title: '规则名', dataIndex: 'name' },
          { title: '赚取', dataIndex: 'earn_rate', width: 130, align: 'right',
            render: (v) => <Text>1 RM = <Text strong>{Number(v).toFixed(2)}</Text> 分</Text>,
          },
          { title: '兑换', dataIndex: 'redeem_rate', width: 150, align: 'right',
            render: (v) => v ? <Text>1 分 = RM <Text strong>{Number(v).toFixed(4)}</Text></Text> : '—',
          },
          { title: '最低兑换', dataIndex: 'min_redeem_points', width: 110, align: 'right',
            render: (v) => `${v} 分`,
          },
          { title: '过期', dataIndex: 'expires_after_days', width: 100, align: 'right',
            render: (v) => v ? `${v} 天` : <Tag>永久</Tag>,
          },
          { title: '状态', dataIndex: 'is_active', width: 80,
            render: (v) => v ? <Tag color="success">启用</Tag> : <Tag>停用</Tag>,
          },
          { title: '操作', width: 100,
            render: (_, row) => <Button type="link" icon={<EditOutlined />} onClick={() => openModal(row)}>编辑</Button>,
          },
        ]}
      />

      <Modal
        title={editing ? '编辑积分规则' : '新建积分规则'}
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
          <Form.Item label="规则名" name="name" rules={[{ required: true, message: '必填' }]}>
            <Input placeholder="基础积分规则" />
          </Form.Item>
          <Form.Item label="赚取倍率（1 RM = X 分）" name="earn_rate">
            <InputNumber min={0} step={0.1} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="兑换倍率（1 分 = RM X）" name="redeem_rate">
            <InputNumber min={0} step={0.001} precision={4} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="最低兑换分数" name="min_redeem_points">
            <InputNumber min={0} step={50} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="积分有效期（天，留空 = 永久）" name="expires_after_days">
            <InputNumber min={1} max={3650} style={{ width: '100%' }} placeholder="例如 365" />
          </Form.Item>
          <Form.Item label="启用" name="is_active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
