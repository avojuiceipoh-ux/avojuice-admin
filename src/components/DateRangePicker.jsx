import React from 'react'
import { DatePicker, Space, Button } from 'antd'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

/** 报表通用日期范围选择器 — 含快捷预设 */
export default function DateRangePicker({ value, onChange }) {
  const setRange = (from, to) => onChange([dayjs(from), dayjs(to)])

  return (
    <Space wrap>
      <RangePicker
        value={value}
        onChange={onChange}
        allowClear={false}
        format="YYYY-MM-DD"
      />
      <Button size="small" onClick={() => setRange(dayjs().startOf('day'), dayjs().endOf('day'))}>今天</Button>
      <Button size="small" onClick={() => setRange(dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day'))}>昨天</Button>
      <Button size="small" onClick={() => setRange(dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day'))}>近 7 天</Button>
      <Button size="small" onClick={() => setRange(dayjs().subtract(29, 'day').startOf('day'), dayjs().endOf('day'))}>近 30 天</Button>
      <Button size="small" onClick={() => setRange(dayjs().startOf('month'), dayjs().endOf('day'))}>本月</Button>
    </Space>
  )
}

/** 把 dayjs 范围转成 API params */
export const rangeToParams = (range) => ({
  from: range[0].format('YYYY-MM-DD'),
  to:   range[1].format('YYYY-MM-DD'),
})
