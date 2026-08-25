import { apiClient } from './client';

export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => apiClient.post('/auth/logout'),
  getMe: () => apiClient.get('/auth/me'),
  updateProfile: (payload) => apiClient.put('/auth/profile', payload),
  verifyOtp: (payload) => apiClient.post('/auth/verify-otp', payload),
  resendOtp: (payload) => apiClient.post('/auth/resend-otp', payload),
  googleLogin: (payload) => apiClient.post('/auth/google-login', payload),
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
  getCategories: () => apiClient.get('/categories'),
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
  cancelOrder: (id) => apiClient.post(`/orders/${id}/cancel`),
};


export const paymentApi = {
  createRazorpayOrder: (payload) => apiClient.post('/payments/razorpay/create-order', payload),
  verifyRazorpayPayment: (payload) => apiClient.post('/payments/razorpay/verify', payload),
};

export const addressApi = {
  getAddresses: () => apiClient.get('/addresses'),
  createAddress: (payload) => apiClient.post('/addresses', payload),
  updateAddress: (id, payload) => apiClient.put(`/addresses/${id}`, payload),
  deleteAddress: (id) => apiClient.delete(`/addresses/${id}`),
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
  getCustomers: (params) => apiClient.get('/admin/customers', { params }),
  getCustomerStats: (params) => apiClient.get('/admin/customers/stats', { params }),
  getCustomerById: (id) => apiClient.get(`/admin/customers/${id}`),
  getCustomerOrders: (id, params) => apiClient.get(`/admin/customers/${id}/orders`, { params }),
  createCustomer: (payload) => apiClient.post('/admin/customers', payload),
  getCustomerLocations: () => apiClient.get('/admin/customers/locations'),
  bulkCustomerAction: (action, ids) => apiClient.post('/admin/customers/bulk-action', { action, ids }),
  exportCustomersUrl: (params) => `${apiClient.defaults.baseURL || ''}/admin/customers/export?${new URLSearchParams(params).toString()}`,
  getReviews: (params) => apiClient.get('/admin/reviews', { params }),
  getReviewStats: (params) => apiClient.get('/admin/reviews/stats', { params }),
  updateReviewStatus: (id, status) => apiClient.put(`/admin/reviews/${id}/status`, { status }),
  bulkReviewAction: (action, ids) => apiClient.post('/admin/reviews/bulk-action', { action, ids }),
  deleteReview: (id) => apiClient.delete(`/admin/reviews/${id}`),
  exportReviewsUrl: (params) => `${apiClient.defaults.baseURL || ''}/admin/reviews/export?${new URLSearchParams(params).toString()}`,
  getOrders: (params) => apiClient.get('/admin/orders', { params }),
  getOrderStats: (params) => apiClient.get('/admin/orders/stats', { params }),
  getOrderTabCounts: (params) => apiClient.get('/admin/orders/tab-counts', { params }),
  getOrderById: (id) => apiClient.get(`/admin/orders/${id}`),
  createOrder: (payload) => apiClient.post('/admin/orders', payload),
  exportOrdersUrl: (params) => `${apiClient.defaults.baseURL || ''}/admin/orders/export?${new URLSearchParams(params).toString()}`,
  updateOrderStatus: (id, statusPayload) => {
    const body = typeof statusPayload === 'string' ? { status: statusPayload } : statusPayload;
    return apiClient.put(`/admin/orders/${id}/status`, body);
  },
  updateOrderTracking: (id, payload) => apiClient.put(`/admin/orders/${id}/tracking`, payload),
  updateCustomer: (id, payload) => apiClient.put(`/admin/customers/${id}`, payload),
  deleteCustomer: (id) => apiClient.delete(`/admin/customers/${id}`),
  getNewsletterSubscribers: () => apiClient.get('/admin/newsletter/subscribers'),
  deleteNewsletterSubscriber: (id) => apiClient.delete(`/admin/newsletter/subscribers/${id}`),
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
  getStaff: () => apiClient.get('/admin/staff'),
  createStaff: (payload) => apiClient.post('/admin/staff', payload),
  updateStaff: (id, payload) => apiClient.put(`/admin/staff/${id}`, payload),
  deleteStaff: (id) => apiClient.delete(`/admin/staff/${id}`),
  getRoles: () => apiClient.get('/admin/roles'),
  createRole: (payload) => apiClient.post('/admin/roles', payload),
  updateRole: (id, payload) => apiClient.put(`/admin/roles/${id}`, payload),
  deleteRole: (id) => apiClient.delete(`/admin/roles/${id}`),
  getPermissions: () => apiClient.get('/admin/permissions'),
  importPermissions: () => apiClient.post('/admin/permissions/import'),
  updateRolePermissions: (id, payload) => apiClient.put(`/admin/roles/${id}/permissions`, payload),
  getPermissionGroups: () => apiClient.get('/admin/permission-groups'),
  createPermissionGroup: (payload) => apiClient.post('/admin/permission-groups', payload),
  updatePermissionGroup: (id, payload) => apiClient.put(`/admin/permission-groups/${id}`, payload),
  deletePermissionGroup: (id) => apiClient.delete(`/admin/permission-groups/${id}`),
  updateStaffRole: (id, roleId) => apiClient.put(`/admin/staff/${id}/role`, { roleId }),
  getSettings: () => apiClient.get('/admin/settings'),
  updateSettings: (payload) => apiClient.put('/admin/settings', payload),
  getSettingsPublic: () => apiClient.get('/settings'),
  getShippingZonesPublic: () => apiClient.get('/shipping/zones'),
  getShippingZones: () => apiClient.get('/admin/shipping/zones'),
  createShippingZone: (payload) => apiClient.post('/admin/shipping/zones', payload),
  updateShippingZone: (id, payload) => apiClient.put(`/admin/shipping/zones/${id}`, payload),
  deleteShippingZone: (id) => apiClient.delete(`/admin/shipping/zones/${id}`),
  getActiveSessions: () => apiClient.get('/admin/settings/sessions'),
  revokeSession: (id) => apiClient.delete(`/admin/settings/sessions/${id}`),
  revokeAllOtherSessions: () => apiClient.delete('/admin/settings/sessions'),
  changePasswordSettings: (payload) => apiClient.post('/admin/settings/password', payload),
  getDashboardData: (params) => apiClient.get('/admin/dashboard', { params }),
  getCollections: (params) => apiClient.get('/admin/collections', { params }),
  createCollection: (payload) => apiClient.post('/admin/collections', payload),
  updateCollection: (id, payload) => apiClient.put(`/admin/collections/${id}`, payload),
  deleteCollection: (id) => apiClient.delete(`/admin/collections/${id}`),
  restockVariant: (payload) => apiClient.post('/admin/inventory/restock', payload),
  getNotifications: () => apiClient.get('/admin/notifications'),
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
  validateCoupon: (payload) => apiClient.post('/marketing/validate-coupon', payload),
  getActiveCoupons: () => apiClient.get('/marketing/active-coupons')
};

