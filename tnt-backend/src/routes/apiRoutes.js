import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

import { register, login, getProfile, logout, updateProfile, verifyOTP, resendOTP, googleLogin } from '../controllers/authController.js';
import { getProducts, getProductBySlug, createProduct, deleteProduct, getColors, getSizes, createColor, updateProduct, getCollections, createCollection, getCategoriesPublic } from '../controllers/productController.js';
import { createOrder, getUserOrders, getOrderTracking, createReturnRequest, cancelOrder } from '../controllers/orderController.js';
import { getAddresses, createAddress, updateAddress, deleteAddress } from '../controllers/addressController.js';
import { getMyReviews, createReview, updateReview, deleteReview } from '../controllers/reviewController.js';
import { getLookbooks } from '../controllers/lookbookController.js';
import {
  getHomepageData,
  updateHomepageCMS,
  subscribeNewsletter,
  deleteHeroBannerAdmin,
  deleteTrustFeatureAdmin,
  deletePromotionAdmin,
  deleteInstagramPicAdmin,
  deleteWhyChooseUsAdmin,
  getNewsletterSubscribersAdmin,
  deleteNewsletterSubscriberAdmin
} from '../controllers/cmsController.js';

import { createRazorpayOrder, verifyRazorpayPayment } from '../controllers/paymentController.js';
import {
  getAdminDashboardMetrics,
  getAuditLogs,
  getCategoriesAdmin,
  createCategoryAdmin,
  getCustomersAdmin,
  getCustomerStatsAdmin,
  getCustomerByIdAdmin,
  getCustomerOrdersAdmin,
  createCustomerAdmin,
  getCustomerLocationsAdmin,
  exportCustomersAdmin,
  bulkCustomerActionAdmin,
  getReviewsAdmin,
  deleteReviewAdmin,
  getReviewStatsAdmin,
  updateReviewStatusAdmin,
  bulkReviewActionAdmin,
  exportReviewsAdmin,
  getOrdersAdmin,
  getOrderStatsAdmin,
  getOrderTabCountsAdmin,
  getOrderByIdAdmin,
  exportOrdersAdmin,
  createOrderAdmin,
  updateOrderStatusAdmin,
  updateOrderTrackingAdmin,
  updateCustomerAdmin,
  deleteCustomerAdmin,
  sendBlastEmailAdmin,
  getReturnsAdmin,
  updateReturnRequestAdmin,
  updateCategoryAdmin,
  deleteCategoryAdmin,
  getCollectionsAdmin,
  createCollectionAdmin,
  updateCollectionAdmin,
  deleteCollectionAdmin,
  getStaffAdmin,
  createStaffAdmin,
  updateStaffAdmin,
  deleteStaffAdmin,
  getRolesAdmin,
  createRoleAdmin,
  updateRoleAdmin,
  deleteRoleAdmin,
  getPermissionsAdmin,
  updateRolePermissionsAdmin,
  getPermissionGroupsAdmin,
  createPermissionGroupAdmin,
  updatePermissionGroupAdmin,
  deletePermissionGroupAdmin,
  updateStaffRoleAdmin,
  importPermissionsAdmin,
  getSettingsAdmin,
  updateSettingsAdmin,
  getSettingsPublic,
  getAdminDashboardData,
  getReportsAdmin,
  restockInventory,
  getShippingZonesAdmin,
  getShippingZonesPublic,
  createShippingZoneAdmin,
  updateShippingZoneAdmin,
  deleteShippingZoneAdmin,
  changePasswordSettings,
  getActiveSessions,
  revokeSession,
  revokeAllOtherSessions,
  getInventoryNotifications
} from '../controllers/adminController.js';

import {
  getMarketingStats,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getSales,
  createSale,
  updateSale,
  deleteSale,
  validateCouponCode,
  getActiveCouponsPublic
} from '../controllers/marketingController.js';

import {
  syncCloudinary,
  getMediaAssets,
  getMediaStats,
  getMediaAssetById,
  uploadMedia,
  updateMediaAsset,
  deleteMediaAsset,
  renameMediaAsset,
  moveMediaAsset,
  bulkDeleteMediaAssets,
  downloadMediaAsset,
  getMediaFolders
} from '../controllers/mediaController.js';

import {
  getBlogs,
  getBlogBySlug,
  createBlogAdmin,
  updateBlogAdmin,
  deleteBlogAdmin
} from '../controllers/blogController.js';

import { uploadImage } from '../controllers/uploadController.js';
import { protect, restrictTo, requirePermission, requireAnyPermission, checkMaintenanceMode, optionalProtect } from '../middlewares/authMiddleware.js';
import { chatWithAI } from '../controllers/aiController.js';
import rateLimit from 'express-rate-limit';

const aiChatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    message: "Support is currently busy. Please try again shortly."
  }
});

const router = express.Router();

