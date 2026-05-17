/**
 * Items.jsx — V2 产品管理完整页
 *
 * 列表（含分类筛选 + 搜索）+ 抽屉表单（新增 / 编辑，含变量 + Modifier 管理）
 */

import React, { useState, useMemo } from 'react'
import {
  Table, Button, Space, Drawer, Form, Input, InputNumber, Select, Switch,
  Tag, message, Modal, Card, Tabs, Popconfirm, Tooltip, Typography, Image, Divider,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  StarOutlined, StarFilled, AppstoreOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsAPI, categoriesAPI, variantsAPI, modifiersAPI } from '../../services/api'

const { Text, Title } = Typography
const { TextArea } = Input

export default function Items() {
  const qc = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filterCategory, setFilterCategory] = useState(null)
  const [searchText, setSearchText] = useState('')

  // ── Queries ────────────────────────────────
  const productsQuery = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => productsAPI.list().then((r) => r.data.products || []),
  })
  const categoriesQuery = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => categoriesAPI.list().then((r) => r.data.categories || []),
  })

  const products = productsQuery.data ?? []
  const categories = categoriesQuery.data ?? []

  // ── Filter ─────────────────────────────────
  const filteredProducts = useMemo(() => {
    let list = products
    if (filterCategory) list = list.filter((p) => p.category_id === filterCategory)
    if (searchText.trim()) {
      const q = searchText.toLowerCase()
      list = list.filter(
        (p) =>
          p.name_cn?.toLowerCase().includes(q) ||
          p.name_en?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q),
      )
    }
    return list
  }, [products, filterCategory, searchText])

  // ── Mutations ──────────────────────────────
  const deleteMut = useMutation({
    mutationFn: (id) => productsAPI.delete(id),
    onSuccess: () => {
      message.success('产品已删除')
      qc.invalidateQueries({ queryKey: ['admin-products'] })
    },
    onError: (e) => message.error(e.response?.data?.message ?? '删除失败'),
  })

  // ── Columns ────────────────────────────────
  const columns = [
    {
      title: '产品',
      key: 'name',
      render: (_, row) => (
        <Space>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              background: '#f6ffed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {row.image_url ? (
              <Image src={row.image_url} width={48} height={48} preview={false} />
            ) : (
              <span style={{ fontSize: 24 }}>🥤</span>
            )}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>
              {row.name_cn}
              {row.is_featured && (
                <StarFilled style={{ color: '#faad14', marginLeft: 6, fontSize: 12 }} />
              )}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {row.name_en || '—'}
              {row.sku ? ` · SKU: ${row.sku}` : ''}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category_name',
      width: 120,
      render: (v) => v ? <Tag color="green">{v}</Tag> : <Text type="secondary">未分类</Text>,
    },
    {
      title: '价格',
      dataIndex: 'price',
      width: 100,
      align: 'right',
      render: (v) => <Text strong style={{ color: '#52c41a' }}>RM {Number(v).toFixed(2)}</Text>,
    },
    {
      title: '成本',
      dataIndex: 'base_cost',
      width: 90,
      align: 'right',
      render: (v) => v ? `RM ${Number(v).toFixed(2)}` : <Text type="secondary">—</Text>,
    },
    {
      title: '毛利',
      key: 'margin',
      width: 90,
      align: 'right',
      render: (_, row) => {
        if (!row.base_cost) return <Text type="secondary">—</Text>
        const margin = ((row.price - row.base_cost) / row.price * 100).toFixed(0)
        const color = margin >= 60 ? '#52c41a' : margin >= 40 ? '#faad14' : '#ff4d4f'
        return <Text style={{ color }}>{margin}%</Text>
      },
    },
    {
      title: '状态',
      dataIndex: 'is_available',
      width: 80,
      render: (v) => v ? <Tag color="success">在售</Tag> : <Tag>下架</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_, row) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingId(row.id)
              setDrawerOpen(true)
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除此产品？"
            description="软删除，历史订单不受影响"
            onConfirm={() => deleteMut.mutate(row.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <AppstoreOutlined /> 产品 Items
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            管理所有产品 · 含变量（杯型/茶基）+ Modifier（加料） · 共 {products.length} 个
          </Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingId(null)
            setDrawerOpen(true)
          }}
        >
          新建产品
        </Button>
      </div>

      {/* Filter */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          prefix={<SearchOutlined />}
          placeholder="搜索 名称 / SKU"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 240 }}
          allowClear
        />
        <Select
          placeholder="按分类筛选"
          style={{ width: 180 }}
          allowClear
          value={filterCategory}
          onChange={setFilterCategory}
          options={categories.map((c) => ({ value: c.id, label: `${c.name_cn} (${c.product_count})` }))}
        />
        <Text type="secondary">显示 {filteredProducts.length} / {products.length}</Text>
      </Space>

      <Table
        loading={productsQuery.isLoading}
        rowKey="id"
        columns={columns}
        dataSource={filteredProducts}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        size="middle"
      />

      {/* 抽屉 — 新增 / 编辑 */}
      <ProductDrawer
        open={drawerOpen}
        editingId={editingId}
        categories={categories}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => {
          setDrawerOpen(false)
          qc.invalidateQueries({ queryKey: ['admin-products'] })
        }}
      />
    </Card>
  )
}

