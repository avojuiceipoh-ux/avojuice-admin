import React, { useEffect } from 'react'
import { Card, Form, Switch, TimePicker, Button, message, Typography, Space, Divider } from 'antd'
import { ClockCircleOutlined, SaveOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { settingsAPI } from '../../services/api'

const { Title, Text } = Typography

const DAYS = [
  { key: 'mon', label: '周一' },
  { key: 'tue', label: '周二' },
  { key: 'wed', label: '周三' },
  { key: 'thu', label: '周四' },
  { key: 'fri', label: '周五' },
  { key: 'sat', label: '周六' },
  { key: 'sun', label: '周日' },
]

export default function HoursSettings() {
  const qc = useQueryClient()
  const [form] = Form.useForm()

  const query = useQuery({
    queryKey: ['settings-hours'],
    queryFn: () => settingsAPI.get('hours').then((r) => r.data.settings || {}),
  })

  useEffect(() => {
    if (query.data) {
      const vals = {}
      for (const d of DAYS) {
        const cfg = query.data[d.key] ?? { open: d.key !== 'sun', start: '10:00', end: '22:00' }
        vals[`${d.key}_open`] = cfg.open
        vals[`${d.key}_start`] = cfg.start ? dayjs(cfg.start, 'HH:mm') : null
        vals[`${d.key}_end`] = cfg.end ? dayjs(cfg.end, 'HH:mm') : null
      }
      form.setFieldsValue(vals)
    }
  }, [query.data])

  const updateMut = useMutation({
    mutationFn: (data) => settingsAPI.update('hours', data),
    onSuccess: () => { message.success('已保存'); qc.invalidateQueries({ queryKey: ['settings-hours'] }) },
  })

  const handleSubmit = (vals) => {
    const data = {}
    for (const d of DAYS) {
      data[d.key] = {
        open: vals[`${d.key}_open`] ?? false,
        start: vals[`${d.key}_start`]?.format('HH:mm') ?? null,
        end: vals[`${d.key}_end`]?.format('HH:mm') ?? null,
      }
    }
    updateMut.mutate(data)
  }

  return (
    <Card loading={query.isLoading}>
      <Title level={4} style={{ margin: '0 0 4px' }}><ClockCircleOutlined /> 营业时间</Title>
      <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 24 }}>
        按 CLAUDE.md：周一至六出摊，周日固定休息
      </Text>

      <Form form={form} layout="horizontal" onFinish={handleSubmit}>
        {DAYS.map((d, idx) => (
          <div key={d.key}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0' }}>
              <div style={{ width: 60 }}>
                <Text strong>{d.label}</Text>
              </div>
              <Form.Item name={`${d.key}_open`} valuePropName="checked" style={{ marginBottom: 0 }}>
                <Switch checkedChildren="营业" unCheckedChildren="休息" />
              </Form.Item>
              <Form.Item shouldUpdate noStyle>
                {() => {
                  const open = form.getFieldValue(`${d.key}_open`)
                  return (
                    <Space>
                      <Form.Item name={`${d.key}_start`} style={{ marginBottom: 0 }}>
                        <TimePicker disabled={!open} format="HH:mm" minuteStep={15} placeholder="开门" />
                      </Form.Item>
                      <Text>~</Text>
                      <Form.Item name={`${d.key}_end`} style={{ marginBottom: 0 }}>
                        <TimePicker disabled={!open} format="HH:mm" minuteStep={15} placeholder="收摊" />
                      </Form.Item>
                    </Space>
                  )
                }}
              </Form.Item>
            </div>
            {idx < DAYS.length - 1 && <Divider style={{ margin: 0 }} />}
          </div>
        ))}

        <div style={{ marginTop: 24 }}>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={updateMut.isPending}>
            保存
          </Button>
        </div>
      </Form>
    </Card>
  )
}
