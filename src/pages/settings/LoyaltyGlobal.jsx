import React, { useEffect } from 'react'
import { Card, Form, Switch, InputNumber, Button, message, Typography, Alert } from 'antd'
import { StarOutlined, SaveOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsAPI } from '../../services/api'

const { Title, Text } = Typography

export default function LoyaltyGlobal() {
  const qc = useQueryClient()
  const [form] = Form.useForm()

  const query = useQuery({
    queryKey: ['settings-loyalty'],
    queryFn: () => settingsAPI.get('loyalty').then((r) => r.data.settings || {}),
  })

  useEffect(() => {
    if (query.data) {
      form.setFieldsValue({
        enabled: query.data.enabled ?? true,
        earn_rate: query.data.earn_rate ?? 1.0,
        redeem_rate: query.data.redeem_rate ?? 0.01,
        min_redeem_points: query.data.min_redeem_points ?? 100,
        birthday_bonus_multiplier: query.data.birthday_bonus_multiplier ?? 2,
        new_user_bonus_points: query.data.new_user_bonus_points ?? 100,
        referral_bonus_rm: query.data.referral_bonus_rm ?? 5,
      })
    }
  }, [query.data])

  const updateMut = useMutation({
    mutationFn: (data) => settingsAPI.update('loyalty', data),
    onSuccess: () => { message.success('已保存'); qc.invalidateQueries({ queryKey: ['settings-loyalty'] }) },
  })

  return (
    <Card loading={query.isLoading}>
      <Title level={4} style={{ margin: '0 0 4px' }}><StarOutlined /> 积分系统（全局）</Title>
      <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 24 }}>
        全局开关 + 默认规则。「顾客 → 积分规则」可以建多套规则覆盖。
      </Text>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="积分逻辑"
        description="消费 RM 1 = 赚 earn_rate 分；redeem_rate 控制兑换比例（如 0.01 = 100 分抵 RM 1）。"
      />

      <Form form={form} layout="vertical" onFinish={(v) => updateMut.mutate(v)}>
        <Form.Item label="启用积分系统" name="enabled" valuePropName="checked">
          <Switch />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Form.Item label="赚取倍率（1 RM = X 分）" name="earn_rate">
            <InputNumber min={0} step={0.1} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="兑换倍率（1 分 = RM X）" name="redeem_rate">
            <InputNumber min={0} step={0.001} precision={4} style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <Form.Item label="最低兑换分数" name="min_redeem_points">
          <InputNumber min={0} step={50} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="生日积分倍率" name="birthday_bonus_multiplier" tooltip="生日当天消费 × 倍率">
          <InputNumber min={1} max={5} step={0.5} precision={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="新人注册赠送积分" name="new_user_bonus_points">
          <InputNumber min={0} step={50} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="推荐好友奖励 RM" name="referral_bonus_rm" tooltip="邀请新用户首单成功 → 双方各得 RM X">
          <InputNumber min={0} step={1} precision={2} style={{ width: '100%' }} />
        </Form.Item>

        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={updateMut.isPending}>保存</Button>
      </Form>
    </Card>
  )
}
