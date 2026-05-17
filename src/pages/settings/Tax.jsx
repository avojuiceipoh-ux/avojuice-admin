import React, { useEffect } from 'react'
import { Card, Form, Switch, InputNumber, Radio, Button, message, Typography, Alert, Space } from 'antd'
import { FileTextOutlined, SaveOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsAPI } from '../../services/api'

const { Title, Text } = Typography

export default function TaxSettings() {
  const qc = useQueryClient()
  const [form] = Form.useForm()

  const query = useQuery({
    queryKey: ['settings-tax'],
    queryFn: () => settingsAPI.get('tax').then((r) => r.data.settings || {}),
  })

  useEffect(() => {
    if (query.data) {
      form.setFieldsValue({
        sst_enabled: query.data.sst_enabled ?? false,
        sst_rate: query.data.sst_rate ?? 6,
        sst_inclusive: query.data.sst_inclusive ?? false,
        service_charge_enabled: query.data.service_charge_enabled ?? false,
        service_charge_rate: query.data.service_charge_rate ?? 10,
        rounding_5sen: query.data.rounding_5sen ?? true,
      })
    }
  }, [query.data])

  const updateMut = useMutation({
    mutationFn: (data) => settingsAPI.update('tax', data),
    onSuccess: () => { message.success('已保存'); qc.invalidateQueries({ queryKey: ['settings-tax'] }) },
  })

  return (
    <Card loading={query.isLoading}>
      <Title level={4} style={{ margin: '0 0 4px' }}><FileTextOutlined /> 税率 / SST</Title>
      <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 24 }}>
        马来西亚 F&B 行业现行 SST 税率 6%（如需开票合规）
      </Text>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="什么时候需要开 SST"
        description="年营业额超过 RM 1,500,000 才需要注册 SST。小摊位阶段一般不需要，等扩张后再启用。但 5sen 凑整建议一直开（马来西亚 2008 取消 1sen 币）。"
      />

      <Form form={form} layout="vertical" onFinish={(v) => updateMut.mutate(v)}>
        {/* SST */}
        <Card size="small" title="SST（销售服务税）" style={{ marginBottom: 16 }}>
          <Form.Item label="启用 SST" name="sst_enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="税率 %" name="sst_rate">
            <InputNumber min={0} max={20} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="价格表示方式" name="sst_inclusive">
            <Radio.Group>
              <Radio value={false}>不含税（结算时另加）</Radio>
              <Radio value={true}>含税（菜单价已含税）</Radio>
            </Radio.Group>
          </Form.Item>
        </Card>

        {/* 服务费 */}
        <Card size="small" title="服务费（Service Charge）" style={{ marginBottom: 16 }}>
          <Form.Item label="启用服务费" name="service_charge_enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="服务费率 %" name="service_charge_rate">
            <InputNumber min={0} max={20} step={1} style={{ width: '100%' }} />
          </Form.Item>
          <Text type="secondary" style={{ fontSize: 12 }}>
            建议：学生市场不收（破坏价格亲民感）；连锁后再加
          </Text>
        </Card>

        {/* 凑整 */}
        <Card size="small" title="5 sen 凑整" style={{ marginBottom: 16 }}>
          <Form.Item label="启用（马来西亚标准）" name="rounding_5sen" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Text type="secondary" style={{ fontSize: 12 }}>
            自动按 5 sen 进位（例如 RM 12.43 → RM 12.45）。马来西亚已取消 1 sen 币，建议一直开。
          </Text>
        </Card>

        <Space>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={updateMut.isPending}>保存</Button>
        </Space>
      </Form>
    </Card>
  )
}
