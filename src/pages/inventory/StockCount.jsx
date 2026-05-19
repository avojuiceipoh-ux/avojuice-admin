import React, { useState } from 'react'
import {
  Card, Table, Button, Drawer, Form, InputNumber, Select, Input,
  Space, Tag, message, Typography, Modal, Tabs, Divider, Alert,
} from 'antd'
import { PlusOutlined, FileSearchOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { purchasesAPI, inventoryAPI, outletsAPI } from '../../services/api'

const { Text, Title } = Typography

export default function StockCount() {
  const qc = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [form] = Form.useForm()

  const listQuery = useQuery({
    queryKey: ['admin-stock-counts'],
    queryFn: () => purchasesAPI.listCounts().then((r) => r.data.counts || []),
  })
  const invQuery = useQuery({
    queryKey: ['admin-inventory'],
    queryFn: () => inventoryAPI.list().then((r) => r.data.items || []),
  })
  const outletsQuery = useQuery({
    queryKey: ['outlets'],
    queryFn: () => outletsAPI.list().then((r) => r.data.outlets || []),
  })

  const detailQuery = useQuery({
    queryKey: ['stock-count-detail', viewing?.id],
    queryFn: () => purchasesAPI.getCount(viewing.id).then((r) => r.data),
    enabled: !!viewing,
  })

  const createMut = useMutation({
    mutationFn: (d) => purchasesAPI.createCount(d),
    onSuccess: () => {
      message.success('盘点已提交，库存已调整')
      setDrawerOpen(false); form.resetFields()
      qc.invalidateQueries({ queryKey: ['admin-stock-counts'] })
      qc.invalidateQueries({ queryKey: ['admin-inventory'] })
      qc.invalidateQueries({ queryKey: ['admin-wastage'] })
    },
  })

  const openCountForm = () => {
    form.resetFields()
    // 预填所有原料项 = 当前库存量
    const items = (invQuery.data ?? []).map((i) => ({
      inventory_id: i.id,
      item_name: i.item_name,
      unit: i.unit,
      expected_qty: Number(i.quantity),
      actual_qty: Number(i.quantity),
    }))
    form.setFieldsValue({ items })
    setDrawerOpen(true)
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}><FileSearchOutlined /> 盘点 Stock Count</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            实地点完原料 → 输入实际库存 → 自动算差异 + 调整 + 短量记损耗
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCountForm}>
          新建盘点
        </Button>
      </div>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="盘点流程"
        description="点开始盘点 → 系统按当前库存预填 → 你按实际数量调整 → 提交。短量会自动登记为损耗。"
      />

      <Table
        loading={listQuery.isLoading}
        rowKey="id"
        size="middle"
        dataSource={listQuery.data ?? []}
        pagination={{ pageSize: 30 }}
        columns={[
          { title: '盘点时间', dataIndex: 'counted_at', width: 180,
            render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
          },
          { title: '门店', dataIndex: 'outlet_name', width: 140 },
          { title: '盘点人', dataIndex: 'counted_by_name', width: 100,
            render: (v) => v || <Text type="secondary">—</Text>,
          },
          { title: '项目数', dataIndex: 'item_count', width: 80, align: 'center' },
          { title: '总差异成本', dataIndex: 'total_variance', width: 140, align: 'right',
            render: (v) => {
              const n = Number(v || 0)
              if (n === 0) return <Tag color="default">无差异</Tag>
              return <Text strong style={{ color: '#ff4d4f' }}>-RM {Math.abs(n).toFixed(2)}</Text>
            },
          },
          { title: '备注', dataIndex: 'notes' },
          { title: '', width: 80,
            render: (_, row) => <Button type="link" onClick={() => setViewing(row)}>详情</Button>,
          },
        ]}
      />

      {/* 新盘点抽屉 */}
      <Drawer
        title="新建盘点"
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
                  outlet_id: v.outlet_id,
                  notes: v.notes,
                  items: v.items
                    .filter((i) => i.actual_qty !== i.expected_qty)
                    .map((i) => ({ inventory_id: i.inventory_id, actual_qty: i.actual_qty })),
                })
              } catch { message.error('请检查表单') }
            }}>提交盘点</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item label="门店" name="outlet_id" rules={[{ required: true, message: '必选' }]}>
            <Select options={(outletsQuery.data ?? []).map((o) => ({ value: o.id, label: o.name }))} />
          </Form.Item>

          <Divider>原料盘点（系统期望 vs 你实际数到）</Divider>

          <Form.List name="items">
            {(fields) => (
              <div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '8px 0',
                  borderBottom: '1px solid #f0f0f0',
                  color: '#666',
                }}>
                  <div>原料</div><div style={{ textAlign: 'right' }}>期望</div><div style={{ textAlign: 'right' }}>实际</div><div style={{ textAlign: 'right' }}>差异</div>
                </div>
                {fields.map(({ key, name }) => (
                  <Form.Item shouldUpdate noStyle key={key}>
                    {() => {
                      const item = form.getFieldValue(['items', name])
                      const diff = (item?.actual_qty ?? 0) - (item?.expected_qty ?? 0)
                      const diffStr = diff === 0 ? '0' : (diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2))
                      const diffColor = diff === 0 ? '#999' : (diff < 0 ? '#ff4d4f' : '#52c41a')

                      return (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 1fr 1fr',
                          gap: 8,
                          alignItems: 'center',
                          padding: '4px 0',
                          borderBottom: '1px solid #fafafa',
                        }}>
                          <Text strong style={{ fontSize: 13 }}>
                            {item?.item_name} <Text type="secondary" style={{ fontSize: 11 }}>({item?.unit})</Text>
                          </Text>
                          <Text style={{ textAlign: 'right', color: '#999' }}>
                            {Number(item?.expected_qty ?? 0).toFixed(2)}
                          </Text>
                          <Form.Item name={[name, 'actual_qty']} style={{ marginBottom: 0 }}>
                            <InputNumber min={0} step={0.1} style={{ width: '100%' }} size="small" />
                          </Form.Item>
                          <Text style={{ textAlign: 'right', color: diffColor, fontWeight: 600 }}>
                            {diffStr}
                          </Text>
                        </div>
                      )
                    }}
                  </Form.Item>
                ))}
              </div>
            )}
          </Form.List>

          <Form.Item label="备注" name="notes" style={{ marginTop: 16 }}>
            <Input.TextArea rows={2} placeholder="例如：月底大盘点 / 周一例行盘点" />
          </Form.Item>
        </Form>
      </Drawer>

      {/* 详情 Modal */}
      <Modal
        title={`盘点详情 · ${viewing ? dayjs(viewing.counted_at).format('YYYY-MM-DD HH:mm') : ''}`}
        open={!!viewing}
        onCancel={() => setViewing(null)}
        footer={null}
        width={680}
      >
        {detailQuery.isLoading ? '加载中...' : (
          <Table
            size="small"
            rowKey="id"
            dataSource={detailQuery.data?.items ?? []}
            pagination={false}
            columns={[
              { title: '原料', dataIndex: 'item_name' },
              { title: '期望', dataIndex: 'expected_qty', width: 80, align: 'right',
                render: (v, row) => `${Number(v).toFixed(2)} ${row.unit}`,
              },
              { title: '实际', dataIndex: 'actual_qty', width: 80, align: 'right',
                render: (v, row) => `${Number(v).toFixed(2)} ${row.unit}`,
              },
              { title: '差异', dataIndex: 'variance', width: 90, align: 'right',
                render: (v) => {
                  const n = Number(v || 0)
                  if (n === 0) return <Text type="secondary">0</Text>
                  return <Text style={{ color: n < 0 ? '#ff4d4f' : '#52c41a' }}>{n > 0 ? '+' : ''}{n.toFixed(2)}</Text>
                },
              },
              { title: '损失 RM', dataIndex: 'variance_cost', width: 100, align: 'right',
                render: (v, row) => {
                  if (!v || Number(row.variance) >= 0) return <Text type="secondary">—</Text>
                  return <Text strong style={{ color: '#ff4d4f' }}>RM {Number(v).toFixed(2)}</Text>
                },
              },
            ]}
          />
        )}
      </Modal>
    </Card>
  )
}
