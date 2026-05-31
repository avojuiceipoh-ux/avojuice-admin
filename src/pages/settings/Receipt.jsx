import React, { useEffect, useState } from 'react'
import { Card, Form, Input, Button, Switch, Radio, Upload, Select, message, Typography, Space, Divider } from 'antd'
import { PrinterOutlined, SaveOutlined, PlusOutlined, LoadingOutlined, UpOutlined, DownOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ImgCrop from 'antd-img-crop'
import { settingsAPI, uploadAPI } from '../../services/api'

const { Title, Text } = Typography
const { Option } = Select

// ─── 区块定义 ───────────────────────────────────
const SECTION_META = {
  logo:          { label: 'Logo',         type: 'image',     contentKey: 'logo_url' },
  business_name: { label: '店铺名称',      type: 'text',      contentKey: 'business_name' },
  business_info: { label: '店铺信息',      type: 'multiline', contentKey: 'business_info' },
  pickup_code:   { label: '取单号',        type: 'auto' },
  header_text:   { label: '顶部文案',      type: 'multiline', contentKey: 'header_text' },
  items:         { label: '订单内容',      type: 'auto' },
  total:         { label: '合计',         type: 'auto' },
  footer_text:   { label: '底部文案',      type: 'multiline', contentKey: 'footer_text' },
  qr:            { label: 'QR 码',        type: 'text',      contentKey: 'qr_url' },
}

// Andrew 偏好的默认顺序（含默认对齐）
const DEFAULT_SECTIONS = [
  { id: 'logo',          visible: true,  fontSize: 'medium', align: 'center' },
  { id: 'pickup_code',   visible: true,  fontSize: 'medium', align: 'left' },
  { id: 'header_text',   visible: true,  fontSize: 'medium', align: 'center' },
  { id: 'items',         visible: true,  fontSize: 'medium', align: 'left' },
  { id: 'footer_text',   visible: true,  fontSize: 'small',  align: 'center' },
  { id: 'qr',            visible: true,  fontSize: 'medium', align: 'center' },
]

// 默认隐藏但可启用的区块
const HIDDEN_SECTIONS = [
  { id: 'business_name', visible: false, fontSize: 'medium', align: 'center' },
  { id: 'business_info', visible: false, fontSize: 'small',  align: 'center' },
  { id: 'total',         visible: false, fontSize: 'medium', align: 'right' },
]

const FONT_SIZE_MAP  = { small: 8, medium: 12, large: 16 }
const FONT_LABELS     = { small: '小', medium: '中', large: '大' }
const ALIGN_LABELS    = { left: '靠左', center: '居中', right: '靠右' }

// ─── 辅助 ───────────────────────────────────────
function beforeUpload(file) {
  const isImage = ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
  if (!isImage) { message.error('仅支持 PNG / JPG / WebP'); return false }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) { message.error('文件需小于 2MB'); return false }
  return true
}

// ─── 预览区块渲染器 ──────────────────────────────
function ReceiptSection({ sec, values }) {
  const fs    = FONT_SIZE_MAP[sec.fontSize] || 11
  const align = sec.align || 'center'

  switch (sec.id) {
    case 'logo':
      return (
        <div style={{ textAlign: align, marginBottom: 4 }}>
          {values?.logo_url ? (
            <img src={values.logo_url} alt="logo" style={{ height: 100, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
          ) : (
            <span style={{ fontSize: 32 }}>🥑</span>
          )}
        </div>
      )

    case 'business_name':
      return (
        <div style={{ textAlign: align, fontWeight: 'bold', fontSize: fs }}>
          {values?.business_name || '爱我果饮 AvoJuice'}
        </div>
      )

    case 'business_info':
      return (
        <div style={{ textAlign: align, fontSize: fs, color: '#666', whiteSpace: 'pre-line' }}>
          {values?.business_info || 'UTAR 校园\n+60 12-XXX XXXX\nSSM: 202401234567'}
        </div>
      )

    case 'pickup_code':
      return (
        <>
          <hr />
          <div style={{ fontSize: fs, textAlign: align }}><strong>123456</strong></div>
        </>
      )

    case 'header_text':
      return values?.header_text ? (
        <div style={{ textAlign: align, marginTop: 4, fontSize: fs }}>{values.header_text}</div>
      ) : null

    case 'items':
      return (
        <>
          <hr />
          <div style={{ fontSize: fs, textAlign: align }}>2026-05-15 14:30</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: fs, marginTop: 4 }}>
            <span>× 1 招牌牛油果奶昔</span>
            <span>12.00</span>
          </div>
          <div style={{ paddingLeft: 16, fontSize: Math.max(fs - 2, 8), color: '#666' }}>
            少糖 / 少冰 / +珍珠
          </div>
          <hr />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: fs }}>
            <span>合计</span>
            <span>RM 13.00</span>
          </div>
        </>
      )

    case 'total':
      return (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: fs }}>
          <span>合计</span>
          <span>RM 13.00</span>
        </div>
      )

    case 'footer_text':
      return values?.footer_text ? (
        <>
          <hr />
          <div style={{ textAlign: align, fontSize: fs }}>{values.footer_text}</div>
        </>
      ) : null

    case 'qr':
      return values?.qr_url ? (
        <div style={{ textAlign: align, marginTop: 8, fontSize: fs }}>[QR Code]</div>
      ) : null

    default:
      return null
  }
}

