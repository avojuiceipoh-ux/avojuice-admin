import React, { useState } from 'react'
import { Card, Table, Tag, Typography, Space, Statistic, Row, Col } from 'antd'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import DateRangePicker, { rangeToParams } from '../../components/DateRangePicker'
import { employeesAPI } from '../../services/api'

const { Text, Title } = Typography

export default function TimeEntries() {
  const [range, setRange] = useState([dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')])

  const query = useQuery({
    queryKey: ['admin-time-entries', range[0]?.toISOString(), range[1]?.toISOString()],
    queryFn: () => employeesAPI.listTimeEntries(rangeToParams(range)).then((r) => r.data.entries || []),
  })

  const entries = query.data ?? []
  const totalHours = entries.reduce((s, e) => s + (Number(e.total_minutes) || 0), 0) / 60
  const totalWage = entries.reduce((s, e) => s + (Number(e.total_minutes) || 0) / 60 * (Number(e.hourly_rate_snap) || 0), 0)
  const activeNow = entries.filter((e) => !e.clock_out_at).length

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>打卡记录</Title>
          <DateRangePicker value={range} onChange={setRange} />
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card><Statistic title="总工时" value={totalHours.toFixed(1)} suffix="小时" /></Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card><Statistic title="总工资" value={totalWage.toFixed(2)} prefix="RM" valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card><Statistic title="当前在岗" value={activeNow} suffix="人" valueStyle={{ color: activeNow > 0 ? '#52c41a' : undefined }} /></Card>
        </Col>
      </Row>

      <Card loading={query.isLoading}>
        <Table
          rowKey="id"
          size="middle"
          dataSource={entries}
          pagination={{ pageSize: 30 }}
          columns={[
            { title: '员工', dataIndex: 'staff_name', width: 140,
              render: (v, row) => (
                <div>
                  <Text strong>{v}</Text>
                  <div><Text type="secondary" style={{ fontSize: 11 }}>{row.role}</Text></div>
                </div>
              ),
            },
            { title: '门店', dataIndex: 'outlet_name', width: 130 },
            { title: '上班', dataIndex: 'clock_in_at', width: 160,
              render: (v) => dayjs(v).format('MM-DD HH:mm'),
            },
            { title: '下班', dataIndex: 'clock_out_at', width: 160,
              render: (v) => v ? dayjs(v).format('MM-DD HH:mm') : <Tag color="green">在岗中</Tag>,
            },
            { title: '工时', dataIndex: 'total_minutes', width: 100, align: 'right',
              render: (v, row) => {
                if (!row.clock_out_at) return <Text type="secondary">—</Text>
                const h = (v / 60).toFixed(1)
                return <Text strong>{h} h</Text>
              },
            },
            { title: '休息', dataIndex: 'break_minutes', width: 90, align: 'right',
              render: (v) => v > 0 ? `${v} min` : '—',
            },
            { title: '时薪 snap', dataIndex: 'hourly_rate_snap', width: 110, align: 'right',
              render: (v) => v ? `RM ${Number(v).toFixed(2)}` : <Text type="secondary">—</Text>,
            },
            { title: '工资', key: 'wage', width: 110, align: 'right',
              render: (_, row) => {
                if (!row.clock_out_at || !row.hourly_rate_snap) return <Text type="secondary">—</Text>
                const w = (row.total_minutes / 60) * Number(row.hourly_rate_snap)
                return <Text strong style={{ color: '#52c41a' }}>RM {w.toFixed(2)}</Text>
              },
            },
          ]}
        />
      </Card>
    </div>
  )
}
