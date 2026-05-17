import React from 'react'
import { Card, Switch, message, Typography, List, Tag, Space } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsAPI } from '../../services/api'

const { Title, Text } = Typography

const FEATURES = [
  { key: 'kds',            label: 'KDS 后厨显示屏',       desc: '独立的厨房屏幕显示订单（替代纸质制作单）', tag: '未来' },
  { key: 'self_pickup',    label: '自取 / 到店取',         desc: '顾客 App 下单后到摊位取餐',                tag: 'V1' },
  { key: 'delivery',       label: '外送',                  desc: '接入 Grab Food / Foodpanda 等',           tag: '未来' },
  { key: 'loyalty',        label: '会员 / 积分系统',       desc: '消费返积分 + 积分兑换',                    tag: 'V1' },
  { key: 'inventory',      label: '库存追踪',              desc: '原料库存自动扣减 + 损耗记录',              tag: 'B4' },
  { key: 'employee_clock', label: '员工打卡',              desc: '员工上下班打卡 + 工时统计',                tag: 'B4' },
  { key: 'multi_store',    label: '多门店',                desc: '多个摊位独立管理 + 调拨',                  tag: '未来' },
  { key: 'sst_enabled',    label: 'SST 税',                desc: '6% 销售服务税自动计算',                    tag: '未来' },
  { key: 'service_charge', label: '服务费',                desc: '订单加服务费（一般 5-10%）',              tag: '未来' },
  { key: 'receipt_print',  label: '收据打印',              desc: '蓝牙连接热敏打印机自动打小票',             tag: 'B5' },
]

const TAG_COLOR = { 'V1': 'green', 'B4': 'blue', 'B5': 'purple', '未来': 'default' }

export default function FeatureToggles() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['settings-feature'],
    queryFn: () => settingsAPI.get('feature').then((r) => r.data.settings || {}),
  })

  const updateMut = useMutation({
    mutationFn: (data) => settingsAPI.update('feature', data),
    onSuccess: () => { message.success('已保存'); qc.invalidateQueries({ queryKey: ['settings-feature'] }) },
    onError: () => message.error('保存失败'),
  })

  const handleToggle = (key, value) => {
    updateMut.mutate({ [key]: value })
  }

  const settings = query.data ?? {}

  return (
    <Card loading={query.isLoading}>
      <Title level={4} style={{ margin: '0 0 4px' }}><SettingOutlined /> 功能开关</Title>
      <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 24 }}>
        V2 所有模块 schema 都已建好；这里控制启用 / 禁用
      </Text>

      <List
        dataSource={FEATURES}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Switch
                key="toggle"
                checked={settings[item.key] === true}
                onChange={(v) => handleToggle(item.key, v)}
                loading={updateMut.isPending}
              />,
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                  <Text strong>{item.label}</Text>
                  <Tag color={TAG_COLOR[item.tag]}>{item.tag}</Tag>
                </Space>
              }
              description={item.desc}
            />
          </List.Item>
        )}
      />
    </Card>
  )
}