// ─── Product Drawer ─────────────────────────────────────
function ProductDrawer({ open, editingId, categories, onClose, onSaved }) {
  const [form] = Form.useForm()
  const isEdit = !!editingId

  // 编辑模式 — 拉详情
  const detailQuery = useQuery({
    queryKey: ['admin-product-detail', editingId],
    queryFn: () => productsAPI.detail(editingId).then((r) => r.data),
    enabled: !!editingId && open,
  })

  React.useEffect(() => {
    if (!open) return
    if (isEdit && detailQuery.data?.product) {
      const p = detailQuery.data.product
      form.setFieldsValue({
        ...p,
        tags: p.tags || [],
      })
    } else {
      form.resetFields()
      form.setFieldsValue({
        is_available: true,
        is_halal: true,
        is_featured: false,
        prep_time_sec: 180,
        sort_order: 0,
      })
    }
  }, [open, isEdit, detailQuery.data])

  const createMut = useMutation({
    mutationFn: (data) => productsAPI.create(data),
    onSuccess: () => {
      message.success('产品已创建')
      onSaved()
    },
    onError: (e) => message.error(e.response?.data?.message ?? '创建失败'),
  })

  const updateMut = useMutation({
    mutationFn: (data) => productsAPI.update(editingId, data),
    onSuccess: () => {
      message.success('产品已更新')
      onSaved()
    },
    onError: (e) => message.error(e.response?.data?.message ?? '更新失败'),
  })

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (isEdit) updateMut.mutate(values)
      else createMut.mutate(values)
    } catch {
      message.error('请检查表单')
    }
  }

  return (
    <Drawer
      title={isEdit ? `编辑产品` : '新建产品'}
      open={open}
      onClose={onClose}
      width={720}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            loading={createMut.isPending || updateMut.isPending}
            onClick={handleSubmit}
          >
            保存
          </Button>
        </Space>
      }
    >
      <Tabs
        defaultActiveKey="basic"
        items={[
          {
            key: 'basic',
            label: '基本信息',
            children: <BasicTab form={form} categories={categories} />,
          },
          {
            key: 'variants',
            label: `变量 Variants${isEdit ? ` (${detailQuery.data?.variant_groups?.length ?? 0})` : ''}`,
            disabled: !isEdit,
            children: isEdit ? <VariantsTab productId={editingId} groups={detailQuery.data?.variant_groups ?? []} /> : null,
          },
          {
            key: 'modifiers',
            label: `加料 Modifiers${isEdit ? ` (${detailQuery.data?.modifier_groups?.length ?? 0})` : ''}`,
            disabled: !isEdit,
            children: isEdit ? <ModifiersTab productId={editingId} groups={detailQuery.data?.modifier_groups ?? []} /> : null,
          },
        ]}
      />
    </Drawer>
  )
}

