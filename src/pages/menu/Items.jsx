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
  StarOutlined, StarFilled, AppstoreOutlined, MinusCircleOutlined,
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
  const [sortBy, setSortBy] = useState('category')  // 默认按分类（自然分组）

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

  // ── Filter + Sort ──────────────────────────
  const filteredProducts = useMemo(() => {
    let list = [...products]
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

    // 排序（使用 zh-CN locale 让中文按拼音排）
    const cn = (a, b) => (a ?? '').localeCompare(b ?? '', 'zh-CN')
    switch (sortBy) {
      case 'category':
        // 按 分类 → 同分类内按 sort_order → 再按名字
        list.sort((a, b) => {
          const c = (a.category_id ?? 999) - (b.category_id ?? 999)
          if (c !== 0) return c
          const s = (a.sort_order ?? 0) - (b.sort_order ?? 0)
          if (s !== 0) return s
          return cn(a.name_cn, b.name_cn)
        })
        break
      case 'name_asc':
        list.sort((a, b) => cn(a.name_cn, b.name_cn))
        break
      case 'name_desc':
        list.sort((a, b) => cn(b.name_cn, a.name_cn))
        break
      case 'price_asc':
        list.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0))
        break
      case 'price_desc':
        list.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0))
        break
      case 'updated':
        list.sort((a, b) =>
          new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime()
        )
        break
      default:
        break
    }
    return list
  }, [products, filterCategory, searchText, sortBy])

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

      {/* Filter + Sort */}
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
        <Select
          value={sortBy}
          onChange={setSortBy}
          style={{ width: 180 }}
          options={[
            { value: 'category',   label: '排序：按分类（默认）' },
            { value: 'name_asc',   label: '排序：名字 A→Z' },
            { value: 'name_desc',  label: '排序：名字 Z→A' },
            { value: 'price_asc',  label: '排序：价格 低→高' },
            { value: 'price_desc', label: '排序：价格 高→低' },
            { value: 'updated',    label: '排序：最近更新' },
          ]}
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
        scroll={{ x: 700 }}
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

  // 拉所有 variant_groups / modifier_groups（不限定 product_id），给勾选 UI 用
  const allVariantsQuery = useQuery({
    queryKey: ['admin-all-variant-groups'],
    queryFn: () => variantsAPI.listGroups().then((r) => r.data),
    enabled: open,
  })
  const allModifiersQuery = useQuery({
    queryKey: ['admin-all-modifier-groups'],
    queryFn: () => modifiersAPI.listGroups().then((r) => r.data),
    enabled: open,
  })
  const allVariantGroups = allVariantsQuery.data?.groups ?? allVariantsQuery.data ?? []
  const allModifierGroups = allModifiersQuery.data?.groups ?? allModifiersQuery.data ?? []

  React.useEffect(() => {
    if (!open) return
    if (isEdit && detailQuery.data?.product) {
      const p = detailQuery.data.product
      form.setFieldsValue({
        ...p,
        tags: p.tags || [],
        // fruit_info 必须是数组 — null/object/string 都防御为 []
        fruit_info: Array.isArray(p.fruit_info) ? p.fruit_info : [],
        // 已勾选的关联组 IDs（后端 GET /admin/menu/products/:id 返回）
        variant_group_ids: detailQuery.data.variant_group_ids ?? [],
        modifier_group_ids: detailQuery.data.modifier_group_ids ?? [],
      })
    } else {
      form.resetFields()
      form.setFieldsValue({
        is_available: true,
        is_halal: true,
        is_featured: false,
        prep_time_sec: 180,
        sort_order: 0,
        fruit_info: [],
        variant_group_ids: [],
        modifier_group_ids: [],
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
      {/* 变量 / 加料组的勾选 UI 已经在 BasicTab 里（multi-select 关联式管理），不再需要独立 Tab */}
      <BasicTab
        form={form}
        categories={categories}
        allVariantGroups={allVariantGroups}
        allModifierGroups={allModifierGroups}
      />
    </Drawer>
  )
}

// ─── Tab: 基本信息 ─────────────────────────────────────
function BasicTab({ form, categories, allVariantGroups = [], allModifierGroups = [] }) {
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

      <Divider>真材实料（菜单卡 + 详情页绿色卡展示）</Divider>

      <Form.List name="fruit_info">
        {(fields, { add, remove }) => (
          <>
            {fields.length === 0 && (
              <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
                填了之后顾客 App 会看到「🥑 1 颗 牛油果 · 🥛 200ml 鲜奶...」这种用料展示。
              </Text>
            )}
            {fields.map(({ key, name }) => (
              <Space.Compact key={key} block style={{ marginBottom: 8 }}>
                <Form.Item
                  name={[name, 'emoji']}
                  noStyle
                  rules={[{ max: 4, message: '1-2 个 emoji' }]}
                >
                  <Input placeholder="🥑" style={{ width: 70, textAlign: 'center' }} />
                </Form.Item>
                <Form.Item
                  name={[name, 'name']}
                  noStyle
                  rules={[{ required: true, message: '必填' }]}
                >
                  <Input placeholder="牛油果" />
                </Form.Item>
                <Form.Item
                  name={[name, 'qty']}
                  noStyle
                  rules={[{ required: true, message: '必填' }]}
                >
                  <InputNumber placeholder="1" min={0} step={0.5} style={{ width: 90 }} />
                </Form.Item>
                <Form.Item
                  name={[name, 'unit']}
                  noStyle
                  rules={[{ required: true, message: '必填' }]}
                >
                  <Input placeholder="颗 / ml / g" style={{ width: 110 }} />
                </Form.Item>
                <Button
                  danger
                  type="text"
                  icon={<MinusCircleOutlined />}
                  onClick={() => remove(name)}
                  style={{ width: 40 }}
                />
              </Space.Compact>
            ))}
            <Button
              type="dashed"
              onClick={() =>
                add({ emoji: '', name: '', qty: 1, unit: '颗' })
              }
              block
              icon={<PlusOutlined />}
              style={{ marginTop: 4 }}
            >
              添加一行用料
            </Button>
            <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 11 }}>
              💡 建议 2-4 行；emoji 单元格留空也行（顾客 App 会默认显示一个圆点）；
              数量支持小数（0.5 颗）；单位中文英文都行（颗 / pcs / ml / g）。
            </Text>
          </>
        )}
      </Form.List>

      <Divider>变量 / 加料组关联</Divider>

      <Form.Item
        label="关联的变量组（杯型 / 茶基等）"
        name="variant_group_ids"
        tooltip="在「菜单 → 变量管理」创建好的变量组，这里勾选哪些适用于本产品。可多选；取消勾选 = 本产品不展示该组。"
      >
        <Select
          mode="multiple"
          allowClear
          placeholder={
            allVariantGroups.length === 0
              ? '还没有变量组 — 先去「菜单 → 变量」创建'
              : '选择本产品适用的变量组'
          }
          options={allVariantGroups.map((g) => ({
            value: g.id,
            label: `${g.name}${g.options?.length ? ` (${g.options.length} 项)` : ''}`,
          }))}
          optionFilterProp="label"
          showSearch
        />
      </Form.Item>

      <Form.Item
        label="关联的加料组（珍珠 / 椰果 / 燕麦奶等）"
        name="modifier_group_ids"
        tooltip="在「菜单 → 加料管理」创建好的加料组，这里勾选哪些适用于本产品。可多选；取消勾选 = 本产品不展示该组。"
      >
        <Select
          mode="multiple"
          allowClear
          placeholder={
            allModifierGroups.length === 0
              ? '还没有加料组 — 先去「菜单 → 加料」创建'
              : '选择本产品适用的加料组'
          }
          options={allModifierGroups.map((g) => ({
            value: g.id,
            label: `${g.name}${g.modifiers?.length ? ` (${g.modifiers.length} 项)` : ''}`,
          }))}
          optionFilterProp="label"
          showSearch
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

// ─── Tab: 变量管理（勾选模式） ──────────────────────────
function VariantsTab({ productId, groups }) {
  const qc = useQueryClient()
  const refetch = () => qc.invalidateQueries({ queryKey: ['admin-product-detail', productId] })

  // 拉取所有变量组
  const allGroupsQuery = useQuery({
    queryKey: ['admin-variants-all'],
    queryFn: () => variantsAPI.listGroups().then((r) => r.data.groups || []),
  })

  const allGroups = allGroupsQuery.data ?? []
  const assignedIds = new Set(groups.map((g) => g.id))

  const assignMut = useMutation({
    mutationFn: async ({ groupId, assign }) => {
      if (assign) {
        // 关联已有变量组到当前产品
        await variantsAPI.updateGroup(groupId, { product_id: productId })
      } else {
        // 解除关联（设为全局）
        await variantsAPI.updateGroup(groupId, { product_id: null })
      }
    },
    onSuccess: () => { refetch(); qc.invalidateQueries({ queryKey: ['admin-variants-all'] }) },
    onError: (e) => message.error('操作失败'),
  })

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary">
          勾选此产品要使用的变量组。新建/编辑变量请在 <a href="/menu/variants" onClick={(e) => { e.preventDefault(); window.location.href = '/menu/variants' }}>变量管理</a> 页面操作。
        </Text>
      </div>

      {allGroupsQuery.isLoading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>
      ) : (
        <Card size="small">
          {allGroups.map((g) => {
            const isAssigned = assignedIds.has(g.id)
            return (
              <div
                key={g.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: '1px solid #f0f0f0',
                }}
              >
                <Space>
                  <Switch
                    checked={isAssigned}
                    loading={assignMut.isPending}
                    onChange={(checked) => assignMut.mutate({ groupId: g.id, assign: checked })}
                  />
                  <Text strong>{g.name}</Text>
                  {g.product_name && g.product_name !== groups[0]?.product_name && (
                    <Tag color="blue">{g.product_name}</Tag>
                  )}
                  <Tag color={g.is_required ? 'green' : 'default'}>{g.is_required ? '必选' : '可选'}</Tag>
                  <Tag>{g.selection_type === 'single' ? '单选' : '多选'}</Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {g.options?.length || 0} 个选项
                  </Text>
                </Space>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}

// ─── Tab: Modifier 管理（勾选模式） ────────────────────
function ModifiersTab({ productId, groups }) {
  const qc = useQueryClient()
  const refetch = () => qc.invalidateQueries({ queryKey: ['admin-product-detail', productId] })

  const allGroupsQuery = useQuery({
    queryKey: ['admin-modifiers-all'],
    queryFn: () => modifiersAPI.listGroups().then((r) => r.data.groups || []),
  })

  const allGroups = allGroupsQuery.data ?? []
  const assignedIds = new Set(groups.map((g) => g.id))

  const assignMut = useMutation({
    mutationFn: async ({ groupId, assign }) => {
      await modifiersAPI.updateGroup(groupId, { product_id: assign ? productId : null })
    },
    onSuccess: () => { refetch(); qc.invalidateQueries({ queryKey: ['admin-modifiers-all'] }) },
    onError: (e) => message.error('操作失败'),
  })

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary">
          勾选此产品要使用的加料组。新建/编辑加料请在 <a href="/menu/modifiers" onClick={(e) => { e.preventDefault(); window.location.href = '/menu/modifiers' }}>加料管理</a> 页面操作。
        </Text>
      </div>

      {allGroupsQuery.isLoading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>
      ) : (
        <Card size="small">
          {allGroups.map((g) => {
            const isAssigned = assignedIds.has(g.id)
            return (
              <div
                key={g.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: '1px solid #f0f0f0',
                }}
              >
                <Space>
                  <Switch
                    checked={isAssigned}
                    loading={assignMut.isPending}
                    onChange={(checked) => assignMut.mutate({ groupId: g.id, assign: checked })}
                  />
                  <Text strong>{g.name}</Text>
                  {g.product_name && g.product_name !== groups[0]?.product_name && (
                    <Tag color="blue">{g.product_name}</Tag>
                  )}
                  <Tag color={g.is_required ? 'green' : 'default'}>{g.is_required ? '必选' : '可选'}</Tag>
                  <Tag>{g.selection_type === 'single' ? '单选' : '多选'}</Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {g.modifiers?.length || 0} 个加料项
                  </Text>
                </Space>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}
