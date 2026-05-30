/**
 * Banners.jsx — 海报管理
 *
 * 按 placement (home / profile) 分两个 tab。
 * 每张海报支持：上传图片、标题、跳转链接、起止时间、启用/排序/删除。
 */

import React, { useState, useMemo } from 'react'
import {
  Card, Tabs, Table, Button, Modal, Form, Input, Switch, Upload, message,
  Image, Space, InputNumber, Select, DatePicker, Tag, Popconfirm, Empty, Typography
} from 'antd'
import {
  PictureOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  LoadingOutlined, UploadOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { bannersAPI } from '../services/api'

const { Title, Text } = Typography
const { TabPane } = Tabs

const PLACEMENT_TABS = [
  { key: 'home',    label: '主页海报' },
  { key: 'profile', label: '我的页面海报' },
]

const LINK_TYPE_OPTIONS = [
  { label: '无跳转（纯展示）',     value: 'none' },
  { label: '跳产品（填产品 ID）',   value: 'product' },
  { label: '跳分类（填分类 ID）',   value: 'category' },
  { label: '跳网页（填完整 URL）',  value: 'url' },
]

function beforeUpload(file) {
  const ok = ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
  if (!ok)   { message.error('仅支持 PNG / JPG / WebP'); return Upload.LIST_IGNORE }
  const lt = file.size / 1024 / 1024 < 5
  if (!lt)   { message.error('文件需小于 5MB');           return Upload.LIST_IGNORE }
  return true
}

export default function Banners() {
  const [tab, setTab] = useState('home')
  const qc = useQueryClient()
  const [editing, setEditing] = useState(null) // null | { ...banner } | 'NEW'
  const [form] = Form.useForm()
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-banners', tab],
    queryFn: () => bannersAPI.list(tab).then(r => r.data.banners || []),
  })

  const createMut = useMutation({
    mutationFn: (body) => bannersAPI.create(body),
    onSuccess: () => { message.success('海报已创建'); qc.invalidateQueries({ queryKey: ['admin-banners', tab] }); close() },
    onError:   (e) => message.error(e?.response?.data?.message || '创建失败'),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, body }) => bannersAPI.update(id, body),
    onSuccess: () => { message.success('已更新'); qc.invalidateQueries({ queryKey: ['admin-banners', tab] }); close() },
    onError:   (e) => message.error(e?.response?.data?.message || '更新失败'),
  })
  const deleteMut = useMutation({
    mutationFn: (id) => bannersAPI.delete(id),
    onSuccess: () => { message.success('已删除'); qc.invalidateQueries({ queryKey: ['admin-banners', tab] }) },
    onError:   () => message.error('删除失败'),
  })

  const openNew = () => {
    setEditing('NEW')
    setImageUrl(null)
    form.resetFields()
    form.setFieldsValue({
      placement: tab, link_type: 'none', sort_order: 0, is_active: true,
    })
  }
  const openEdit = (row) => {
    setEditing(row)
    setImageUrl(row.image_url)
    form.setFieldsValue({
      ...row,
      start_at: row.start_at ? dayjs(row.start_at) : null,
      end_at:   row.end_at   ? dayjs(row.end_at)   : null,
    })
  }
  const close = () => { setEditing(null); setImageUrl(null); form.resetFields() }

  const handleUpload = async (options) => {
    const { file, onSuccess, onError } = options
    setUploading(true)
    try {
      const res = await bannersAPI.upload(file)
      const url = res.data.image_url
      setImageUrl(url)
      form.setFieldsValue({ image_url: url })
      onSuccess(res, file)
      message.success('图片上传成功')
    } catch (e) {
      onError(e)
      message.error(e?.response?.data?.message || '上传失败')
    } finally { setUploading(false) }
  }

  const onSubmit = async () => {
    const v = await form.validateFields()
    const body = {
      ...v,
      start_at: v.start_at ? v.start_at.toISOString() : null,
      end_at:   v.end_at   ? v.end_at.toISOString()   : null,
    }
    if (editing === 'NEW') createMut.mutate(body)
    else                   updateMut.mutate({ id: editing.id, body })
  }

  const columns = useMemo(() => [
    {
      title: '预览', dataIndex: 'image_url', width: 160,
      render: (url) => url
        ? <Image src={url} width={140} height={56} style={{ objectFit: 'cover', borderRadius: 8 }} preview={{ mask: '查看' }} />
        : <span style={{ color: '#999' }}>—</span>,
    },
    {
      title: '标题', dataIndex: 'title', width: 180,
      render: (t) => t || <Text type="secondary">—</Text>,
    },
    {
      title: '跳转', key: 'link', width: 220,
      render: (_, row) => {
        if (!row.link_type || row.link_type === 'none') return <Text type="secondary">无</Text>
        return <Space>
          <Tag color="blue">{row.link_type}</Tag>
          <Text code style={{ fontSize: 12 }}>{row.link_value || '—'}</Text>
        </Space>
      },
    },
    { title: '排序', dataIndex: 'sort_order', width: 80, align: 'center' },
    {
      title: '生效期', key: 'period', width: 220,
      render: (_, row) => (
        <Text style={{ fontSize: 12 }} type="secondary">
          {row.start_at ? dayjs(row.start_at).format('MM-DD HH:mm') : '—'} ~ {row.end_at ? dayjs(row.end_at).format('MM-DD HH:mm') : '∞'}
        </Text>
      ),
    },
    {
      title: '状态', dataIndex: 'is_active', width: 100, align: 'center',
      render: (v, row) => (
        <Switch
          checked={v}
          onChange={(checked) => updateMut.mutate({ id: row.id, body: { is_active: checked } })}
          checkedChildren="开"
          unCheckedChildren="关"
        />
      ),
    },
    {
      title: '操作', key: 'act', width: 140, fixed: 'right',
      render: (_, row) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(row)}>编辑</Button>
          <Popconfirm title="确定删除这张海报？" onConfirm={() => deleteMut.mutate(row.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ], [updateMut, deleteMut])

  return (
    <Card
      title={<Space><PictureOutlined /><span>海报管理</span></Space>}
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={openNew}>新增海报</Button>}
    >
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={PLACEMENT_TABS.map(t => ({ key: t.key, label: t.label }))}
      />

      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={data || []}
        columns={columns}
        scroll={{ x: 1100 }}
        pagination={false}
        locale={{ emptyText: <Empty description="还没有海报，点右上角新增" /> }}
      />

      <Modal
        title={editing === 'NEW' ? '新增海报' : '编辑海报'}
        open={!!editing}
        onCancel={close}
        onOk={onSubmit}
        confirmLoading={createMut.isPending || updateMut.isPending}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item label="投放位置" name="placement" rules={[{ required: true }]}>
            <Select options={PLACEMENT_TABS.map(t => ({ label: t.label, value: t.key }))} />
          </Form.Item>

          <Form.Item label="标题（选填，仅后台识别用）" name="title">
            <Input placeholder="例：牛油果季 5 月特惠" />
          </Form.Item>

          <Form.Item
            label="海报图片"
            name="image_url"
            rules={[{ required: true, message: '请上传图片' }]}
            extra={tab === 'home'
              ? '建议尺寸 1080 × 480 (16:7)，PNG / JPG / WebP，5MB 以内'
              : '建议尺寸 1080 × 360，PNG / JPG / WebP，5MB 以内'}
          >
            <Upload
              listType="picture-card"
              showUploadList={false}
              accept="image/png,image/jpeg,image/webp"
              beforeUpload={beforeUpload}
              customRequest={handleUpload}
            >
              {imageUrl
                ? <img src={imageUrl} alt="banner" style={{ width: '100%', borderRadius: 6 }} />
                : <div>{uploading ? <LoadingOutlined /> : <UploadOutlined />}<div style={{ marginTop: 4 }}>上传</div></div>}
            </Upload>
          </Form.Item>

          <Form.Item label="跳转类型" name="link_type">
            <Select options={LINK_TYPE_OPTIONS} />
          </Form.Item>

          <Form.Item
            label="跳转目标"
            name="link_value"
            extra="link_type=none 留空；product/category 填 ID；url 填 https://..."
          >
            <Input placeholder="例：https://promo.example.com 或产品 UUID" />
          </Form.Item>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item label="排序（数字越小越靠前）" name="sort_order" style={{ flex: 1 }}>
              <InputNumber min={0} max={999} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="是否启用" name="is_active" valuePropName="checked">
              <Switch checkedChildren="开" unCheckedChildren="关" />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item label="生效开始（选填）" name="start_at" style={{ flex: 1 }}>
              <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="生效结束（选填）" name="end_at" style={{ flex: 1 }}>
              <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Card>
  )
}