export const mediaApi = {
  getMedia: (params) => apiClient.get('/admin/media', { params }),
  uploadMedia: (formData, onUploadProgress) => apiClient.post('/admin/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress
  }),
  syncCloudinary: () => apiClient.post('/admin/media/sync'),
  renameMedia: (id, newFilename) => apiClient.put(`/admin/media/${id}/rename`, { newFilename }),
  deleteMedia: (id, forceDelete = false) => apiClient.delete(`/admin/media/${id}`, { data: { forceDelete } }),
  getStats: () => apiClient.get('/admin/media/stats'),
  getFolders: () => apiClient.get('/admin/media/folders'),
  moveMedia: (id, folder) => apiClient.put(`/admin/media/${id}/move`, { folder }),
  bulkDelete: (ids, forceDelete = false) => apiClient.post('/admin/media/bulk-delete', { ids, forceDelete }),
  downloadMediaUrl: (id) => `${apiClient.defaults.baseURL || ''}/admin/media/${id}/download`
};

export const blogApi = {
  getBlogs: (params) => apiClient.get('/blogs', { params }),
  getBlogBySlug: (slug) => apiClient.get(`/blogs/${slug}`),
  createBlog: (payload) => apiClient.post('/admin/blogs', payload),
  updateBlog: (id, payload) => apiClient.put(`/admin/blogs/${id}`, payload),
  deleteBlog: (id) => apiClient.delete(`/admin/blogs/${id}`)
};

export const reportsApi = {
  getReports: (params) => apiClient.get('/admin/reports', { params })
};

export const aiApi = {
  chat: (payload) => apiClient.post('/ai/chat', payload),
};




