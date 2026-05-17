import React, { useEffect } from 'react'
import { Card, Form, Input, Button, Switch, Radio, message, Typography, Space, Divider } from 'antd'
import { PrinterOutlined, SaveOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsAPI } from '../../services/api'

const { Title, Text } = Typography

export default function ReceiptSettings() {
  const qc = useQueryClient()
  const [form] = Form.useForm()

  const query = useQuery({
    queryKey: ['settings-receipt'],
    queryFn: () => settingsAPI.get('receipt').then((r) => r.data.settings || {}),
  })

  useEffect(() => {
    if (query.data) {
      form.setFieldsValue({
        ...query.data,
        // 这些是 JSON 反序列化后的值
      })
    }
  }, [query.data])

  const updateMut = useMutation({
    mutationFn: (data) => settingsAPI.update('receipt', data),
    onSuccess: () => { message.success('已保存'); qc.invalidateQueries({ queryKey: ['settings-receipt'] }) },
    onError: () => message.error('保存失败'),
  })

  const values = Form.useWatch([], form)

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
          {values?.show_logo !== false && <div style={{ textAlign: 'center', fontSize: 24 }}>🥑</div>}
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
