import React, { useState } from 'react'
import { Form, Input, Button, Typography, message, Alert } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'

const { Title, Text } = Typography

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const onFinish = async ({ phone, pin }) => {
    setLoading(true)
    setError('')
    try {
      const res = await authAPI.merchantLogin({ phone, pin })
      const { token, staff } = res.data
      localStorage.setItem('avo_admin_token', token)
      localStorage.setItem('avo_admin_user', JSON.stringify(staff || {}))
      message.success('登录成功！')
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || '登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="logo-area">
          <span className="logo-emoji">🍎</span>
          <Title level={3} style={{ color: '#52c41a', margin: 0 }}>爱我果饮</Title>
          <Text type="secondary">管理后台</Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 20, borderRadius: 8 }}
          />
        )}

        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            name="phone"
            rules={[{ required: true, message: '请输入手机号' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#bbb' }} />}
              placeholder="手机号（例：+60123456789）"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="pin"
            rules={[{ required: true, message: '请输入 PIN 码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bbb' }} />}
              placeholder="PIN 码（4-6 位数字）"
              maxLength={6}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ borderRadius: 8, height: 44, fontSize: 16 }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            爱我果饮 Avo Juice · 内部系统
          </Text>
        </div>
      </div>
    </div>
  )
}