// ─── Tab: 基本信息 ─────────────────────────────────────
function BasicTab({ form, categories }) {
  return (
    <Form form={form} layout="vertical">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Form.Item label="中文名" name="name_cn" rules={[{ required: true, message: '请输入中文名' }]}>
          <Input placeholder="招牌牛油果奶昔" />
        </Form.Item>
        <Form.Item label="英文名" name="name_en">
          <Input placeholder="Signature Avo Smoothie" />
        </Form.Item>
      </div>

      <Form.Item label="分类" name="category_id" rules={[{ required: true, message: '请选择分类' }]}>
        <Select
          placeholder="选择分类"
          options={categories.map((c) => ({ value: c.id, label: c.name_cn }))}
        />
      </Form.Item>

      <Form.Item label="简短描述（菜单卡片显示）" name="short_desc">
        <Input placeholder="当日鲜采牛油果 + 鲜奶 + 本地蜂蜜" maxLength={200} showCount />
      </Form.Item>

      <Form.Item label="产品故事（顾客 App 详情页显示）" name="story">
        <TextArea
          rows={3}
          placeholder="每一杯都坚持现采现榨。我们的牛油果来自金马仑高原合作农场..."
          maxLength={500}
          showCount
        />
      </Form.Item>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <Form.Item label="价格 RM" name="price" rules={[{ required: true, message: '请输入价格' }]}>
          <InputNumber min={0} step={0.5} precision={2} style={{ width: '100%' }} prefix="RM" />
        </Form.Item>
        <Form.Item label="成本 RM (选填)" name="base_cost" tooltip="预估单杯成本，用于算毛利率">
          <InputNumber min={0} step={0.1} precision={2} style={{ width: '100%' }} prefix="RM" />
        </Form.Item>
        <Form.Item label="制作时长 (秒)" name="prep_time_sec">
          <InputNumber min={30} max={1200} step={30} style={{ width: '100%' }} />
        </Form.Item>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Form.Item label="SKU" name="sku" tooltip="库存编号，可选">
          <Input placeholder="AVO-SIG-001" />
        </Form.Item>
        <Form.Item label="条形码" name="barcode">
          <Input placeholder="可选" />
        </Form.Item>
      </div>

      <Form.Item label="产品图 URL" name="image_url">
        <Input placeholder="https://... (V3 加上传)" />
      </Form.Item>

      <Form.Item label="标签" name="tags" tooltip="halal / vegan / seasonal / signature">
        <Select
          mode="tags"
          placeholder="按 Enter 添加"
          options={[
            { value: 'halal',     label: 'Halal' },
            { value: 'vegan',     label: 'Vegan' },
            { value: 'seasonal',  label: 'Seasonal' },
            { value: 'signature', label: 'Signature' },
            { value: 'low-sugar', label: 'Low Sugar' },
            { value: 'new',       label: 'New' },
          ]}
        />
      </Form.Item>

      <Divider />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
        <Form.Item label="上架" name="is_available" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item label="清真 Halal" name="is_halal" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item label="精选 Featured" name="is_featured" valuePropName="checked" tooltip="在菜单显眼位置">
          <Switch />
        </Form.Item>
        <Form.Item label="排序" name="sort_order" tooltip="数字越小越靠前">
          <InputNumber min={0} max={999} style={{ width: '100%' }} />
        </Form.Item>
      </div>
    </Form>
  )
}

// ─── Tab: 变量管理 ─────────────────────────────────────
function VariantsTab({ productId, groups }) {
  const qc = useQueryClient()
  const refetch = () => qc.invalidateQueries({ queryKey: ['admin-product-detail', productId] })

  const addGroup = async () => {
    const name = prompt('变量组名称（如：杯型 / 茶基 / 糖度）')
    if (!name) return
    try {
      await variantsAPI.createGroup({ product_id: productId, name, sort_order: groups.length })
      message.success('已添加')
      refetch()
    } catch (e) {
      message.error(e.response?.data?.message ?? '添加失败')
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text type="secondary">
          变量 = 必选项（杯型 M/L、茶基红/绿）影响价格。给同产品的不同卖法。
        </Text>
        <Button icon={<PlusOutlined />} onClick={addGroup}>添加变量组</Button>
      </div>

      {groups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          还没有变量组。点击"添加变量组"开始。
        </div>
      ) : (
        groups.map((g) => (
          <VariantGroupCard key={g.id} group={g} productId={productId} onChange={refetch} />
        ))
      )}
    </div>
  )
}

function VariantGroupCard({ group, productId, onChange }) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState(0)

  const handleDelete = async () => {
    if (!confirm(`删除变量组「${group.name}」及其所有选项？`)) return
    try {
      await variantsAPI.deleteGroup(group.id)
      onChange()
    } catch (e) {
      message.error('删除失败')
    }
  }

  const handleAddOption = async () => {
    if (!newName) return
    try {
      await variantsAPI.createOption({
        variant_group_id: group.id,
        name: newName,
        price_delta: newPrice,
        sort_order: group.options.length,
      })
      setNewName('')
      setNewPrice(0)
      setAdding(false)
      onChange()
    } catch (e) {
      message.error('添加失败')
    }
  }

  const handleDeleteOption = async (id) => {
    try {
      await variantsAPI.deleteOption(id)
      onChange()
    } catch (e) {
      message.error('删除失败')
    }
  }

  return (
    <Card
      size="small"
      style={{ marginBottom: 12 }}
      title={<Text strong>{group.name}</Text>}
      extra={<Button danger size="small" type="link" onClick={handleDelete}>删除组</Button>}
    >
      <Table
        size="small"
        rowKey="id"
        dataSource={group.options}
        pagination={false}
        columns={[
          { title: '选项名', dataIndex: 'name' },
          {
            title: '价格调整',
            dataIndex: 'price_delta',
            width: 120,
            render: (v) => (Number(v) === 0 ? <Text type="secondary">±0</Text> : <Text>{v > 0 ? `+RM ${v}` : `-RM ${Math.abs(v)}`}</Text>),
          },
          {
            title: '默认',
            dataIndex: 'is_default',
            width: 80,
            render: (v) => v ? <Tag color="green">默认</Tag> : null,
          },
          {
            title: '操作',
            width: 80,
            render: (_, row) => (
              <Button type="link" danger size="small" onClick={() => handleDeleteOption(row.id)}>
                删除
              </Button>
            ),
          },
        ]}
      />

      {adding ? (
        <Space style={{ marginTop: 8 }}>
          <Input placeholder="选项名" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <InputNumber placeholder="价格调整" value={newPrice} onChange={setNewPrice} prefix="RM" />
          <Button type="primary" size="small" onClick={handleAddOption}>添加</Button>
          <Button size="small" onClick={() => { setAdding(false); setNewName('') }}>取消</Button>
        </Space>
      ) : (
        <Button size="small" icon={<PlusOutlined />} style={{ marginTop: 8 }} onClick={() => setAdding(true)}>
          添加选项
        </Button>
      )}
    </Card>
  )
}

