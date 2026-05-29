import React, { useEffect, useState } from 'react'
import { Card, Form, Input, Button, Switch, Radio, Upload, message, Typography, Space, Divider } from 'antd'
import { PrinterOutlined, SaveOutlined, PlusOutlined, LoadingOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsAPI, uploadAPI } from '../../services/api'

const { Title, Text } = Typography

function beforeUpload(file) {
  const isImage = ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
  if (!isImage) { message.error('仅支持 PNG / JPG / WebP'); return false }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) { message.error('文件需小于 2MB'); return false }
  return true
}

export default function ReceiptSettings() {
  const qc = useQueryClient()
  const [form] = Form.useForm()
  const [uploading, setUploading] = useState(false)

  const query = useQuery({
    queryKey: ['settings-receipt'],
    queryFn: () => settingsAPI.get('receipt').then((r) => r.data.settings || {}),
  })

  useEffect(() => {
    if (query.data) {
      form.setFieldsValue({ ...query.data })
    }
  }, [query.data])

  const updateMut = useMutation({
    mutationFn: (data) => settingsAPI.update('receipt', data),
    onSuccess: () => { message.success('已保存'); qc.invalidateQueries({ queryKey: ['settings-receipt'] }) },
    onError: () => message.error('保存失败'),
  })

  const handleUpload = async (options) => {
    const { file, onSuccess, onError } = options
    setUploading(true)
    try {
      const res = await uploadAPI.logo(file)
      const url = res.data.logo_url
      form.setFieldsValue({ logo_url: url })
      onSuccess(res, file)
      message.success('Logo 上传成功')
    } catch (e) {
      onError(e)
      message.error('上传失败')
    } finally {
      setUploading(false)
    }
  }

  const values = Form.useWatch([], form)
  const logoUrl = values?.logo_url

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16 }}>
      <Card loading={query.isLoading}>
        <Title level={4} style={{ margin: '0 0 4px' }}><PrinterOutlined /> 收据模板</Title>
        <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 24 }}>
          自定义打印小票上下文 + 选择纸张宽度
        </Text>

        <Form form={form} layout="vertical" onFinish={(v) => updateMut.mutate(v)}>
          <Form.Item label="纸张宽度" name="paper_width">
            <Radio.Group>
              <Radio.Button value="58mm">58mm（32 列）</Radio.Button>
              <Radio.Button value="80mm">80mm（48 列）</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="顶部 Logo" name="show_logo" valuePropName="checked">
            <Switch />
          </Form.Item>

          {values?.show_logo !== false && (
            <Form.Item label="上传 Logo 图片" name="logo_url">
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
            </Form.Item>
          )}

          <Form.Item label="店铺信息（地址 / 电话 / SSM）" name="show_business_info" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label="顶部文案" name="header_text">
            <Input.TextArea rows={2} placeholder="例如：感谢您的光临！" />
          </Form.Item>

          <Form.Item label="底部文案" name="footer_text">
            <Input.TextArea rows={3} placeholder="例如：扫描下方 QR 关注我们的 Instagram @avojuice" />
          </Form.Item>

          <Form.Item label="QR 码内容（顾客 App 链接 / 评价）" name="qr_url">
            <Input placeholder="https://avojuice.com" />
          </Form.Item>

          <Divider />

          <Form.Item label="制作单（后厨打印）" name="kitchen_ticket_enabled" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={updateMut.isPending}>保存</Button>
          </Space>
        </Form>
      </Card>

      {/* Preview */}
      <Card title="预览" size="small">
        <div
          style={{
            background: '#fff',
            border: '1px dashed #ccc',
            padding: 16,
            fontFamily: 'monospace',
            fontSize: 11,
            lineHeight: 1.5,
            width: values?.paper_width === '80mm' ? 320 : 240,
            margin: '0 auto',
          }}
        >
          {values?.show_logo !== false && (
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              {logoUrl ? (
                <img src={logoUrl} alt="logo" style={{ height: 40, objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: 24 }}>🥑</span>
              )}
            </div>
          )}
          <div style={{ textAlign: 'center', fontWeight: 'bold' }}>爱我果饮 AvoJuice</div>
          {values?.show_business_info !== false && (
            <div style={{ textAlign: 'center', fontSize: 10, color: '#666' }}>
              UTAR 校园<br />
              +60 12-XXX XXXX<br />
              SSM: 202401234567
            </div>
          )}
          {values?.header_text && <div style={{ textAlign: 'center', marginTop: 8 }}>{values.header_text}</div>}
          <hr />
          <div>取餐码：<strong>123456</strong></div>
          <div>2026-05-15 14:30</div>
          <hr />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>× 1 招牌牛油果奶昔</span>
            <span>12.00</span>
          </div>
          <div style={{ paddingLeft: 16, fontSize: 10, color: '#666' }}>少糖 / 少冰 / +珍珠</div>
          <hr />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>合计</span>
            <span>RM 13.00</span>
          </div>
          {values?.footer_text && (
            <>
              <hr />
              <div style={{ textAlign: 'center', fontSize: 10 }}>{values.footer_text}</div>
            </>
          )}
          {values?.qr_url && <div style={{ textAlign: 'center', marginTop: 8 }}>[QR Code]</div>}
        </div>
      </Card>
    </div>
  )
}
