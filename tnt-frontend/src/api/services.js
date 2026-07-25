import { apiClient } from './client';

export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => apiClient.post('/auth/logout'),
  getMe: () => apiClient.get('/auth/me'),
};

export const productApi = {
  getProducts: (params) => apiClient.get('/products', { params }),
  getProductBySlug: (slug) => apiClient.get(`/products/${slug}`),
  createProduct: (payload) => apiClient.post('/products', payload),
  deleteProduct: (id) => apiClient.delete(`/products/${id}`),
  getColors: () => apiClient.get('/colors'),
  getSizes: () => apiClient.get('/sizes'),
  updateProduct: (id, payload) => apiClient.put(`/products/${id}`, payload),
  getCollections: () => apiClient.get('/collections'),
};

export const lookbookApi = {
  getLookbooks: (params) => apiClient.get('/lookbooks', { params }),
};

export const cmsApi = {
  getHomepageData: () => apiClient.get('/cms/homepage'),
  updateHomepageCMS: (data) => apiClient.put('/cms/homepage', data),
  subscribeNewsletter: (email) => apiClient.post('/cms/newsletter/subscribe', { email }),
};


export const orderApi = {
  createOrder: (payload) => apiClient.post('/orders', payload),
  getMyOrders: () => apiClient.get('/orders/my-orders'),
  getOrderTracking: (orderId) => apiClient.get(`/orders/track/${orderId}`),
  createReturnRequest: (id, payload) => apiClient.post(`/orders/${id}/returns`, payload),
};


export const paymentApi = {
  createRazorpayOrder: (payload) => apiClient.post('/payments/razorpay/create-order', payload),
  verifyRazorpayPayment: (payload) => apiClient.post('/payments/razorpay/verify', payload),
};

export const reviewApi = {
  getMyReviews: () => apiClient.get('/reviews/my-reviews'),
  createReview: (payload) => apiClient.post('/reviews', payload),
  updateReview: (id, payload) => apiClient.put(`/reviews/${id}`, payload),
  deleteReview: (id) => apiClient.delete(`/reviews/${id}`),
};

export const adminApi = {
  getMetrics: () => apiClient.get('/admin/metrics'),
  getAuditLogs: () => apiClient.get('/admin/audit-logs'),
  getCategories: () => apiClient.get('/admin/categories'),
  createCategory: (payload) => apiClient.post('/admin/categories', payload),
  getCustomers: () => apiClient.get('/admin/customers'),
  getReviews: () => apiClient.get('/admin/reviews'),
  deleteReview: (id) => apiClient.delete(`/admin/reviews/${id}`),
  getOrders: () => apiClient.get('/admin/orders'),
  updateOrderStatus: (id, status) => apiClient.put(`/admin/orders/${id}/status`, { status }),
  updateOrderTracking: (id, payload) => apiClient.put(`/admin/orders/${id}/tracking`, payload),
  updateCustomer: (id, payload) => apiClient.put(`/admin/customers/${id}`, payload),
  deleteCustomer: (id) => apiClient.delete(`/admin/customers/${id}`),
  sendBlastEmail: (payload) => apiClient.post('/admin/email-blast', payload),
  getReturns: () => apiClient.get('/admin/returns'),
  updateReturnRequest: (id, status) => apiClient.put(`/admin/returns/${id}`, { status }),
  uploadImage: (formData) => apiClient.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteHeroBanner: (id) => apiClient.delete(`/admin/cms/banners/${id}`),
  deleteTrustFeature: (id) => apiClient.delete(`/admin/cms/trust-features/${id}`),
  deletePromotion: (id) => apiClient.delete(`/admin/cms/promotions/${id}`),
  deleteInstagramPic: (id) => apiClient.delete(`/admin/cms/instagram-pics/${id}`),
  deleteWhyChooseUs: (id) => apiClient.delete(`/admin/cms/why-choose-us/${id}`),
  createColor: (payload) => apiClient.post('/colors', payload),
  updateCategory: (id, payload) => apiClient.put(`/admin/categories/${id}`, payload),
  deleteCategory: (id) => apiClient.delete(`/admin/categories/${id}`),
  createCollection: (payload) => apiClient.post('/collections', payload),
};

export const marketingApi = {
  getStats: () => apiClient.get('/admin/marketing/stats'),
  getCoupons: (params) => apiClient.get('/admin/coupons', { params }),
  createCoupon: (payload) => apiClient.post('/admin/coupons', payload),
  updateCoupon: (id, payload) => apiClient.put(`/admin/coupons/${id}`, payload),
  deleteCoupon: (id) => apiClient.delete(`/admin/coupons/${id}`),
  getSales: () => apiClient.get('/admin/sales'),
  createSale: (payload) => apiClient.post('/admin/sales', payload),
  updateSale: (id, payload) => apiClient.put(`/admin/sales/${id}`, payload),
  deleteSale: (id) => apiClient.delete(`/admin/sales/${id}`),
  validateCoupon: (payload) => apiClient.post('/marketing/validate-coupon', payload)
};

export const mediaApi = {
  getMedia: (params) => apiClient.get('/admin/media', { params }),
  uploadMedia: (formData) => apiClient.post('/admin/media/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  syncCloudinary: () => apiClient.post('/admin/media/sync'),
  renameMedia: (id, newFilename) => apiClient.put(`/admin/media/${id}/rename`, { newFilename }),
  deleteMedia: (id, forceDelete = false) => apiClient.delete(`/admin/media/${id}`, { data: { forceDelete } })
};




