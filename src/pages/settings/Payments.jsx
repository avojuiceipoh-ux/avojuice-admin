import React, { useEffect } from 'react'
import { Card, Form, Switch, Input, Button, message, Typography, Space, Tag, Alert } from 'antd'
import { CreditCardOutlined, SaveOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsAPI } from '../../services/api'

const { Title, Text } = Typography

const METHODS = [
  { key: 'cash',     label: '现金',           emoji: '💵', status: 'ready', desc: '直接收现金，不需要任何配置' },
  { key: 'tng',      label: 'Touch ’n Go QR', emoji: '📱', status: 'pending', desc: '需要 TnG for Business 商户审核（4-8 周）' },
  { key: 'duitnow',  label: 'DuitNow QR',     emoji: '🇲🇾', status: 'pending', desc: '马来西亚通用即时转账 QR' },
  { key: 'fpx',      label: 'FPX 网银',       emoji: '🏦', status: 'pending', desc: '所有马来西亚银行通用，需 iPay88 / Billplz 接入' },
  { key: 'grabpay',  label: 'GrabPay',        emoji: '🚖', status: 'pending', desc: 'Grab 商户审核' },
  { key: 'card',     label: '信用卡',         emoji: '💳', status: 'pending', desc: 'Stripe / iPay88 / Razer 选一' },
  { key: 'wallet',   label: '钱包余额',       emoji: '💚', status: 'ready', desc: '内置功能，顾客返现钱包' },
]

const STATUS_TAG = {
  ready:   { color: 'green',  label: '可用' },
  pending: { color: 'orange', label: '待接入' },
}

export default function PaymentsSettings() {
  const qc = useQueryClient()
  const [form] = Form.useForm()

  const query = useQuery({
    queryKey: ['settings-payment'],
    queryFn: () => settingsAPI.get('payment').then((r) => r.data.settings || {}),
  })

  useEffect(() => {
    if (query.data) {
      const enabled = query.data.enabled_methods ?? ['cash', 'wallet']
      const vals = {}
      for (const m of METHODS) vals[`${m.key}_enabled`] = enabled.includes(m.key)
      form.setFieldsValue({ ...vals, tng_merchant_id: query.data.tng_merchant_id, fpx_merchant: query.data.fpx_merchant })
    }
  }, [query.data])

  const updateMut = useMutation({
    mutationFn: (data) => settingsAPI.update('payment', data),
    onSuccess: () => { message.success('已保存'); qc.invalidateQueries({ queryKey: ['settings-payment'] }) },
  })

  const handleSubmit = (vals) => {
    const enabled = METHODS.filter((m) => vals[`${m.key}_enabled`]).map((m) => m.key)
    updateMut.mutate({
      enabled_methods: enabled,
      tng_merchant_id: vals.tng_merchant_id ?? null,
      fpx_merchant: vals.fpx_merchant ?? null,
    })
  }

  return (
    <Card loading={query.isLoading}>
      <Title level={4} style={{ margin: '0 0 4px' }}><CreditCardOutlined /> 支付方式</Title>
      <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 24 }}>
        启用 / 禁用各种支付方式 · 商户审核完成后填入对应商户号
      </Text>

      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message="提醒"
        description="申请 Touch'n Go / iPay88 / Billplz 商户都需要 SSM 注册证书 + 营业证。审核 4-8 周。早做晚做都得做。"
      />

      <Form form={form} layout="horizontal" onFinish={handleSubmit}>
        {METHODS.map((m) => (
          <Card key={m.key} size="small" style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Space size={12}>
                <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
                <div>
                  <Space>
                    <Text strong>{m.label}</Text>
                    <Tag color={STATUS_TAG[m.status].color}>{STATUS_TAG[m.status].label}</Tag>
                  </Space>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{m.desc}</Text>
                  </div>
                </div>
              </Space>
              <Form.Item name={`${m.key}_enabled`} valuePropName="checked" style={{ marginBottom: 0 }}>
                <Switch disabled={m.status === 'pending'} />
              </Form.Item>
            </div>
          </Card>
        ))}

        <div style={{ marginTop: 24 }}>
          <Text strong>商户号（待接入填）</Text>
          <Form.Item label="TnG 商户号" name="tng_merchant_id" style={{ marginTop: 12 }}>
            <Input placeholder="审核通过后填入" />
          </Form.Item>
          <Form.Item label="FPX 商户号" name="fpx_merchant">
            <Input placeholder="iPay88 / Billplz 给的 merchant code" />
          </Form.Item>
        </div>

        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={updateMut.isPending}>
          保存
        </Button>
      </Form>
    </Card>
  )
}
