import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

import { register, login, getProfile, logout, updateProfile, verifyOTP, resendOTP, googleLogin } from '../controllers/authController.js';
import { getProducts, getProductBySlug, createProduct, deleteProduct, getColors, getSizes, createColor, updateProduct, getCollections, createCollection, getCategoriesPublic } from '../controllers/productController.js';
import { createOrder, getUserOrders, getOrderTracking, createReturnRequest } from '../controllers/orderController.js';
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
  getStaffAdmin,
  createStaffAdmin,
  updateStaffAdmin,
  deleteStaffAdmin,
  getRolesAdmin,
  getPermissionsAdmin,
  updateRolePermissionsAdmin,
  getSettingsAdmin,
  updateSettingsAdmin,
  getSettingsPublic,
  getAdminDashboardData,
  getReportsAdmin,
  restockInventory
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
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

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
router.post('/auth/resend-otp', resendOTP);
router.post('/auth/google-login', googleLogin);
router.get('/auth/me', protect, getProfile);
router.put('/auth/profile', protect, updateProfile);

// ─── Public Catalog Routes ────────────────────────────────────────────────────
router.get('/products', getProducts);
router.post('/products', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), createProduct);
router.put('/products/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), updateProduct);
router.get('/products/:slug', getProductBySlug);
router.get('/categories', getCategoriesPublic);
router.get('/settings', getSettingsPublic);
router.delete('/products/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deleteProduct);

router.get('/colors', getColors);
router.post('/colors', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), createColor);
router.get('/sizes', getSizes);
router.get('/collections', getCollections);
router.post('/collections', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), createCollection);
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
router.put('/cms/homepage', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), updateHomepageCMS);
router.post('/cms/newsletter/subscribe', subscribeNewsletter);

// ─── Orders & Payments ─────────────────────────────────────────────────────────
router.post('/orders', protect, createOrder);
router.get('/orders/my-orders', protect, getUserOrders);
router.get('/orders/track/:orderId', getOrderTracking);
router.post('/orders/:id/returns', protect, createReturnRequest);
router.post('/payments/razorpay/create-order', protect, createRazorpayOrder);
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
router.post('/upload', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), uploadDisk.single('image'), uploadImage);

