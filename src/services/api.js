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

// ── Admin Menu ────────────────────────────────────────
export const menuAPI = {
  list: (outlet_id) => api.get('/admin/menu', { params: { outlet_id } }),
  create: (data) => api.post('/admin/menu', data),
  update: (id, data) => api.put(`/admin/menu/${id}`, data),
  delete: (id) => api.delete(`/admin/menu/${id}`),
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
