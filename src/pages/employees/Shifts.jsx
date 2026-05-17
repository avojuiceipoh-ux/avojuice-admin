import React, { useState } from 'react'
import { Card, Table, Button, Modal, Form, Select, DatePicker, Input, Space, Tag, message, Popconfirm, Typography } from 'antd'
import { PlusOutlined, CalendarOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import DateRangePicker, { rangeToParams } from '../../components/DateRangePicker'
import { employeesAPI, outletsAPI } from '../../services/api'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

export default function Shifts() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [range, setRange] = useState([dayjs().startOf('week'), dayjs().endOf('week').add(1, 'week')])

  const listQuery = useQuery({
    queryKey: ['admin-shifts', range[0]?.toISOString(), range[1]?.toISOString()],
    queryFn: () => employeesAPI.listShifts(rangeToParams(range)).then((r) => r.data.shifts || []),
  })
  const staffQuery = useQuery({
    queryKey: ['admin-employees'],
    queryFn: () => employeesAPI.list().then((r) => r.data.staff || []),
  })
  const outletsQuery = useQuery({
    queryKey: ['outlets'],
    queryFn: () => outletsAPI.list().then((r) => r.data.outlets || []),
  })

  const createMut = useMutation({
    mutationFn: (data) => employeesAPI.createShift(data),
    onSuccess: () => { message.success('已排班'); setModalOpen(false); form.resetFields(); qc.invalidateQueries({ queryKey: ['admin-shifts'] }) },
  })
  const deleteMut = useMutation({
    mutationFn: (id) => employeesAPI.deleteShift(id),
    onSuccess: () => { message.success('已删除'); qc.invalidateQueries({ queryKey: ['admin-shifts'] }) },
  })

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}><CalendarOutlined /> 班次 / 排班</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>共 {listQuery.data?.length ?? 0} 个班次</Text>
        </div>
        <Space>
          <DateRangePicker value={range} onChange={setRange} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true) }}>排新班</Button>
        </Space>
      </div>

      <Table
        loading={listQuery.isLoading}
        rowKey="id"
        size="middle"
        dataSource={listQuery.data ?? []}
        pagination={{ pageSize: 30 }}
        columns={[
          { title: '员工', dataIndex: 'staff_name', width: 140,
            render: (v, row) => <div><Text strong>{v}</Text><div><Text type="secondary" style={{ fontSize: 11 }}>{row.role}</Text></div></div>,
          },
          { title: '门店', dataIndex: 'outlet_name', width: 130 },
          { title: '开始', dataIndex: 'scheduled_start', render: (v) => (
            <div>
              <div>{dayjs(v).format('YYYY-MM-DD HH:mm')}</div>
              <Tag color="blue" style={{ marginTop: 2 }}>{dayjs(v).format('ddd')}</Tag>
            </div>
          ) },
          { title: '结束', dataIndex: 'scheduled_end', render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
          { title: '时长', key: 'duration', width: 90, align: 'right',
            render: (_, row) => {
              const h = dayjs(row.scheduled_end).diff(row.scheduled_start, 'hour', true)
              return <Text>{h.toFixed(1)} h</Text>
            },
          },
          { title: '备注', dataIndex: 'notes' },
          { title: '操作', width: 100,
            render: (_, row) => (
              <Popconfirm title="删除班次？" onConfirm={() => deleteMut.mutate(row.id)} okText="删除" cancelText="取消">
                <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            ),
          },
        ]}
      />

      <Modal
        title="排新班"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={async () => {
          try {
            const v = await form.validateFields()
            createMut.mutate({
              staff_id: v.staff_id,
              outlet_id: v.outlet_id,
              scheduled_start: v.period[0].toISOString(),
              scheduled_end: v.period[1].toISOString(),
              notes: v.notes,
            })
          } catch {
            message.error('请检查表单')
          }
        }}
        confirmLoading={createMut.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="员工" name="staff_id" rules={[{ required: true, message: '必选' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={(staffQuery.data ?? []).filter((s) => s.is_active).map((s) => ({ value: s.id, label: `${s.name} (${s.role})` }))}
            />
          </Form.Item>
          <Form.Item label="门店" name="outlet_id" rules={[{ required: true, message: '必选' }]}>
            <Select options={(outletsQuery.data ?? []).map((o) => ({ value: o.id, label: o.name }))} />
          </Form.Item>
          <Form.Item label="班次时间" name="period" rules={[{ required: true, message: '必选' }]}>
            <RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="备注" name="notes">
            <Input.TextArea rows={2} placeholder="可选" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
