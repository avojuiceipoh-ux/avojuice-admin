import React, { useState } from 'react'
import { Card, Table, Typography, Tag, Space, Row, Col, Statistic, Alert } from 'antd'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import DateRangePicker, { rangeToParams } from '../../components/DateRangePicker'
import { reportsV2API } from '../../services/api'

const { Text, Title } = Typography

const DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export default function SalesByHour() {
  const [range, setRange] = useState([dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')])

  const query = useQuery({
    queryKey: ['report-sales-by-hour', range[0]?.toISOString(), range[1]?.toISOString()],
    queryFn: () => reportsV2API.salesByHour(rangeToParams(range)).then((r) => r.data),
    enabled: !!range[0] && !!range[1],
  })

  const heatmap = query.data?.heatmap ?? []
  const byHour = query.data?.by_hour ?? []

  // 构造 24×7 矩阵
  const matrix = Array.from({ length: 7 }, () => Array(24).fill(0))
  heatmap.forEach((row) => {
    matrix[row.day_of_week][row.hour] = Number(row.revenue)
  })

  // 找最大值用于热度归一化
  const maxValue = Math.max(...heatmap.map((r) => Number(r.revenue)), 1)

  // 找黄金时段
  const peakHour = [...byHour].sort((a, b) => Number(b.revenue) - Number(a.revenue))[0]

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>Sales by Hour 时段销售</Title>
          <DateRangePicker value={range} onChange={setRange} />
        </Space>
      </Card>

      {peakHour && (
        <Alert
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            <Space>
              <Text strong>黄金时段：</Text>
              <Tag color="green">{peakHour.hour}:00 - {peakHour.hour + 1}:00</Tag>
              <Text>{peakHour.orders} 单 · RM {Number(peakHour.revenue).toFixed(2)}</Text>
              <Text type="secondary">— 备料和排班的重点</Text>
            </Space>
          }
        />
      )}

      <Card title="按小时汇总（所有日子）" loading={query.isLoading} style={{ marginBottom: 16 }}>
        <Table
          rowKey="hour"
          dataSource={byHour}
          pagination={false}
          size="small"
          columns={[
            {
              title: '时段',
              dataIndex: 'hour',
              width: 100,
              render: (h) => <Tag color="blue">{String(h).padStart(2, '0')}:00 ~ {String(h + 1).padStart(2, '0')}:00</Tag>,
            },
            {
              title: '订单数',
              dataIndex: 'orders',
              align: 'right',
              render: (v) => `${v} 单`,
            },
            {
              title: '营业额',
              dataIndex: 'revenue',
              align: 'right',
              render: (v) => <Text strong style={{ color: '#52c41a' }}>RM {Number(v).toFixed(2)}</Text>,
            },
            {
              title: '强度',
              key: 'intensity',
              render: (_, row) => {
                const pct = Math.round(Number(row.revenue) / maxValue * 100)
                return (
                  <div style={{
                    width: pct + '%',
                    minWidth: 4,
                    height: 16,
                    background: `linear-gradient(90deg, #52c41a, #237804)`,
                    borderRadius: 4,
                  }} />
                )
              },
            },
          ]}
        />
      </Card>

      <Card title="周-时段 Heatmap" loading={query.isLoading}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                <th style={{ padding: 6 }}></th>
                {Array.from({ length: 24 }, (_, h) => (
                  <th key={h} style={{ padding: '4px 2px', color: '#999', fontWeight: 400, minWidth: 30 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day, dow) => (
                <tr key={dow}>
                  <td style={{ padding: '4px 8px', color: '#666', fontWeight: 600 }}>{day}</td>
                  {Array.from({ length: 24 }, (_, h) => {
                    const v = matrix[dow][h]
                    const alpha = v > 0 ? Math.max(0.15, v / maxValue) : 0
                    return (
                      <td
                        key={h}
                        title={v > 0 ? `RM ${v.toFixed(2)}` : '无销售'}
                        style={{
                          padding: 0,
                          width: 30,
                          height: 30,
                          background: v > 0 ? `rgba(82, 196, 26, ${alpha})` : '#fafafa',
                          border: '1px solid #fff',
                          textAlign: 'center',
                          color: alpha > 0.5 ? '#fff' : '#333',
                          fontSize: 10,
                        }}
                      >
                        {v > 0 ? Math.round(v) : ''}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
