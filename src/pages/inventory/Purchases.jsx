import React, { useState } from 'react'
import {
  Card, Table, Button, Drawer, Form, Input, InputNumber, Select, DatePicker,
  Space, Tag, message, Popconfirm, Typography, Modal, Tabs, Divider,
} from 'antd'
import { PlusOutlined, InboxOutlined, CheckCircleOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { purchasesAPI, inventoryAPI, outletsAPI } from '../../services/api'

const { Text, Title } = Typography

const STATUS_LABEL = {
  draft:      { label: '草稿',   color: 'default' },
  ordered:    { label: '已下单', color: 'blue' },
  received:   { label: '已到货', color: 'success' },
  cancelled:  { label: '已取消', color: 'red' },
}

export default function Purchases() {
  return (
    <Tabs
      defaultActiveKey="orders"
      items={[
        { key: 'orders',    label: '进货单',    children: <PurchaseOrders /> },
        { key: 'suppliers', label: '供应商',    children: <Suppliers /> },
      ]}
    />
  )
}

// ─── Purchase Orders ───────────────────────────────────
function PurchaseOrders() {
  const qc = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form] = Form.useForm()

  const ordersQuery = useQuery({
    queryKey: ['admin-po'],
    queryFn: () => purchasesAPI.listOrders().then((r) => r.data.orders || []),
  })
  const suppliersQuery = useQuery({
    queryKey: ['admin-suppliers'],
    queryFn: () => purchasesAPI.listSuppliers().then((r) => r.data.suppliers || []),
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
    mutationFn: (d) => purchasesAPI.createOrder(d),
    onSuccess: () => { message.success('已创建进货单'); setDrawerOpen(false); form.resetFields(); qc.invalidateQueries({ queryKey: ['admin-po'] }) },
  })
  const receiveMut = useMutation({
    mutationFn: (id) => purchasesAPI.receiveOrder(id),
    onSuccess: () => { message.success('已入库'); qc.invalidateQueries({ queryKey: ['admin-po'] }); qc.invalidateQueries({ queryKey: ['admin-inventory'] }) },
    onError: (e) => message.error(e.response?.data?.message ?? '入库失败'),
  })
  const cancelMut = useMutation({
    mutationFn: (id) => purchasesAPI.cancelOrder(id),
    onSuccess: () => { message.success('已取消'); qc.invalidateQueries({ queryKey: ['admin-po'] }) },
  })

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}><InboxOutlined /> 进货单 Purchase Orders</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>共 {ordersQuery.data?.length ?? 0} 单</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); form.setFieldsValue({ items: [{}], order_date: dayjs() }); setDrawerOpen(true) }}>
          新建进货单
        </Button>
      </div>

      <Table
        loading={ordersQuery.isLoading}
        rowKey="id"
        size="middle"
        dataSource={ordersQuery.data ?? []}
        pagination={{ pageSize: 20 }}
        columns={[
          { title: 'PO 编号', dataIndex: 'po_no', width: 180,
            render: (v) => <Text strong style={{ color: '#52c41a' }}>{v}</Text>,
          },
          { title: '供应商', dataIndex: 'supplier_name', width: 150 },
          { title: '门店', dataIndex: 'outlet_name', width: 130 },
          { title: '商品数', dataIndex: 'item_count', width: 80, align: 'center' },
          { title: '总成本', dataIndex: 'total_cost', width: 110, align: 'right',
            render: (v) => <Text strong style={{ color: '#52c41a' }}>RM {Number(v).toFixed(2)}</Text>,
          },
          { title: '下单日', dataIndex: 'order_date', width: 110,
            render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '—',
          },
          { title: '状态', dataIndex: 'status', width: 100,
            render: (v) => { const s = STATUS_LABEL[v] || { label: v, color: 'default' }; return <Tag color={s.color}>{s.label}</Tag> },
          },
          { title: '操作', width: 200,
            render: (_, row) => (
              <Space>
                {row.status === 'ordered' && (
                  <Popconfirm title="确认到货？" description="商品会自动入库 + 更新成本" onConfirm={() => receiveMut.mutate(row.id)}>
                    <Button type="link" icon={<CheckCircleOutlined />}>到货</Button>
                  </Popconfirm>
                )}
                {row.status !== 'received' && row.status !== 'cancelled' && (
                  <Popconfirm title="取消进货单？" onConfirm={() => cancelMut.mutate(row.id)}>
                    <Button type="link" danger icon={<DeleteOutlined />}>取消</Button>
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]}
      />

      <Drawer
        title="新建进货单"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={680}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" loading={createMut.isPending} onClick={async () => {
              try {
                const v = await form.validateFields()
                createMut.mutate({
                  ...v,
                  order_date: v.order_date?.format('YYYY-MM-DD'),
                  items: v.items?.filter((i) => i?.inventory_id && i?.quantity) ?? [],
                })
              } catch { message.error('请检查表单') }
            }}>保存 + 下单</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label="门店" name="outlet_id" rules={[{ required: true, message: '必选' }]}>
              <Select options={(outletsQuery.data ?? []).map((o) => ({ value: o.id, label: o.name }))} />
            </Form.Item>
            <Form.Item label="供应商" name="supplier_id">
              <Select allowClear options={(suppliersQuery.data ?? []).map((s) => ({ value: s.id, label: s.name }))} />
            </Form.Item>
          </div>
          <Form.Item label="下单日期" name="order_date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Divider>商品明细</Divider>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Space key={key} style={{ marginBottom: 8 }} align="baseline">
                    <Form.Item {...rest} name={[name, 'inventory_id']} rules={[{ required: true, message: '必选' }]}>
                      <Select
                        showSearch optionFilterProp="label" placeholder="原料"
                        style={{ width: 220 }}
                        options={(invQuery.data ?? []).map((i) => ({ value: i.id, label: `${i.item_name} (${i.unit})` }))}
                      />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'quantity']} rules={[{ required: true, message: '必填' }]}>
                      <InputNumber placeholder="数量" min={0} step={0.1} style={{ width: 100 }} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'unit_cost']} rules={[{ required: true, message: '必填' }]}>
                      <InputNumber placeholder="单价 RM" min={0} step={0.01} precision={2} style={{ width: 110 }} />
                    </Form.Item>
                    <Button type="link" danger onClick={() => remove(name)}>删除</Button>
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add({})} block icon={<PlusOutlined />}>
                  添加一行
                </Button>
              </>
            )}
          </Form.List>

          <Form.Item label="备注" name="notes" style={{ marginTop: 16 }}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Drawer>
    </Card>
  )
}

