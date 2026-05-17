import React, { useEffect } from 'react'
import { Card, Form, Input, Button, message, Typography, Space } from 'antd'
import { ShopOutlined, SaveOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsAPI } from '../../services/api'

const { Title, Text } = Typography

export default function BusinessSettings() {
  const qc = useQueryClient()
  const [form] = Form.useForm()

  const query = useQuery({
    queryKey: ['settings-business'],
    queryFn: () => settingsAPI.get('business').then((r) => r.data.settings || {}),
  })

  useEffect(() => {
    if (query.data) form.setFieldsValue(query.data)
  }, [query.data])

  const updateMut = useMutation({
    mutationFn: (data) => settingsAPI.update('business', data),
    onSuccess: () => { message.success('已保存'); qc.invalidateQueries({ queryKey: ['settings-business'] }) },
    onError: () => message.error('保存失败'),
  })

  return (
    <Card loading={query.isLoading}>
      <Title level={4} style={{ margin: '0 0 4px' }}><ShopOutlined /> 商户资料</Title>
      <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 24 }}>
        显示在收据、顾客 App、Admin 头部
      </Text>

      <Form form={form} layout="vertical" onFinish={(v) => updateMut.mutate(v)}>
        <Form.Item label="商户名称" name="name">
          <Input placeholder="爱我果饮 Avo Juice" />
        </Form.Item>
        <Form.Item label="SSM 注册号" name="ssm_no">
          <Input placeholder="202401234567" />
        </Form.Item>
        <Form.Item label="地址" name="address">
          <Input.TextArea rows={2} placeholder="UTAR 校园 ..." />
        </Form.Item>
        <Form.Item label="联系电话" name="phone">
          <Input placeholder="+60 12-XXX XXXX" />
        </Form.Item>
        <Form.Item label="Email" name="email">
          <Input placeholder="hello@avojuice.com" />
        </Form.Item>
        <Form.Item label="Instagram / FB" name="social">
          <Input placeholder="@avojuice" />
        </Form.Item>
        <Form.Item label="Logo URL" name="logo_url">
          <Input placeholder="https://..." />
        </Form.Item>

        <Space>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={updateMut.isPending}>保存</Button>
        </Space>
      </Form>
    </Card>
  )
}
