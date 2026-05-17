import React, { useState } from 'react'
import {
  Table, Card, Button, Modal, Form, Select, InputNumber, Input,
  Space, Tag, message, Typography, Row, Col, Statistic,
} from 'antd'
import { PlusOutlined, WarningOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import DateRangePicker, { rangeToParams } from '../../components/DateRangePicker'
import { inventoryAPI, outletsAPI } from '../../services/api'

const { Text, Title } = Typography

const REASON_OPTIONS = [
  { value: 'spoilage',   label: '🦠 变质', color: 'red' },
  { value: 'spill',      label: '💧 打翻 / 洒落', color: 'orange' },
  { value: 'training',   label: '🧪 试做 / 训练', color: 'blue' },
  { value: 'complaint',  label: '😠 客诉 / 退货', color: 'magenta' },
  { value: 'expired',    label: '📅 过期', color: 'volcano' },
]

export default function Wastage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [range, setRange] = useState([dayjs().subtract(29, 'day').startOf('day'), dayjs().endOf('day')])

  const listQuery = useQuery({
    queryKey: ['admin-wastage', range[0]?.toISOString(), range[1]?.toISOString()],
    queryFn: () => inventoryAPI.listWastage(rangeToParams(range)).then((r) => r.data),
  })
  const invQuery = useQuery({
    queryKey: ['admin-inventory'],
    queryFn: () => inventoryAPI.list().then((r) => r.data.items || []),
  })
  const outletsQuery = useQuery({
    queryKey: ['outlets'],
    queryFn: () => outletsAPI.list().then((r) => r.data.outlets || []),
  })

  const createMut = useMutation({
    mutationFn: (data) => inventoryAPI.createWastage(data),
    onSuccess: () => { message.success('已记录'); setModalOpen(false); form.resetFields(); qc.invalidateQueries({ queryKey: ['admin-wastage'] }); qc.invalidateQueries({ queryKey: ['admin-inventory'] }) },
    onError: (e) => message.error(e.response?.data?.message ?? '记录失败'),
  })

  const entries = listQuery.data?.entries ?? []
  const byReason = listQuery.data?.by_reason ?? []
  const totalCost = entries.reduce((s, e) => s + Number(e.cost_value || 0), 0)

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <Title level={4} style={{ margin: 0 }}><WarningOutlined /> 损耗 Wastage</Title>
          <Space wrap>
            <DateRangePicker value={range} onChange={setRange} />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true) }}>
              记录损耗
            </Button>
          </Space>
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12}>
          <Card><Statistic title="期间总损失" value={totalCost} precision={2} prefix="RM" valueStyle={{ color: '#ff4d4f' }} /></Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card><Statistic title="损耗记录数" value={entries.length} suffix="次" /></Card>
        </Col>
      </Row>

      {byReason.length > 0 && (
        <Card title="按原因汇总" style={{ marginBottom: 16 }}>
          <Space wrap>
            {byReason.map((r) => {
              const opt = REASON_OPTIONS.find((o) => o.value === r.reason) || { label: r.reason, color: 'default' }
              return <Tag key={r.reason} color={opt.color} style={{ padding: '4px 10px', fontSize: 13 }}>{opt.label} × {r.count_per_reason}</Tag>
            })}
          </Space>
        </Card>
      )}

      <Card loading={listQuery.isLoading}>
        <Table
          rowKey="id"
          size="middle"
          dataSource={entries}
          pagination={{ pageSize: 20 }}
          columns={[
            { title: '时间', dataIndex: 'recorded_at', width: 150, render: (v) => dayjs(v).format('MM-DD HH:mm') },
            { title: '原料', dataIndex: 'item_name', width: 150,
              render: (v, row) => <Text strong>{v} <Text type="secondary" style={{ fontSize: 11 }}>({row.unit})</Text></Text>,
            },
            { title: '数量', dataIndex: 'quantity', width: 100, align: 'right',
              render: (v, row) => `${Number(v).toFixed(2)} ${row.unit}`,
            },
            { title: '损失', dataIndex: 'cost_value', width: 110, align: 'right',
              render: (v) => v ? <Text strong style={{ color: '#ff4d4f' }}>RM {Number(v).toFixed(2)}</Text> : <Text type="secondary">—</Text>,
            },
            { title: '原因', dataIndex: 'reason', width: 130,
              render: (v) => { const o = REASON_OPTIONS.find((x) => x.value === v) || { label: v, color: 'default' }; return <Tag color={o.color}>{o.label}</Tag> },
            },
            { title: '备注', dataIndex: 'note' },
            { title: '记录人', dataIndex: 'recorded_by_name', width: 100 },
          ]}
        />
      </Card>

      <Modal
        title="记录损耗"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={async () => {
          try { const v = await form.validateFields(); createMut.mutate(v) }
          catch { message.error('请检查表单') }
        }}
        confirmLoading={createMut.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="门店" name="outlet_id" rules={[{ required: true, message: '必填' }]}>
            <Select options={(outletsQuery.data ?? []).map((o) => ({ value: o.id, label: o.name }))} />
          </Form.Item>
          <Form.Item label="原料" name="inventory_id" rules={[{ required: true, message: '必填' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={(invQuery.data ?? []).map((i) => ({ value: i.id, label: `${i.item_name} (剩 ${Number(i.quantity).toFixed(2)} ${i.unit})` }))}
            />
          </Form.Item>
          <Form.Item label="损耗数量" name="quantity" rules={[{ required: true, message: '必填' }]}>
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="原因" name="reason" rules={[{ required: true, message: '必填' }]}>
            <Select options={REASON_OPTIONS} />
          </Form.Item>
          <Form.Item label="备注" name="note">
            <Input.TextArea rows={2} placeholder="可选" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
