import React from 'react'
import { Card, Typography, Tag, Space, Alert, Row, Col } from 'antd'
import { CrownOutlined, IdcardOutlined, ShopOutlined, ToolOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

const ROLES = [
  {
    key: 'owner',
    name: '老板 Owner',
    icon: <CrownOutlined />,
    color: 'gold',
    desc: '系统超级管理员，拥有全部权限',
    permissions: {
      'POS 下单':              true,
      '退款 / 作废订单':        true,
      '改价 / 应用折扣':        true,
      '管理菜单 / 上下架':      true,
      '管理员工 / 排班':        true,
      '查看销售报表':          true,
      '查看损耗 / 利润':       true,
      '修改设置 / 收据模板':   true,
      '关闭营业':              true,
    },
  },
  {
    key: 'manager',
    name: '店长 Manager',
    icon: <ShopOutlined />,
    color: 'purple',
    desc: '门店负责人，日常运营管理',
    permissions: {
      'POS 下单':              true,
      '退款 / 作废订单':        true,
      '改价 / 应用折扣':        true,
      '管理菜单 / 上下架':      true,
      '管理员工 / 排班':        true,
      '查看销售报表':          true,
      '查看损耗 / 利润':       true,
      '修改设置 / 收据模板':   false,
      '关闭营业':              true,
    },
  },
  {
    key: 'cashier',
    name: '收银员 Cashier',
    icon: <IdcardOutlined />,
    color: 'blue',
    desc: '前台收银 + 下单',
    permissions: {
      'POS 下单':              true,
      '退款 / 作废订单':        false,
      '改价 / 应用折扣':        true,
      '管理菜单 / 上下架':      false,
      '管理员工 / 排班':        false,
      '查看销售报表':          false,
      '查看损耗 / 利润':       false,
      '修改设置 / 收据模板':   false,
      '关闭营业':              false,
    },
  },
  {
    key: 'staff',
    name: '员工 Staff / Barista',
    icon: <ToolOutlined />,
    color: 'green',
    desc: '吧台 / 出品 / 临时下架原料用完的产品',
    permissions: {
      'POS 下单':              true,
      '退款 / 作废订单':        false,
      '改价 / 应用折扣':        false,
      '管理菜单 / 上下架':      true,
      '管理员工 / 排班':        false,
      '查看销售报表':          false,
      '查看损耗 / 利润':       false,
      '修改设置 / 收据模板':   false,
      '关闭营业':              false,
    },
  },
]

export default function Roles() {
  // 所有权限项
  const allPerms = Object.keys(ROLES[0].permissions)

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>角色 / 权限</Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          4 个标准角色 · V1 角色绑定即权限。V2 计划做颗粒级自定义权限
        </Text>
      </Card>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="V1 权限模型"
        description="每个员工绑定一个角色，角色决定权限。如需调整某个员工的权限，调整其角色即可。颗粒级（按按钮）授权留待 V2。"
      />

      <Row gutter={[16, 16]}>
        {ROLES.map((role) => (
          <Col key={role.key} xs={24} md={12}>
            <Card
              size="small"
              title={
                <Space>
                  {role.icon}
                  <Text strong>{role.name}</Text>
                  <Tag color={role.color}>{role.key}</Tag>
                </Space>
              }
              extra={<Text type="secondary" style={{ fontSize: 12 }}>{role.desc}</Text>}
              style={{ height: '100%' }}
            >
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                {allPerms.map((perm) => {
                  const has = role.permissions[perm]
                  return (
                    <div key={perm} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 0',
                      fontSize: 13,
                    }}>
                      <Text>{perm}</Text>
                      {has ? (
                        <CheckOutlined style={{ color: '#52c41a', fontSize: 14 }} />
                      ) : (
                        <CloseOutlined style={{ color: '#d9d9d9', fontSize: 14 }} />
                      )}
                    </div>
                  )
                })}
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
