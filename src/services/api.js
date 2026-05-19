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

// ── Reports（V1 旧版兼容）──────────────────────────────
export const reportAPI = {
  summary: (params) => api.get('/admin/reports', { params }),
}

// ── Employees ──────────────────────────────────────────
export const employeesAPI = {
  list: () => api.get('/admin/employees'),
  create: (data) => api.post('/admin/employees', data),
  update: (id, data) => api.patch(`/admin/employees/${id}`, data),
  delete: (id) => api.delete(`/admin/employees/${id}`),
  // shifts
  listShifts: (params) => api.get('/admin/employees/shifts', { params }),
  createShift: (data) => api.post('/admin/employees/shifts', data),
  updateShift: (id, data) => api.patch(`/admin/employees/shifts/${id}`, data),
  deleteShift: (id) => api.delete(`/admin/employees/shifts/${id}`),
  // time entries
  listTimeEntries: (params) => api.get('/admin/employees/time-entries', { params }),
  createTimeEntry: (data) => api.post('/admin/employees/time-entries', data),
  updateTimeEntry: (id, data) => api.patch(`/admin/employees/time-entries/${id}`, data),
  deleteTimeEntry: (id) => api.delete(`/admin/employees/time-entries/${id}`),
}

// ── Inventory ──────────────────────────────────────────
export const inventoryAPI = {
  list: () => api.get('/admin/inventory'),
  create: (data) => api.post('/admin/inventory', data),
  update: (id, data) => api.patch(`/admin/inventory/${id}`, data),
  delete: (id) => api.delete(`/admin/inventory/${id}`),
  // wastage
  listWastage: (params) => api.get('/admin/inventory/wastage', { params }),
  createWastage: (data) => api.post('/admin/inventory/wastage', data),
  // recipes
  listRecipes: (params) => api.get('/admin/inventory/recipes', { params }),
  createRecipe: (data) => api.post('/admin/inventory/recipes', data),
  deleteRecipe: (id) => api.delete(`/admin/inventory/recipes/${id}`),
}

// ── Customers V2 ───────────────────────────────────────
export const customersAPI = {
  list: () => api.get('/admin/customers'),
  detail: (id) => api.get(`/admin/customers/${id}`),
  listTiers: () => api.get('/admin/customers/tiers'),
  createTier: (data) => api.post('/admin/customers/tiers', data),
  updateTier: (id, data) => api.patch(`/admin/customers/tiers/${id}`, data),
  deleteTier: (id) => api.delete(`/admin/customers/tiers/${id}`),
  listLoyalty: () => api.get('/admin/customers/loyalty'),
  createLoyalty: (data) => api.post('/admin/customers/loyalty', data),
  updateLoyalty: (id, data) => api.patch(`/admin/customers/loyalty/${id}`, data),
}

// ── Purchases / Suppliers / Stock Counts ───────────────
export const purchasesAPI = {
  // suppliers
  listSuppliers: () => api.get('/admin/purchases/suppliers'),
  createSupplier: (d) => api.post('/admin/purchases/suppliers', d),
  updateSupplier: (id, d) => api.patch(`/admin/purchases/suppliers/${id}`, d),
  deleteSupplier: (id) => api.delete(`/admin/purchases/suppliers/${id}`),
  // purchase orders
  listOrders: () => api.get('/admin/purchases/orders'),
  getOrder: (id) => api.get(`/admin/purchases/orders/${id}`),
  createOrder: (d) => api.post('/admin/purchases/orders', d),
  receiveOrder: (id) => api.patch(`/admin/purchases/orders/${id}/receive`),
  cancelOrder: (id) => api.delete(`/admin/purchases/orders/${id}`),
  // stock counts
  listCounts: () => api.get('/admin/purchases/stock-counts'),
  getCount: (id) => api.get(`/admin/purchases/stock-counts/${id}`),
  createCount: (d) => api.post('/admin/purchases/stock-counts', d),
}

// ── Settings ───────────────────────────────────────────
export const settingsAPI = {
  get: (namespace, outlet_id) => api.get(`/admin/settings/${namespace}`, { params: { outlet_id } }),
  update: (namespace, data, outlet_id) =>
    api.patch(`/admin/settings/${namespace}`, data, { params: { outlet_id } }),
}

// ── Outlets V2 ─────────────────────────────────────────
export const outletsAPI = {
  list: () => api.get('/outlets'),
}

// ── Reports V2 ─────────────────────────────────────────
export const reportsV2API = {
  salesSummary:    (params) => api.get('/admin/reports-v2/sales-summary',     { params }),
  salesByItem:     (params) => api.get('/admin/reports-v2/sales-by-item',     { params }),
  salesByCategory: (params) => api.get('/admin/reports-v2/sales-by-category', { params }),
  salesByHour:     (params) => api.get('/admin/reports-v2/sales-by-hour',     { params }),
  receipts:        (params) => api.get('/admin/reports-v2/receipts',          { params }),
  discountUsage:   (params) => api.get('/admin/reports-v2/discount-usage',    { params }),
}

export default api