// ─── Multer: Disk storage for /upload endpoint ─────────────────────────────
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadDisk   = multer({ storage: diskStorage });
const uploadMemory = multer({ storage: multer.memoryStorage() });

// ─── Auth Routes ─────────────────────────────────────────────────────────────
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/logout', logout);
router.post('/auth/verify-otp', verifyOTP);
router.post('/ai/chat', aiChatLimiter, optionalProtect, chatWithAI);

// ─── Public Catalog Routes ────────────────────────────────────────────────────
router.get('/products', getProducts);
router.post('/products', protect, requirePermission('create_products'), createProduct);
router.put('/products/:id', protect, requirePermission('edit_products'), updateProduct);
router.get('/products/:slug', getProductBySlug);
router.get('/categories', getCategoriesPublic);
router.get('/settings', getSettingsPublic);
router.get('/shipping/zones', getShippingZonesPublic);
router.delete('/products/:id', protect, requirePermission('delete_products'), deleteProduct);

router.get('/colors', getColors);
router.post('/colors', protect, requirePermission('create_products'), createColor);
router.get('/sizes', getSizes);
router.get('/collections', getCollections);
router.post('/collections', protect, requirePermission('create_categories'), createCollection);
router.get('/lookbooks', getLookbooks);

// ─── Dynamic Homepage CMS ─────────────────────────────────────────────────────
router.get(
  '/cms/homepage',
  (_req, res, next) => {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    next();
  },
  getHomepageData
);
router.put('/cms/homepage', protect, requirePermission('edit_homepage'), updateHomepageCMS);
router.post('/cms/newsletter/subscribe', subscribeNewsletter);

// ─── Orders & Payments ─────────────────────────────────────────────────────────
router.post('/orders', protect, checkMaintenanceMode, createOrder);
router.get('/orders/my-orders', protect, getUserOrders);
router.get('/orders/track/:orderId', getOrderTracking);
router.post('/orders/:id/returns', protect, createReturnRequest);
router.post('/orders/:id/cancel', protect, cancelOrder);
router.post('/payments/razorpay/create-order', protect, checkMaintenanceMode, createRazorpayOrder);
router.post('/payments/razorpay/verify', protect, verifyRazorpayPayment);

// ─── Address CRUD ─────────────────────────────────────────────────────────────
router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, createAddress);
router.put('/addresses/:id', protect, updateAddress);
router.delete('/addresses/:id', protect, deleteAddress);

// ─── Customer Reviews ─────────────────────────────────────────────────────────
router.get('/reviews/my-reviews', protect, getMyReviews);
router.post('/reviews', protect, createReview);
router.put('/reviews/:reviewId', protect, updateReview);
router.delete('/reviews/:reviewId', protect, deleteReview);

// ─── General Upload (disk storage, registers asset in MediaAsset table) ───────
router.post('/upload', protect, requirePermission('upload_media'), uploadDisk.single('image'), uploadImage);

// ─── Enterprise Admin Dashboard ───────────────────────────────────────────────
router.get('/admin/metrics', protect, requirePermission('view_dashboard'), getAdminDashboardMetrics);
router.get('/admin/audit-logs', protect, requirePermission('view_audit_logs'), getAuditLogs);
router.get('/admin/categories', protect, requirePermission('view_categories'), getCategoriesAdmin);
router.post('/admin/categories', protect, requirePermission('create_categories'), createCategoryAdmin);
router.put('/admin/categories/:id', protect, requirePermission('edit_categories'), updateCategoryAdmin);
router.delete('/admin/categories/:id', protect, requirePermission('delete_categories'), deleteCategoryAdmin);
router.get('/admin/collections', protect, requirePermission('view_categories'), getCollectionsAdmin);
router.post('/admin/collections', protect, requirePermission('create_categories'), createCollectionAdmin);
router.put('/admin/collections/:id', protect, requirePermission('edit_categories'), updateCollectionAdmin);
router.delete('/admin/collections/:id', protect, requirePermission('delete_categories'), deleteCollectionAdmin);