// ─── 主组件 ─────────────────────────────────────
export default function ReceiptSettings() {
  const qc = useQueryClient()
  const [form] = Form.useForm()
  const [uploading, setUploading] = useState(false)
  const [sections, setSections] = useState(DEFAULT_SECTIONS)

  const query = useQuery({
    queryKey: ['settings-receipt'],
    queryFn: () => settingsAPI.get('receipt').then((r) => r.data.settings || {}),
  })

  useEffect(() => {
    if (!query.data) return
    const data = { ...query.data }

    // 恢复 template_sections，否则用默认
    if (data.template_sections && Array.isArray(data.template_sections)) {
      const saved = data.template_sections
      const savedIds = new Set(saved.map((s) => s.id))
      const merged = [...saved]
      HIDDEN_SECTIONS.forEach((s) => {
        if (!savedIds.has(s.id)) merged.push(s)
      })
      setSections(merged)
      delete data.template_sections
    }

    // 兼容旧版 boolean 开关
    if (data.show_logo !== undefined) {
      setSections((prev) =>
        prev.map((s) => s.id === 'logo' ? { ...s, visible: data.show_logo !== false } : s))
      delete data.show_logo
    }
    if (data.show_business_info !== undefined) {
      setSections((prev) => {
        const hasBI = prev.find((s) => s.id === 'business_info')
        if (hasBI) return prev.map((s) => s.id === 'business_info' ? { ...s, visible: data.show_business_info !== false } : s)
        return data.show_business_info !== false
          ? [...prev, { id: 'business_info', visible: true, fontSize: 'small', align: 'center' }]
          : prev
      })
      delete data.show_business_info
    }

    form.setFieldsValue(data)
  }, [query.data])

  const updateMut = useMutation({
    mutationFn: (data) => settingsAPI.update('receipt', data),
    onSuccess: () => { message.success('已保存'); qc.invalidateQueries({ queryKey: ['settings-receipt'] }) },
    onError: () => message.error('保存失败'),
  })

  // Logo 上传 — 手动 setFieldsValue，稳过 Form.Item + Upload 的 showUploadList=false 兼容问题
  const handleUpload = async (options) => {
    const { file, onSuccess, onError } = options
    setUploading(true)
    try {
      const res = await uploadAPI.logo(file)
      const url = res.data.logo_url
      form.setFieldsValue({ logo_url: url })
      onSuccess(url)
      message.success('Logo 上传成功')
    } catch (e) {
      onError(e)
      message.error('上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = (formValues) => {
    updateMut.mutate({
      ...formValues,
      template_sections: sections,
    })
  }

  // ─── 区块操作 ───────────────────────────
  const moveSection = (idx, dir) => {
    setSections((prev) => {
      const next = [...prev]
      const [item] = next.splice(idx, 1)
      next.splice(idx + dir, 0, item)
      return next
    })
  }
  const toggleSection = (id, visible) => {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, visible } : s))
  }
  const setFontSize = (id, fontSize) => {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, fontSize } : s))
  }
  const setAlign = (id, align) => {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, align } : s))
  }

  const values  = Form.useWatch([], form)
  const logoUrl = values?.logo_url

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16 }}>
      {/* ─── 左侧：设置 ─────────────────── */}
      <Card loading={query.isLoading}>
        <Title level={4} style={{ margin: '0 0 4px' }}>
          <PrinterOutlined /> 收据模板
        </Title>
        <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 24 }}>
          排序区块 · 字体大小 · 对齐方向 · 实时预览
        </Text>

        <Form form={form} layout="vertical" onFinish={handleSave}>

          {/* 纸张宽度 */}
          <Form.Item label="纸张宽度" name="paper_width">
            <Radio.Group>
              <Radio.Button value="58mm">58mm（32 列）</Radio.Button>
              <Radio.Button value="80mm">80mm（48 列）</Radio.Button>
            </Radio.Group>
          </Form.Item>

          {/* 隐藏字段：让 form store 追踪 logo_url（Upload 手动 setFieldsValue 设值） */}
          <Form.Item name="logo_url" hidden><Input /></Form.Item>

          <Divider orientation="left" plain style={{ fontSize: 13 }}>区块排版</Divider>

          {/* 区块编辑器 */}
          {sections.map((sec, idx) => {
            const meta = SECTION_META[sec.id]
            if (!meta) return null

            return (
              <div key={sec.id} style={{ marginBottom: 12 }}>
                {/* 区块行：排序 / 标签 / 显隐 / 对齐 / 字号 */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 8px', background: '#fafafa', borderRadius: 6,
                  border: sec.visible ? '1px solid #d9d9d9' : '1px solid #f0f0f0',
                  opacity: sec.visible ? 1 : 0.5,
                }}>
                  <Button.Group size="small">
                    <Button icon={<UpOutlined />} disabled={idx === 0} onClick={() => moveSection(idx, -1)} />
                    <Button icon={<DownOutlined />} disabled={idx === sections.length - 1} onClick={() => moveSection(idx, 1)} />
                  </Button.Group>

                  <span style={{ flex: 1, fontWeight: 500, fontSize: 13, marginLeft: 4 }}>
                    {meta.label}
                  </span>

                  <Switch size="small" checked={sec.visible} onChange={(v) => toggleSection(sec.id, v)} />

                  {/* 对齐 */}
                  <Select size="small" value={sec.align || 'center'} onChange={(v) => setAlign(sec.id, v)} style={{ width: 68 }}>
                    <Option value="left">{ALIGN_LABELS.left}</Option>
                    <Option value="center">{ALIGN_LABELS.center}</Option>
                    <Option value="right">{ALIGN_LABELS.right}</Option>
                  </Select>

                  {/* 字号 */}
                  <Select size="small" value={sec.fontSize} onChange={(v) => setFontSize(sec.id, v)} style={{ width: 60 }}>
                    <Option value="small">{FONT_LABELS.small}</Option>
                    <Option value="medium">{FONT_LABELS.medium}</Option>
                    <Option value="large">{FONT_LABELS.large}</Option>
                  </Select>
                </div>

                {/* 内容编辑区 */}
                {sec.visible && meta.contentKey && (
                  <div style={{ marginTop: 8, paddingLeft: 4 }}>
                    {meta.type === 'image' && (
                      <ImgCrop aspect={1} quality={0.9}>
                        <Upload
                          listType="picture-card"
                          showUploadList={false}
                          customRequest={handleUpload}
                          beforeUpload={beforeUpload}
                          accept="image/png,image/jpeg,image/webp"
                        >
                          {logoUrl ? (
                            <img src={logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          ) : (
                            <div>
                              {uploading ? <LoadingOutlined /> : <PlusOutlined />}
                              <div style={{ marginTop: 8, fontSize: 12 }}>上传</div>
                            </div>
                          )}
                        </Upload>
                      </ImgCrop>
                    )}
                    {meta.type === 'text' && (
                      <Form.Item name={meta.contentKey} noStyle>
                        <Input placeholder={`输入${meta.label}`} style={{ maxWidth: 360 }} />
                      </Form.Item>
                    )}
                    {meta.type === 'multiline' && (
                      <Form.Item name={meta.contentKey} noStyle>
                        <Input.TextArea rows={2} placeholder={`输入${meta.label}`} style={{ maxWidth: 360 }} />
                      </Form.Item>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          <Divider />

          <Form.Item label="制作单（后厨打印）" name="kitchen_ticket_enabled" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={updateMut.isPending}>
              保存
            </Button>
          </Space>
        </Form>
      </Card>

      {/* ─── 右侧：预览 ─────────────────── */}
      <Card title="预览" size="small">
        <div
          style={{
            background: '#fff',
            border: '1px dashed #ccc',
            padding: 16,
            fontFamily: 'monospace',
            lineHeight: 1.5,
            width: values?.paper_width === '80mm' ? 320 : 240,
            margin: '0 auto',
          }}
        >
          {sections.filter((s) => s.visible).map((sec) => (
            <ReceiptSection key={sec.id} sec={sec} values={values} />
          ))}
        </div>
      </Card>
    </div>
  )
}
