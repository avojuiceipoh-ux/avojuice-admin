import React, { useState } from 'react'
import {
  Table, Card, Button, Drawer, Form, Input, InputNumber, Select, Switch, DatePicker,
  Space, Tag, message, Popconfirm, Typography,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, IdcardOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { employeesAPI, outletsAPI } from '../../services/api'

const { Text, Title } = Typography

const ROLE_LABEL = {
  owner:   { label: '老板',  color: 'gold' },
  manager: { label: '店长',  color: 'purple' },
  staff:   { label: '员工',  color: 'blue' },
  admin:   { label: '管理员', color: 'magenta' },
}

export default function Employees() {
  const qc = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()

  const staffQuery = useQuery({
    queryKey: ['admin-employees'],
    queryFn: () => employeesAPI.list().then((r) => r.data.staff || []),
  })
  const outletsQuery = useQuery({
    queryKey: ['outlets'],
    queryFn: () => outletsAPI.list().then((r) => r.data.outlets || []),
  })

  const createMut = useMutation({
    mutationFn: (data) => employeesAPI.create(data),
    onSuccess: () => { message.success('已添加'); setDrawerOpen(false); form.resetFields(); qc.invalidateQueries({ queryKey: ['admin-employees'] }) },
    onError: (e) => message.error(e.response?.data?.message ?? '添加失败'),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => employeesAPI.update(id, data),
    onSuccess: () => { message.success('已更新'); setDrawerOpen(false); setEditing(null); form.resetFields(); qc.invalidateQueries({ queryKey: ['admin-employees'] }) },
    onError: (e) => message.error(e.response?.data?.message ?? '更新失败'),
  })
  const deleteMut = useMutation({
    mutationFn: (id) => employeesAPI.delete(id),
    onSuccess: () => { message.success('已删除'); qc.invalidateQueries({ queryKey: ['admin-employees'] }) },
    onError: () => message.error('删除失败'),
  })

  const openDrawer = (record) => {
    setEditing(record)
    if (record) {
      form.setFieldsValue({
        ...record,
        hired_at: record.hired_at ? dayjs(record.hired_at) : null,
        pin: '',  // 不预填，留空表示不改
      })
    } else {
      form.resetFields()
      form.setFieldsValue({ role: 'staff', is_active: true })
    }
    setDrawerOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const v = await form.validateFields()
      const data = { ...v, hired_at: v.hired_at?.format('YYYY-MM-DD') ?? null }
      if (!v.pin) delete data.pin
      if (editing) updateMut.mutate({ id: editing.id, data })
      else createMut.mutate(data)
    } catch {
      message.error('请检查表单')
    }
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}><IdcardOutlined /> 员工列表</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            共 {staffQuery.data?.length ?? 0} 人 · 在岗 {staffQuery.data?.filter((s) => s.active_clock_in).length ?? 0} 人
          </Text>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => openDrawer(null)}>
          新增员工
        </Button>
      </div>

      <Table
        loading={staffQuery.isLoading}
        rowKey="id"
        size="middle"
        dataSource={staffQuery.data ?? []}
        pagination={{ pageSize: 20 }}
        columns={[
          {
            title: '员工',
            key: 'name',
            render: (_, row) => (
              <div>
                <Space>
                  <Text strong>{row.name}</Text>
                  {row.active_clock_in && (
                    <Tag color="green" icon={<ClockCircleOutlined />}>在岗</Tag>
                  )}
                </Space>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{row.phone}</Text>
                </div>
              </div>
            ),
          },
          { title: '角色', dataIndex: 'role', width: 100,
            render: (v) => { const r = ROLE_LABEL[v] || { label: v, color: 'default' }; return <Tag color={r.color}>{r.label}</Tag> },
          },
          { title: '门店', dataIndex: 'outlet_name', width: 140 },
          { title: '时薪', dataIndex: 'hourly_rate', width: 100, align: 'right',
            render: (v) => v ? <Text>RM {Number(v).toFixed(2)}</Text> : <Text type="secondary">—</Text>,
          },
          { title: '入职', dataIndex: 'hired_at', width: 120,
            render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : <Text type="secondary">—</Text>,
          },
          { title: '状态', dataIndex: 'is_active', width: 80,
            render: (v) => v ? <Tag color="success">启用</Tag> : <Tag>停用</Tag>,
          },
          { title: '操作', width: 160,
            render: (_, row) => (
              <Space>
                <Button type="link" icon={<EditOutlined />} onClick={() => openDrawer(row)}>编辑</Button>
                <Popconfirm title="确认删除？" onConfirm={() => deleteMut.mutate(row.id)} okText="删除" cancelText="取消">
                  <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Drawer
        title={editing ? '编辑员工' : '新增员工'}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null) }}
        width={480}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" loading={createMut.isPending || updateMut.isPending} onClick={handleSubmit}>保存</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item label="姓名" name="name" rules={[{ required: true, message: '必填' }]}>
            <Input placeholder="王小明" />
          </Form.Item>
          <Form.Item label="手机号" name="phone" rules={[{ required: true, message: '必填' }]}>
            <Input placeholder="+60123456789" />
          </Form.Item>
          <Form.Item label="门店" name="outlet_id" rules={[{ required: true, message: '必填' }]}>
            <Select options={(outletsQuery.data ?? []).map((o) => ({ value: o.id, label: o.name }))} />
          </Form.Item>
          <Form.Item label="角色" name="role">
            <Select options={Object.entries(ROLE_LABEL).map(([v, m]) => ({ value: v, label: m.label }))} />
          </Form.Item>
          <Form.Item label={editing ? 'PIN（留空 = 不修改）' : 'PIN 码（4-6 位数字）'} name="pin" rules={editing ? [] : [{ required: true, message: '必填' }]}>
            <Input.Password placeholder="员工 POS 登录用" maxLength={6} />
          </Form.Item>
          <Form.Item label="邮箱（可选）" name="email"><Input /></Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label="时薪 RM" name="hourly_rate">
              <InputNumber min={0} step={0.5} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="入职日期" name="hired_at">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item label="启用" name="is_active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </Card>
  )
}
