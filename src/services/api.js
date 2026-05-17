import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api-proxy'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// 自动带上 JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('avo_admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 401 自动跳回登录
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('avo_admin_token')
      localStorage.removeItem('avo_admin_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────
export const authAPI = {
  merchantLogin: (data) => api.post('/merchant/login', data),
}

// ── Outlets ───────────────────────────────────────────
export const outletAPI = {
  list: () => api.get('/outlets'),
  create: (data) => api.post('/outlets', data),
  update: (id, data) => api.put(`/outlets/${id}`, data),
  delete: (id) => api.delete(`/outlets/${id}`),
}

// ── Products ──────────────────────────────────────────
export const productAPI = {
  list: (outlet_id) => api.get('/products', { params: { outlet_id } }),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
}

// ── Orders ────────────────────────────────────────────
export const orderAPI = {
  list: (params) => api.get('/admin/orders', { params }),
  update: (id, data) => api.put(`/admin/orders/${id}`, data),
}

// ── Admin Menu ─ V2 完整版 ────────────────────────────
export const menuAPI = {
  // V1 兼容
  list: (outlet_id) => api.get('/admin/menu', { params: { outlet_id } }),
}

// Products
export const productsAPI = {
  list: () => api.get('/admin/menu/products'),
  detail: (id) => api.get(`/admin/menu/products/${id}`),
  create: (data) => api.post('/admin/menu/products', data),
  update: (id, data) => api.patch(`/admin/menu/products/${id}`, data),
  delete: (id) => api.delete(`/admin/menu/products/${id}`),
}

// Categories
export const categoriesAPI = {
  list: () => api.get('/admin/menu/categories'),
  create: (data) => api.post('/admin/menu/categories', data),
  update: (id, data) => api.patch(`/admin/menu/categories/${id}`, data),
  delete: (id) => api.delete(`/admin/menu/categories/${id}`),
}

// Variants
export const variantsAPI = {
  listGroups: (product_id) => api.get('/admin/variants/groups', { params: { product_id } }),
  createGroup: (data) => api.post('/admin/variants/groups', data),
  updateGroup: (id, data) => api.patch(`/admin/variants/groups/${id}`, data),
  deleteGroup: (id) => api.delete(`/admin/variants/groups/${id}`),
  createOption: (data) => api.post('/admin/variants/options', data),
  updateOption: (id, data) => api.patch(`/admin/variants/options/${id}`, data),
  deleteOption: (id) => api.delete(`/admin/variants/options/${id}`),
}

// Modifiers
export const modifiersAPI = {
  listGroups: (product_id) => api.get('/admin/modifiers/groups', { params: { product_id } }),
  createGroup: (data) => api.post('/admin/modifiers/groups', data),
  updateGroup: (id, data) => api.patch(`/admin/modifiers/groups/${id}`, data),
  deleteGroup: (id) => api.delete(`/admin/modifiers/groups/${id}`),
  createItem: (data) => api.post('/admin/modifiers', data),
  updateItem: (id, data) => api.patch(`/admin/modifiers/${id}`, data),
  deleteItem: (id) => api.delete(`/admin/modifiers/${id}`),
}

// Discounts
export const discountsAPI = {
  list: (params) => api.get('/admin/discounts', { params }),
  detail: (id) => api.get(`/admin/discounts/${id}`),
  create: (data) => api.post('/admin/discounts', data),
  update: (id, data) => api.patch(`/admin/discounts/${id}`, data),
  delete: (id) => api.delete(`/admin/discounts/${id}`),
}

// ── Users ─────────────────────────────────────────────
export const userAPI = {
  list: (params) => api.get('/admin/users', { params }),
}

// ── Promotions ────────────────────────────────────────
export const promoAPI = {
  list: () => api.get('/admin/promotions'),
  create: (data) => api.post('/admin/promotions', data),
  update: (id, data) => api.put(`/admin/promotions/${id}`, data),
  delete: (id) => api.delete(`/admin/promotions/${id}`),
}

// ── Reports ───────────────────────────────────────────
export const reportAPI = {
  summary: (params) => api.get('/admin/reports', { params }),
}

export default api
