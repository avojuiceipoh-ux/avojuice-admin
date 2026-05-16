import React from 'react'
import { Result, Tag, Typography, Card } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'

const { Text, Paragraph } = Typography

const BATCH_LABEL = {
  B2: { color: 'green',  label: 'Batch 2 — 1 周内' },
  B3: { color: 'blue',   label: 'Batch 3 — 1-2 周内' },
  B4: { color: 'gold',   label: 'Batch 4 — 2-3 周内' },
}

/**
 * 占位页 — 给 V2 还没实装的子菜单用
 *
 * 用法：<ComingSoon title="损耗 Wastage" batch="B4" description="..." />
 */
export default function ComingSoon({ title, batch = 'B2', description, plannedFeatures = [] }) {
  const meta = BATCH_LABEL[batch] || BATCH_LABEL.B2

  return (
    <Card>
      <Result
        icon={<ClockCircleOutlined style={{ color: '#52c41a', fontSize: 64 }} />}
        title={title}
        subTitle={
          <div style={{ marginTop: 8 }}>
            <Tag color={meta.color} style={{ fontSize: 13, padding: '2px 12px' }}>
              {meta.label}
            </Tag>
          </div>
        }
        extra={
          <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'left' }}>
            {description && (
              <Paragraph type="secondary" style={{ textAlign: 'center' }}>
                {description}
              </Paragraph>
            )}
            {plannedFeatures.length > 0 && (
              <>
                <Text strong style={{ display: 'block', marginTop: 24, marginBottom: 8 }}>
                  计划功能：
                </Text>
                <ul style={{ paddingLeft: 20, lineHeight: 1.9, color: '#666' }}>
                  {plannedFeatures.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </>
            )}
            <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 24, textAlign: 'center' }}>
              💡 V2 schema 已建好，只是 UI 还没实装。后端 API + 数据库已就绪。
            </Paragraph>
          </div>
        }
      />
    </Card>
  )
}