// ─── Suppliers ─────────────────────────────────────────
function Suppliers() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()

  const listQuery = useQuery({
    queryKey: ['admin-suppliers'],
    queryFn: () => purchasesAPI.listSuppliers().then((r) => r.data.suppliers || []),
  })

  const createMut = useMutation({
    mutationFn: (d) => purchasesAPI.createSupplier(d),
    onSuccess: () => { message.success('已添加'); setModalOpen(false); form.resetFields(); qc.invalidateQueries({ queryKey: ['admin-suppliers'] }) },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => purchasesAPI.updateSupplier(id, data),
    onSuccess: () => { message.success('已更新'); setModalOpen(false); setEditing(null); form.resetFields(); qc.invalidateQueries({ queryKey: ['admin-suppliers'] }) },
  })
  const deleteMut = useMutation({
    mutationFn: (id) => purchasesAPI.deleteSupplier(id),
    onSuccess: () => { message.success('已删除'); qc.invalidateQueries({ queryKey: ['admin-suppliers'] }) },
  })

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>供应商 Suppliers</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true) }}>新增供应商</Button>
      </div>

      <Table
        loading={listQuery.isLoading}
        rowKey="id"
        size="middle"
        dataSource={listQuery.data ?? []}
        pagination={false}
        columns={[
          { title: '名称', dataIndex: 'name', render: (v) => <Text strong>{v}</Text> },
          { title: '联系人', dataIndex: 'contact', width: 120 },
          { title: '电话', dataIndex: 'phone', width: 140 },
          { title: '邮箱', dataIndex: 'email', width: 180 },
          { title: '操作', width: 160,
            render: (_, row) => (
              <Space>
                <Button type="link" icon={<EditOutlined />} onClick={() => { setEditing(row); form.setFieldsValue(row); setModalOpen(true) }}>编辑</Button>
                <Popconfirm title="确认删除？" onConfirm={() => deleteMut.mutate(row.id)}>
                  <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? '编辑供应商' : '新增供应商'}
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
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '必填' }]}>
            <Input placeholder="果园 XXX / 杯杯包装" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label="联系人" name="contact"><Input /></Form.Item>
            <Form.Item label="电话" name="phone"><Input /></Form.Item>
          </div>
          <Form.Item label="邮箱" name="email"><Input /></Form.Item>
          <Form.Item label="地址" name="address"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item label="备注" name="notes"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
