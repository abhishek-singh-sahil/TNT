import express from 'express';
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
  deleteWhyChooseUsAdmin
} from '../controllers/cmsController.js';


import { createRazorpayOrder, verifyRazorpayPayment } from '../controllers/paymentController.js';
import {
  getAdminDashboardMetrics,
  getAuditLogs,
  getCategoriesAdmin,
  createCategoryAdmin,
  getCustomersAdmin,
  getReviewsAdmin,
  deleteReviewAdmin,
  getOrdersAdmin,
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
  validateCouponCode
} from '../controllers/marketingController.js';

import {
  syncCloudinary,
  getMediaAssets,
  uploadMedia,
  deleteMediaAsset,
  renameMediaAsset
} from '../controllers/mediaController.js';

import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Auth Routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/logout', logout);
router.post('/auth/verify-otp', verifyOTP);
router.post('/auth/resend-otp', resendOTP);
router.post('/auth/google-login', googleLogin);
router.get('/auth/me', protect, getProfile);
router.put('/auth/profile', protect, updateProfile);

// Catalog Routes
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

// Dynamic Homepage CMS
router.get(
  '/cms/homepage',
  (req, res, next) => {
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


// Orders & Payments
router.post('/orders', protect, createOrder);
router.get('/orders/my-orders', protect, getUserOrders);
router.get('/orders/track/:orderId', getOrderTracking);
router.post('/orders/:id/returns', protect, createReturnRequest);
router.post('/payments/razorpay/create-order', protect, createRazorpayOrder);
router.post('/payments/razorpay/verify', protect, verifyRazorpayPayment);

// Address CRUD
router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, createAddress);
router.put('/addresses/:id', protect, updateAddress);
router.delete('/addresses/:id', protect, deleteAddress);

// Customer Reviews
router.get('/reviews/my-reviews', protect, getMyReviews);
router.post('/reviews', protect, createReview);
router.put('/reviews/:reviewId', protect, updateReview);
router.delete('/reviews/:reviewId', protect, deleteReview);

// Enterprise Admin Dashboard
router.get('/admin/metrics', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getAdminDashboardMetrics);
router.get('/admin/audit-logs', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getAuditLogs);
router.get('/admin/categories', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getCategoriesAdmin);
router.post('/admin/categories', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), createCategoryAdmin);
router.put('/admin/categories/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), updateCategoryAdmin);
router.delete('/admin/categories/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deleteCategoryAdmin);
router.get('/admin/customers', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getCustomersAdmin);
router.get('/admin/reviews', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getReviewsAdmin);
router.delete('/admin/reviews/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deleteReviewAdmin);
router.get('/admin/orders', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getOrdersAdmin);
router.put('/admin/orders/:id/status', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), updateOrderStatusAdmin);
router.put('/admin/orders/:id/tracking', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), updateOrderTrackingAdmin);
router.put('/admin/customers/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), updateCustomerAdmin);
import { uploadImage } from '../controllers/uploadController.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.delete('/admin/customers/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deleteCustomerAdmin);
router.post('/admin/email-blast', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), sendBlastEmailAdmin);
router.get('/admin/returns', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getReturnsAdmin);
router.put('/admin/returns/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), updateReturnRequestAdmin);
router.post('/upload', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), upload.single('image'), uploadImage);

// Admin CMS Delete Routes
router.delete('/admin/cms/banners/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deleteHeroBannerAdmin);
router.delete('/admin/cms/trust-features/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deleteTrustFeatureAdmin);
router.delete('/admin/cms/promotions/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deletePromotionAdmin);
router.delete('/admin/cms/instagram-pics/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deleteInstagramPicAdmin);
router.delete('/admin/cms/why-choose-us/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deleteWhyChooseUsAdmin);

// Initialize memory storage multer instance for media library uploads
const uploadMemory = multer({ storage: multer.memoryStorage() });

// Public Marketing Validation
router.post('/marketing/validate-coupon', validateCouponCode);

// Enterprise Admin Marketing Suite
router.get('/admin/marketing/stats', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getMarketingStats);
router.get('/admin/coupons', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getCoupons);
router.post('/admin/coupons', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), createCoupon);
router.put('/admin/coupons/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), updateCoupon);
router.delete('/admin/coupons/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deleteCoupon);
router.get('/admin/sales', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getSales);
router.post('/admin/sales', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), createSale);
router.put('/admin/sales/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), updateSale);
router.delete('/admin/sales/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deleteSale);

// Enterprise Admin Media Library Suite
router.get('/admin/media', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getMediaAssets);
router.post('/admin/media/upload', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), uploadMemory.single('file'), uploadMedia);
router.post('/admin/media/sync', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), syncCloudinary);
router.put('/admin/media/:id/rename', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), renameMediaAsset);
router.delete('/admin/media/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deleteMediaAsset);


// Staff Management (Super Admin and Admin)
router.get('/admin/staff', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getStaffAdmin);
router.post('/admin/staff', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), createStaffAdmin);
router.put('/admin/staff/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), updateStaffAdmin);
router.delete('/admin/staff/:id', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), deleteStaffAdmin);

// Roles & Permissions (Super Admin and Admin)
router.get('/admin/roles', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getRolesAdmin);
router.get('/admin/permissions', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getPermissionsAdmin);
router.put('/admin/roles/:id/permissions', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), updateRolePermissionsAdmin);

// System Settings (Super Admin and Admin)
router.get('/admin/settings', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getSettingsAdmin);
router.put('/admin/settings', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), updateSettingsAdmin);

// Dashboard Analytics & Inventory Restocking
router.get('/admin/dashboard', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), getAdminDashboardData);
router.post('/admin/inventory/restock', protect, restrictTo('SUPER_ADMIN', 'ADMIN'), restockInventory);

export default router;