// NOTE: Named routes before parameterised /:id to avoid conflicts
router.get('/admin/customers/stats', protect, requirePermission('view_customers'), getCustomerStatsAdmin);
router.get('/admin/customers/export', protect, requirePermission('view_customers'), exportCustomersAdmin);
router.get('/admin/customers/locations', protect, requirePermission('view_customers'), getCustomerLocationsAdmin);
router.post('/admin/customers/bulk-action', protect, requireAnyPermission('edit_customers', 'delete_customers'), bulkCustomerActionAdmin);
router.post('/admin/customers', protect, requirePermission('edit_customers'), createCustomerAdmin);
router.get('/admin/customers', protect, requirePermission('view_customers'), getCustomersAdmin);
router.get('/admin/customers/:id', protect, requirePermission('view_customers'), getCustomerByIdAdmin);
router.get('/admin/customers/:id/orders', protect, requirePermission('view_customers'), getCustomerOrdersAdmin);
router.get('/admin/reviews/stats', protect, requirePermission('view_reviews'), getReviewStatsAdmin);
router.get('/admin/reviews/export', protect, requirePermission('view_reviews'), exportReviewsAdmin);
router.post('/admin/reviews/bulk-action', protect, requireAnyPermission('approve_reviews', 'reject_reviews', 'delete_reviews'), bulkReviewActionAdmin);
router.get('/admin/reviews', protect, requirePermission('view_reviews'), getReviewsAdmin);
router.put('/admin/reviews/:id/status', protect, requireAnyPermission('approve_reviews', 'reject_reviews'), updateReviewStatusAdmin);
router.delete('/admin/reviews/:id', protect, requirePermission('delete_reviews'), deleteReviewAdmin);

// NOTE: Named/specific routes before parameterised /:id to avoid conflicts
router.get('/admin/orders/stats', protect, requirePermission('view_orders'), getOrderStatsAdmin);
router.get('/admin/orders/export', protect, requirePermission('view_orders'), exportOrdersAdmin);
router.get('/admin/orders/tab-counts', protect, requirePermission('view_orders'), getOrderTabCountsAdmin);
router.post('/admin/orders', protect, requirePermission('view_orders'), createOrderAdmin);
router.get('/admin/orders', protect, requirePermission('view_orders'), getOrdersAdmin);
router.get('/admin/orders/:id', protect, requirePermission('view_orders'), getOrderByIdAdmin);
router.put('/admin/orders/:id/status', protect, requirePermission('update_orders'), updateOrderStatusAdmin);
router.put('/admin/orders/:id/tracking', protect, requirePermission('update_orders'), updateOrderTrackingAdmin);
router.put('/admin/customers/:id', protect, requirePermission('edit_customers'), updateCustomerAdmin);
router.delete('/admin/customers/:id', protect, requirePermission('delete_customers'), deleteCustomerAdmin);
router.post('/admin/email-blast', protect, requirePermission('edit_customers'), sendBlastEmailAdmin);
router.get('/admin/returns', protect, requirePermission('view_orders'), getReturnsAdmin);
router.put('/admin/returns/:id', protect, requirePermission('refund_orders'), updateReturnRequestAdmin);

// ─── Admin CMS Delete Routes ──────────────────────────────────────────────────
router.delete('/admin/cms/banners/:id', protect, requirePermission('edit_homepage'), deleteHeroBannerAdmin);
router.delete('/admin/cms/trust-features/:id', protect, requirePermission('edit_homepage'), deleteTrustFeatureAdmin);
router.delete('/admin/cms/promotions/:id', protect, requirePermission('edit_homepage'), deletePromotionAdmin);
router.delete('/admin/cms/instagram-pics/:id', protect, requirePermission('edit_homepage'), deleteInstagramPicAdmin);
router.delete('/admin/cms/why-choose-us/:id', protect, requirePermission('edit_homepage'), deleteWhyChooseUsAdmin);
router.get('/admin/newsletter/subscribers', protect, requirePermission('view_customers'), getNewsletterSubscribersAdmin);
router.delete('/admin/newsletter/subscribers/:id', protect, requirePermission('delete_customers'), deleteNewsletterSubscriberAdmin);

// ─── Public Marketing Routes ──────────────────────────────────────────────────
router.post('/marketing/validate-coupon', validateCouponCode);
router.get('/marketing/active-coupons', getActiveCouponsPublic);

// ─── Enterprise Admin Marketing Suite ────────────────────────────────────────
router.get('/admin/marketing/stats', protect, requirePermission('view_coupons'), getMarketingStats);
router.get('/admin/coupons', protect, requirePermission('view_coupons'), getCoupons);
router.post('/admin/coupons', protect, requirePermission('create_coupons'), createCoupon);
router.put('/admin/coupons/:id', protect, requirePermission('edit_coupons'), updateCoupon);
router.delete('/admin/coupons/:id', protect, requirePermission('delete_coupons'), deleteCoupon);
router.get('/admin/sales', protect, requirePermission('view_coupons'), getSales);
router.post('/admin/sales', protect, requirePermission('create_coupons'), createSale);
router.put('/admin/sales/:id', protect, requirePermission('edit_coupons'), updateSale);
router.delete('/admin/sales/:id', protect, requirePermission('delete_coupons'), deleteSale);