// ─── Enterprise Admin Dashboard ───────────────────────────────────────────────
router.get('/admin/metrics', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getAdminDashboardMetrics);
router.get('/admin/audit-logs', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getAuditLogs);
router.get('/admin/categories', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getCategoriesAdmin);
router.post('/admin/categories', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), createCategoryAdmin);
router.put('/admin/categories/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), updateCategoryAdmin);
router.delete('/admin/categories/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deleteCategoryAdmin);
// NOTE: Named routes before parameterised /:id to avoid conflicts
router.get('/admin/customers/stats', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getCustomerStatsAdmin);
router.get('/admin/customers/export', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), exportCustomersAdmin);
router.get('/admin/customers/locations', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getCustomerLocationsAdmin);
router.post('/admin/customers/bulk-action', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), bulkCustomerActionAdmin);
router.post('/admin/customers', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), createCustomerAdmin);
router.get('/admin/customers', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getCustomersAdmin);
router.get('/admin/customers/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getCustomerByIdAdmin);
router.get('/admin/customers/:id/orders', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getCustomerOrdersAdmin);
router.get('/admin/reviews/stats', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getReviewStatsAdmin);
router.get('/admin/reviews/export', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), exportReviewsAdmin);
router.post('/admin/reviews/bulk-action', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), bulkReviewActionAdmin);
router.get('/admin/reviews', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getReviewsAdmin);
router.put('/admin/reviews/:id/status', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), updateReviewStatusAdmin);
router.delete('/admin/reviews/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deleteReviewAdmin);
// NOTE: Named/specific routes before parameterised /:id to avoid conflicts
router.get('/admin/orders/stats', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getOrderStatsAdmin);
router.get('/admin/orders/export', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), exportOrdersAdmin);
router.get('/admin/orders/tab-counts', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getOrderTabCountsAdmin);
router.post('/admin/orders', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), createOrderAdmin);
router.get('/admin/orders', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getOrdersAdmin);
router.get('/admin/orders/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getOrderByIdAdmin);
router.put('/admin/orders/:id/status', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), updateOrderStatusAdmin);
router.put('/admin/orders/:id/tracking', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), updateOrderTrackingAdmin);
router.put('/admin/customers/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), updateCustomerAdmin);
router.delete('/admin/customers/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deleteCustomerAdmin);
router.post('/admin/email-blast', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), sendBlastEmailAdmin);
router.get('/admin/returns', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getReturnsAdmin);
router.put('/admin/returns/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), updateReturnRequestAdmin);

// ─── Admin CMS Delete Routes ──────────────────────────────────────────────────
router.delete('/admin/cms/banners/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deleteHeroBannerAdmin);
router.delete('/admin/cms/trust-features/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deleteTrustFeatureAdmin);
router.delete('/admin/cms/promotions/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deletePromotionAdmin);
router.delete('/admin/cms/instagram-pics/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deleteInstagramPicAdmin);
router.delete('/admin/cms/why-choose-us/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deleteWhyChooseUsAdmin);
router.get('/admin/newsletter/subscribers', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getNewsletterSubscribersAdmin);
router.delete('/admin/newsletter/subscribers/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deleteNewsletterSubscriberAdmin);

// ─── Public Marketing Routes ──────────────────────────────────────────────────
router.post('/marketing/validate-coupon', validateCouponCode);
router.get('/marketing/active-coupons', getActiveCouponsPublic);

// ─── Enterprise Admin Marketing Suite ────────────────────────────────────────
router.get('/admin/marketing/stats', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getMarketingStats);
router.get('/admin/coupons', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getCoupons);
router.post('/admin/coupons', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), createCoupon);
router.put('/admin/coupons/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), updateCoupon);
router.delete('/admin/coupons/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deleteCoupon);
router.get('/admin/sales', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getSales);
router.post('/admin/sales', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), createSale);
router.put('/admin/sales/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), updateSale);
router.delete('/admin/sales/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deleteSale);

// ─── Enterprise Admin Media Library Suite ────────────────────────────────────
// NOTE: specific named routes MUST come before /:id parameter routes
router.get('/admin/media/stats', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getMediaStats);
router.get('/admin/media/folders', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getMediaFolders);
router.post('/admin/media/upload', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), uploadMemory.single('file'), uploadMedia);
router.post('/admin/media/sync', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), syncCloudinary);
router.post('/admin/media/bulk-delete', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), bulkDeleteMediaAssets);
router.get('/admin/media', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getMediaAssets);
router.get('/admin/media/:id/download', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), downloadMediaAsset);
router.get('/admin/media/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getMediaAssetById);
router.put('/admin/media/:id/rename', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), renameMediaAsset);
router.put('/admin/media/:id/move', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), moveMediaAsset);
router.put('/admin/media/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), updateMediaAsset);
router.delete('/admin/media/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deleteMediaAsset);

// ─── Staff Management ─────────────────────────────────────────────────────────
router.get('/admin/staff', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getStaffAdmin);
router.post('/admin/staff', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), createStaffAdmin);
router.put('/admin/staff/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), updateStaffAdmin);
router.delete('/admin/staff/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deleteStaffAdmin);

// ─── Roles & Permissions ──────────────────────────────────────────────────────
router.get('/admin/roles', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getRolesAdmin);
router.get('/admin/permissions', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getPermissionsAdmin);
router.put('/admin/roles/:id/permissions', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), updateRolePermissionsAdmin);

// ─── System Settings ──────────────────────────────────────────────────────────
router.get('/admin/settings', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getSettingsAdmin);
router.put('/admin/settings', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), updateSettingsAdmin);

// ─── Dashboard Analytics & Inventory Restocking ───────────────────────────────
router.get('/admin/dashboard', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getAdminDashboardData);
router.get('/admin/reports', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getReportsAdmin);
router.post('/admin/inventory/restock', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), restockInventory);

// ─── Public Blog Routes ───────────────────────────────────────────────────────
router.get('/blogs', getBlogs);
router.get('/blogs/:slug', getBlogBySlug);

// ─── Admin Blog CRUD ──────────────────────────────────────────────────────────
router.post('/admin/blogs', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), createBlogAdmin);
router.put('/admin/blogs/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), updateBlogAdmin);
router.delete('/admin/blogs/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deleteBlogAdmin);

export default router;
