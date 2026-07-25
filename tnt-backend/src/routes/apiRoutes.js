import express from 'express';
import { register, login, getProfile, logout } from '../controllers/authController.js';
import { getProducts, getProductBySlug, createProduct, deleteProduct, getColors, getSizes, createColor, updateProduct, getCollections, createCollection } from '../controllers/productController.js';
import { createOrder, getUserOrders, getOrderTracking, createReturnRequest } from '../controllers/orderController.js';

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
  deleteCategoryAdmin
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
router.get('/auth/me', protect, getProfile);

// Catalog Routes
router.get('/products', getProducts);
router.post('/products', protect, restrictTo('ADMIN'), createProduct);
router.put('/products/:id', protect, restrictTo('ADMIN'), updateProduct);
router.get('/products/:slug', getProductBySlug);
router.delete('/products/:id', protect, restrictTo('ADMIN'), deleteProduct);

router.get('/colors', getColors);
router.post('/colors', protect, restrictTo('ADMIN'), createColor);
router.get('/sizes', getSizes);
router.get('/collections', getCollections);
router.post('/collections', protect, restrictTo('ADMIN'), createCollection);
router.get('/lookbooks', getLookbooks);

// Dynamic Homepage CMS
router.get('/cms/homepage', getHomepageData);
router.put('/cms/homepage', protect, restrictTo('ADMIN'), updateHomepageCMS);
router.post('/cms/newsletter/subscribe', subscribeNewsletter);


// Orders & Payments
router.post('/orders', protect, createOrder);
router.get('/orders/my-orders', protect, getUserOrders);
router.get('/orders/track/:orderId', getOrderTracking);
router.post('/orders/:id/returns', protect, createReturnRequest);
router.post('/payments/razorpay/create-order', protect, createRazorpayOrder);
router.post('/payments/razorpay/verify', protect, verifyRazorpayPayment);

// Customer Reviews
router.get('/reviews/my-reviews', protect, getMyReviews);
router.post('/reviews', protect, createReview);
router.put('/reviews/:reviewId', protect, updateReview);
router.delete('/reviews/:reviewId', protect, deleteReview);

// Enterprise Admin Dashboard
router.get('/admin/metrics', protect, restrictTo('ADMIN'), getAdminDashboardMetrics);
router.get('/admin/audit-logs', protect, restrictTo('ADMIN'), getAuditLogs);
router.get('/admin/categories', protect, restrictTo('ADMIN'), getCategoriesAdmin);
router.post('/admin/categories', protect, restrictTo('ADMIN'), createCategoryAdmin);
router.put('/admin/categories/:id', protect, restrictTo('ADMIN'), updateCategoryAdmin);
router.delete('/admin/categories/:id', protect, restrictTo('ADMIN'), deleteCategoryAdmin);
router.get('/admin/customers', protect, restrictTo('ADMIN'), getCustomersAdmin);
router.get('/admin/reviews', protect, restrictTo('ADMIN'), getReviewsAdmin);
router.delete('/admin/reviews/:id', protect, restrictTo('ADMIN'), deleteReviewAdmin);
router.get('/admin/orders', protect, restrictTo('ADMIN'), getOrdersAdmin);
router.put('/admin/orders/:id/status', protect, restrictTo('ADMIN'), updateOrderStatusAdmin);
router.put('/admin/orders/:id/tracking', protect, restrictTo('ADMIN'), updateOrderTrackingAdmin);
router.put('/admin/customers/:id', protect, restrictTo('ADMIN'), updateCustomerAdmin);
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

router.delete('/admin/customers/:id', protect, restrictTo('ADMIN'), deleteCustomerAdmin);
router.post('/admin/email-blast', protect, restrictTo('ADMIN'), sendBlastEmailAdmin);
router.get('/admin/returns', protect, restrictTo('ADMIN'), getReturnsAdmin);
router.put('/admin/returns/:id', protect, restrictTo('ADMIN'), updateReturnRequestAdmin);
router.post('/upload', protect, restrictTo('ADMIN'), upload.single('image'), uploadImage);

// Admin CMS Delete Routes
router.delete('/admin/cms/banners/:id', protect, restrictTo('ADMIN'), deleteHeroBannerAdmin);
router.delete('/admin/cms/trust-features/:id', protect, restrictTo('ADMIN'), deleteTrustFeatureAdmin);
router.delete('/admin/cms/promotions/:id', protect, restrictTo('ADMIN'), deletePromotionAdmin);
router.delete('/admin/cms/instagram-pics/:id', protect, restrictTo('ADMIN'), deleteInstagramPicAdmin);
router.delete('/admin/cms/why-choose-us/:id', protect, restrictTo('ADMIN'), deleteWhyChooseUsAdmin);

// Initialize memory storage multer instance for media library uploads
const uploadMemory = multer({ storage: multer.memoryStorage() });

// Public Marketing Validation
router.post('/marketing/validate-coupon', validateCouponCode);

// Enterprise Admin Marketing Suite
router.get('/admin/marketing/stats', protect, restrictTo('ADMIN'), getMarketingStats);
router.get('/admin/coupons', protect, restrictTo('ADMIN'), getCoupons);
router.post('/admin/coupons', protect, restrictTo('ADMIN'), createCoupon);
router.put('/admin/coupons/:id', protect, restrictTo('ADMIN'), updateCoupon);
router.delete('/admin/coupons/:id', protect, restrictTo('ADMIN'), deleteCoupon);
router.get('/admin/sales', protect, restrictTo('ADMIN'), getSales);
router.post('/admin/sales', protect, restrictTo('ADMIN'), createSale);
router.put('/admin/sales/:id', protect, restrictTo('ADMIN'), updateSale);
router.delete('/admin/sales/:id', protect, restrictTo('ADMIN'), deleteSale);

// Enterprise Admin Media Library Suite
router.get('/admin/media', protect, restrictTo('ADMIN'), getMediaAssets);
router.post('/admin/media/upload', protect, restrictTo('ADMIN'), uploadMemory.single('file'), uploadMedia);
router.post('/admin/media/sync', protect, restrictTo('ADMIN'), syncCloudinary);
router.put('/admin/media/:id/rename', protect, restrictTo('ADMIN'), renameMediaAsset);
router.delete('/admin/media/:id', protect, restrictTo('ADMIN'), deleteMediaAsset);

export default router;