// ─── Tab: Modifier 管理 ────────────────────────────────
function ModifiersTab({ productId, groups }) {
  const qc = useQueryClient()
  const refetch = () => qc.invalidateQueries({ queryKey: ['admin-product-detail', productId] })

  const addGroup = async () => {
    const name = prompt('加料组名称（如：加料 / Topping）')
    if (!name) return
    try {
      await modifiersAPI.createGroup({ product_id: productId, name, sort_order: groups.length })
      message.success('已添加')
      refetch()
    } catch (e) {
      message.error('添加失败')
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text type="secondary">
          Modifier = 可选加料（珍珠、椰果、燕麦奶）一般多选，每个加价。
        </Text>
        <Button icon={<PlusOutlined />} onClick={addGroup}>添加加料组</Button>
      </div>

      {groups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          还没有加料组。点击"添加加料组"开始。
        </div>
      ) : (
        groups.map((g) => (
          <ModifierGroupCard key={g.id} group={g} productId={productId} onChange={refetch} />
        ))
      )}
    </div>
  )
}

function ModifierGroupCard({ group, productId, onChange }) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState(1)

  const handleDelete = async () => {
    if (!confirm(`删除加料组「${group.name}」及其所有项？`)) return
    try {
      await modifiersAPI.deleteGroup(group.id)
      onChange()
    } catch (e) {
      message.error('删除失败')
    }
  }

  const handleAddItem = async () => {
    if (!newName) return
    try {
      await modifiersAPI.createItem({
        modifier_group_id: group.id,
        name: newName,
        price: newPrice,
        sort_order: group.modifiers.length,
      })
      setNewName('')
      setNewPrice(1)
      setAdding(false)
      onChange()
    } catch (e) {
      message.error('添加失败')
    }
  }

  const handleDeleteItem = async (id) => {
    try {
      await modifiersAPI.deleteItem(id)
      onChange()
    } catch (e) {
      message.error('删除失败')
    }
  }

  return (
    <Card
      size="small"
      style={{ marginBottom: 12 }}
      title={<Text strong>{group.name}{group.product_id === null && <Tag color="blue" style={{ marginLeft: 8 }}>全局</Tag>}</Text>}
      extra={group.product_id ? <Button danger size="small" type="link" onClick={handleDelete}>删除组</Button> : null}
    >
      <Table
        size="small"
        rowKey="id"
        dataSource={group.modifiers}
        pagination={false}
        columns={[
          { title: '加料项', dataIndex: 'name' },
          {
            title: '加价',
            dataIndex: 'price',
            width: 100,
            render: (v) => <Text strong style={{ color: '#52c41a' }}>+RM {Number(v).toFixed(2)}</Text>,
          },
          {
            title: '上架',
            dataIndex: 'is_available',
            width: 80,
            render: (v) => v ? <Tag color="success">在售</Tag> : <Tag>下架</Tag>,
          },
          {
            title: '操作',
            width: 80,
            render: (_, row) => (
              <Button type="link" danger size="small" onClick={() => handleDeleteItem(row.id)}>
                删除
              </Button>
            ),
          },
        ]}
      />

      {adding ? (
        <Space style={{ marginTop: 8 }}>
          <Input placeholder="加料名（珍珠 / 椰果...）" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <InputNumber placeholder="加价" value={newPrice} onChange={setNewPrice} prefix="RM" min={0} step={0.5} />
          <Button type="primary" size="small" onClick={handleAddItem}>添加</Button>
          <Button size="small" onClick={() => { setAdding(false); setNewName('') }}>取消</Button>
        </Space>
      ) : (
        <Button size="small" icon={<PlusOutlined />} style={{ marginTop: 8 }} onClick={() => setAdding(true)}>
          添加加料项
        </Button>
      )}
    </Card>
  )
}