// ─── Enterprise Admin Media Library Suite ────────────────────────────────────
// NOTE: specific named routes MUST come before /:id parameter routes
router.get('/admin/media/stats', protect, requirePermission('view_media'), getMediaStats);
router.get('/admin/media/folders', protect, requirePermission('view_media'), getMediaFolders);
router.post('/admin/media/upload', protect, requirePermission('upload_media'), uploadMemory.single('file'), uploadMedia);
router.post('/admin/media/sync', protect, requirePermission('upload_media'), syncCloudinary);
router.post('/admin/media/bulk-delete', protect, requirePermission('delete_media'), bulkDeleteMediaAssets);
router.get('/admin/media', protect, requirePermission('view_media'), getMediaAssets);
router.get('/admin/media/:id/download', protect, requirePermission('view_media'), downloadMediaAsset);
router.get('/admin/media/:id', protect, requirePermission('view_media'), getMediaAssetById);
router.put('/admin/media/:id/rename', protect, requirePermission('edit_media'), renameMediaAsset);
router.put('/admin/media/:id/move', protect, requirePermission('edit_media'), moveMediaAsset);
router.put('/admin/media/:id', protect, requirePermission('edit_media'), updateMediaAsset);
router.delete('/admin/media/:id', protect, requirePermission('delete_media'), deleteMediaAsset);

// ─── Staff Management ─────────────────────────────────────────────────────────
router.get('/admin/staff', protect, requirePermission('view_staff'), getStaffAdmin);
router.post('/admin/staff', protect, requirePermission('create_staff'), createStaffAdmin);
router.put('/admin/staff/:id', protect, requirePermission('edit_staff'), updateStaffAdmin);
router.delete('/admin/staff/:id', protect, requirePermission('delete_staff'), deleteStaffAdmin);

// ─── Roles & Permissions ──────────────────────────────────────────────────────
router.get('/admin/roles', protect, requirePermission('view_roles'), getRolesAdmin);
router.post('/admin/roles', protect, requirePermission('create_roles'), createRoleAdmin);
router.put('/admin/roles/:id', protect, requirePermission('edit_roles'), updateRoleAdmin);
router.delete('/admin/roles/:id', protect, requirePermission('delete_roles'), deleteRoleAdmin);

router.get('/admin/permissions', protect, requirePermission('view_roles'), getPermissionsAdmin);
router.post('/admin/permissions/import', protect, requirePermission('manage_permissions'), importPermissionsAdmin);
router.put('/admin/roles/:id/permissions', protect, requirePermission('manage_permissions'), updateRolePermissionsAdmin);

router.get('/admin/permission-groups', protect, requirePermission('view_roles'), getPermissionGroupsAdmin);
router.post('/admin/permission-groups', protect, requirePermission('manage_permissions'), createPermissionGroupAdmin);
router.put('/admin/permission-groups/:id', protect, requirePermission('manage_permissions'), updatePermissionGroupAdmin);
router.delete('/admin/permission-groups/:id', protect, requirePermission('manage_permissions'), deletePermissionGroupAdmin);

router.put('/admin/staff/:id/role', protect, requirePermission('assign_roles'), updateStaffRoleAdmin);

// ─── System Settings ──────────────────────────────────────────────────────────
router.get('/admin/settings', protect, requirePermission('view_settings'), getSettingsAdmin);
router.put('/admin/settings', protect, requirePermission('edit_settings'), updateSettingsAdmin);

// Shipping Zones
router.get('/admin/shipping/zones', protect, requirePermission('view_settings'), getShippingZonesAdmin);
router.post('/admin/shipping/zones', protect, requirePermission('edit_settings'), createShippingZoneAdmin);
router.put('/admin/shipping/zones/:id', protect, requirePermission('edit_settings'), updateShippingZoneAdmin);
router.delete('/admin/shipping/zones/:id', protect, requirePermission('edit_settings'), deleteShippingZoneAdmin);

// Active Sessions
router.get('/admin/settings/sessions', protect, getActiveSessions);
router.delete('/admin/settings/sessions/:id', protect, revokeSession);
router.delete('/admin/settings/sessions', protect, revokeAllOtherSessions);

// Security Change Password
router.post('/admin/settings/password', protect, changePasswordSettings);

// ─── Dashboard Analytics & Inventory Restocking ───────────────────────────────
router.get('/admin/dashboard', protect, requirePermission('view_dashboard'), getAdminDashboardData);
router.get('/admin/notifications', protect, getInventoryNotifications);
router.get('/admin/reports', protect, requirePermission('view_reports'), getReportsAdmin);
router.post('/admin/inventory/restock', protect, requirePermission('edit_inventory'), restockInventory);

// ─── Public Blog Routes ───────────────────────────────────────────────────────
router.get('/blogs', getBlogs);
router.get('/blogs/:slug', getBlogBySlug);

router.post('/admin/blogs', protect, requirePermission('edit_homepage'), createBlogAdmin);
router.put('/admin/blogs/:id', protect, requirePermission('edit_homepage'), updateBlogAdmin);
router.delete('/admin/blogs/:id', protect, requirePermission('edit_homepage'), deleteBlogAdmin);

export default router;
