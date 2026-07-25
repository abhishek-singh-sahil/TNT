import { prisma } from '../config/prisma.js';

// ==========================================
// SECTION 1: DASHBOARD STATS
// ==========================================
export const getMarketingStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfThisMonth = new Date();
    startOfThisMonth.setDate(1);
    startOfThisMonth.setHours(0, 0, 0, 0);

    const [
      totalActiveCoupons,
      expiredCoupons,
      scheduledCoupons,
      runningSales,
      upcomingSales,
      allProducts,
      allCategories,
      usageToday,
      usageThisMonth,
      allCouponUsages
    ] = await Promise.all([
      // Active Coupons
      prisma.coupon.count({
        where: { isActive: true, validFrom: { lte: now }, validTill: { gte: now } }
      }),
      // Expired Coupons
      prisma.coupon.count({
        where: { validTill: { lt: now } }
      }),
      // Scheduled Coupons
      prisma.coupon.count({
        where: { validFrom: { gt: now } }
      }),
      // Running Sales campaigns
      prisma.saleCampaign.findMany({
        where: { status: 'ACTIVE', startDate: { lte: now }, endDate: { gte: now } },
        include: { products: true, categories: { include: { products: true } } }
      }),
      // Upcoming Sales
      prisma.saleCampaign.count({
        where: { startDate: { gt: now } }
      }),
      // Products count (needed for general reference)
      prisma.product.count({ where: { deletedAt: null } }),
      // Categories count
      prisma.category.count(),
      // Coupon usages today
      prisma.couponUsage.count({
        where: { usedAt: { gte: startOfToday } }
      }),
      // Coupon usages this month
      prisma.couponUsage.count({
        where: { usedAt: { gte: startOfThisMonth } }
      }),
      // All coupon usages with order details for revenue calculations
      prisma.couponUsage.findMany({
        include: { order: true, coupon: true }
      })
    ]);

    // Calculate unique products on sale from running campaigns
    const saleProductIds = new Set();
    const saleCategoryIds = new Set();

    runningSales.forEach(sale => {
      if (sale.campaignType === 'STORE') {
        // Storewide discount applies to everything, but we don't have to add all products unless requested
      } else if (sale.campaignType === 'CATEGORY') {
        sale.categories.forEach(cat => {
          saleCategoryIds.add(cat.id);
          cat.products.forEach(p => {
            if (p.deletedAt === null) saleProductIds.add(p.id);
          });
        });
      } else {
        sale.products.forEach(p => {
          if (p.deletedAt === null) saleProductIds.add(p.id);
        });
      }
    });

    // Total revenue and discount calculations
    let revenueGenerated = 0;
    let totalDiscountAmount = 0;
    allCouponUsages.forEach(usage => {
      if (usage.order) {
        revenueGenerated += usage.order.totalAmount;
        totalDiscountAmount += usage.order.discountAmount;
      }
    });

    const averageDiscount = allCouponUsages.length > 0 ? (totalDiscountAmount / allCouponUsages.length) : 0;
    const conversionRate = allCouponUsages.length > 0 ? 4.8 : 0; // standard estimation mock

    return res.json({
      success: true,
      stats: {
        totalActiveCoupons,
        expiredCoupons,
        scheduledCoupons,
        runningSalesCount: runningSales.length,
        upcomingSales,
        productsOnSaleCount: saleProductIds.size,
        categoriesOnSaleCount: saleCategoryIds.size,
        couponUsageToday: usageToday,
        couponUsageThisMonth: usageThisMonth,
        revenueGenerated,
        averageDiscount,
        conversionRate
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch marketing stats', error: error.message });
  }
};

// ==========================================
// SECTION 2: COUPON CRUD
// ==========================================
export const getCoupons = async (req, res) => {
  try {
    const { search, filter, sort } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (filter === 'active') {
      where.isActive = true;
      where.validTill = { gte: new Date() };
    } else if (filter === 'expired') {
      where.validTill = { lt: new Date() };
    } else if (filter === 'disabled') {
      where.isActive = false;
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'priority') orderBy = { priority: 'desc' };
    else if (sort === 'code') orderBy = { code: 'asc' };
    else if (sort === 'discountValue') orderBy = { discountValue: 'desc' };

    const coupons = await prisma.coupon.findMany({
      where,
      orderBy,
      include: { _count: { select: { couponUsages: true } } }
    });

    return res.json({ success: true, coupons });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch coupons', error: error.message });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const data = req.body;

    if (!data.code || !data.name || !data.discountValue || !data.validTill) {
      return res.status(400).json({ success: false, message: 'Required coupon fields are missing' });
    }

    // Check code uniqueness
    const exists = await prisma.coupon.findUnique({ where: { code: data.code.toUpperCase() } });
    if (exists) {
      return res.status(400).json({ success: false, message: 'A coupon with this code already exists' });
    }

    const coupon = await prisma.coupon.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description,
        couponType: data.couponType || 'PERCENTAGE',
        discountValue: parseFloat(data.discountValue),
        maxDiscount: data.maxDiscount ? parseFloat(data.maxDiscount) : null,
        minOrderAmount: parseFloat(data.minOrderAmount || '0'),
        maxUses: parseInt(data.maxUses || '1000'),
        maxUsesPerCustomer: parseInt(data.maxUsesPerCustomer || '1'),
        priority: parseInt(data.priority || '0'),
        autoApply: !!data.autoApply,
        stackable: !!data.stackable,
        newCustomerOnly: !!data.newCustomerOnly,
        loggedInOnly: !!data.loggedInOnly,
        allowMultipleRedeem: !!data.allowMultipleRedeem,
        applicability: data.applicability || 'STORE',
        applicableCategoryIds: data.applicableCategoryIds || [],
        applicableProductIds: data.applicableProductIds || [],
        excludedCategoryIds: data.excludedCategoryIds || [],
        excludedProductIds: data.excludedProductIds || [],
        excludeSaleProducts: !!data.excludeSaleProducts,
        minQuantity: data.minQuantity ? parseInt(data.minQuantity) : null,
        maxQuantity: data.maxQuantity ? parseInt(data.maxQuantity) : null,
        validFrom: data.validFrom ? new Date(data.validFrom) : new Date(),
        validTill: new Date(data.validTill),
        isActive: data.isActive !== false
      }
    });

    return res.status(201).json({ success: true, message: 'Coupon created successfully', coupon });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create coupon', error: error.message });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const exists = await prisma.coupon.findUnique({ where: { id } });
    if (!exists) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    if (data.code && data.code.toUpperCase() !== exists.code) {
      const codeExists = await prisma.coupon.findUnique({ where: { code: data.code.toUpperCase() } });
      if (codeExists) {
        return res.status(400).json({ success: false, message: 'Another coupon has this code' });
      }
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code ? data.code.toUpperCase() : undefined,
        description: data.description,
        couponType: data.couponType,
        discountValue: data.discountValue ? parseFloat(data.discountValue) : undefined,
        maxDiscount: data.maxDiscount !== undefined ? (data.maxDiscount ? parseFloat(data.maxDiscount) : null) : undefined,
        minOrderAmount: data.minOrderAmount !== undefined ? parseFloat(data.minOrderAmount) : undefined,
        maxUses: data.maxUses !== undefined ? parseInt(data.maxUses) : undefined,
        maxUsesPerCustomer: data.maxUsesPerCustomer !== undefined ? parseInt(data.maxUsesPerCustomer) : undefined,
        priority: data.priority !== undefined ? parseInt(data.priority) : undefined,
        autoApply: data.autoApply !== undefined ? !!data.autoApply : undefined,
        stackable: data.stackable !== undefined ? !!data.stackable : undefined,
        newCustomerOnly: data.newCustomerOnly !== undefined ? !!data.newCustomerOnly : undefined,
        loggedInOnly: data.loggedInOnly !== undefined ? !!data.loggedInOnly : undefined,
        allowMultipleRedeem: data.allowMultipleRedeem !== undefined ? !!data.allowMultipleRedeem : undefined,
        applicability: data.applicability,
        applicableCategoryIds: data.applicableCategoryIds,
        applicableProductIds: data.applicableProductIds,
        excludedCategoryIds: data.excludedCategoryIds,
        excludedProductIds: data.excludedProductIds,
        excludeSaleProducts: data.excludeSaleProducts !== undefined ? !!data.excludeSaleProducts : undefined,
        minQuantity: data.minQuantity !== undefined ? (data.minQuantity ? parseInt(data.minQuantity) : null) : undefined,
        maxQuantity: data.maxQuantity !== undefined ? (data.maxQuantity ? parseInt(data.maxQuantity) : null) : undefined,
        validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
        validTill: data.validTill ? new Date(data.validTill) : undefined,
        isActive: data.isActive !== undefined ? !!data.isActive : undefined
      }
    });

    return res.json({ success: true, message: 'Coupon updated successfully', coupon });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update coupon', error: error.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id } });
    return res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete coupon', error: error.message });
  }
};

// ==========================================
// SECTION 3: SALES CRUD
// ==========================================
export const getSales = async (req, res) => {
  try {
    const campaigns = await prisma.saleCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        products: { select: { id: true, name: true } },
        categories: { select: { id: true, name: true } }
      }
    });
    return res.json({ success: true, campaigns });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch sales campaigns', error: error.message });
  }
};

export const createSale = async (req, res) => {
  try {
    const data = req.body;
    if (!data.name || !data.salePercentage || !data.startDate || !data.endDate) {
      return res.status(400).json({ success: false, message: 'Required campaign fields are missing' });
    }

    const categoriesConnect = (data.categoryIds || []).map(id => ({ id }));
    const productsConnect = (data.productIds || []).map(id => ({ id }));

    const campaign = await prisma.saleCampaign.create({
      data: {
        name: data.name,
        description: data.description,
        salePercentage: parseFloat(data.salePercentage),
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        priority: parseInt(data.priority || '0'),
        status: data.status || 'ACTIVE',
        bgColor: data.bgColor || '#f5f5f7',
        badgeColor: data.badgeColor || '#ff0000',
        badgeText: data.badgeText || 'SALE',
        displayOrder: parseInt(data.displayOrder || '0'),
        campaignType: data.campaignType || 'PRODUCT',
        categories: { connect: categoriesConnect },
        products: { connect: productsConnect }
      },
      include: {
        products: { select: { id: true, name: true } },
        categories: { select: { id: true, name: true } }
      }
    });

    return res.status(201).json({ success: true, message: 'Sale campaign created successfully', campaign });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create sale campaign', error: error.message });
  }
};

export const updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const exists = await prisma.saleCampaign.findUnique({
      where: { id },
      include: { products: true, categories: true }
    });

    if (!exists) {
      return res.status(404).json({ success: false, message: 'Sale campaign not found' });
    }

    // Disconnect old links
    await prisma.saleCampaign.update({
      where: { id },
      data: {
        products: { disconnect: exists.products.map(p => ({ id: p.id })) },
        categories: { disconnect: exists.categories.map(c => ({ id: c.id })) }
      }
    });

    const categoriesConnect = (data.categoryIds || []).map(id => ({ id }));
    const productsConnect = (data.productIds || []).map(id => ({ id }));

    const campaign = await prisma.saleCampaign.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        salePercentage: data.salePercentage ? parseFloat(data.salePercentage) : undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        priority: data.priority !== undefined ? parseInt(data.priority) : undefined,
        status: data.status,
        bgColor: data.bgColor,
        badgeColor: data.badgeColor,
        badgeText: data.badgeText,
        displayOrder: data.displayOrder !== undefined ? parseInt(data.displayOrder) : undefined,
        campaignType: data.campaignType,
        categories: { connect: categoriesConnect },
        products: { connect: productsConnect }
      },
      include: {
        products: { select: { id: true, name: true } },
        categories: { select: { id: true, name: true } }
      }
    });

    return res.json({ success: true, message: 'Sale campaign updated successfully', campaign });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update sale campaign', error: error.message });
  }
};

export const deleteSale = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.saleCampaign.delete({ where: { id } });
    return res.json({ success: true, message: 'Sale campaign deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete sale campaign', error: error.message });
  }
};

// ==========================================
// SECTION 4: FRONTEND VALIDATION & CHECKOUT
// ==========================================
export const validateCouponCode = async (req, res) => {
  try {
    const { code, cartAmount, cartItems = [], userId } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!coupon || !coupon.isActive) {
      return res.status(400).json({ success: false, message: 'Invalid or disabled coupon code' });
    }

    const now = new Date();
    if (coupon.validFrom > now) {
      return res.status(400).json({ success: false, message: 'This coupon is scheduled and not yet active' });
    }

    if (coupon.validTill < now) {
      return res.status(400).json({ success: false, message: 'This coupon has expired' });
    }

    if (coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit has been reached' });
    }

    const orderAmount = parseFloat(cartAmount || '0');
    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({ success: false, message: `Minimum purchase of ₹${coupon.minOrderAmount} is required` });
    }

    if (coupon.loggedInOnly && !userId) {
      return res.status(400).json({ success: false, message: 'You must be logged in to redeem this coupon' });
    }

    // Check user usage counts
    if (userId) {
      const userUsageCount = await prisma.couponUsage.count({
        where: { couponId: coupon.id, userId }
      });
      if (userUsageCount >= coupon.maxUsesPerCustomer) {
        return res.status(400).json({ success: false, message: 'You have already used this coupon maximum number of times' });
      }

      if (coupon.newCustomerOnly) {
        const orderCount = await prisma.order.count({ where: { userId } });
        if (orderCount > 0) {
          return res.status(400).json({ success: false, message: 'This coupon is only valid for your first order' });
        }
      }
    }

    // Check Coupon Applicability Rules
    if (coupon.applicability === 'CATEGORIES' && coupon.applicableCategoryIds.length > 0) {
      // Find category of items
      const productIds = cartItems.map(item => item.productId);
      const itemsInCategories = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { categories: true }
      });

      const hasApplicableItem = itemsInCategories.some(prod =>
        prod.categories.some(cat => coupon.applicableCategoryIds.includes(cat.id))
      );

      if (!hasApplicableItem) {
        return res.status(400).json({ success: false, message: 'Coupon does not apply to any products in your cart' });
      }
    } else if (coupon.applicability === 'PRODUCTS' && coupon.applicableProductIds.length > 0) {
      const hasProduct = cartItems.some(item => coupon.applicableProductIds.includes(item.productId));
      if (!hasProduct) {
        return res.status(400).json({ success: false, message: 'Coupon is not applicable to any of the products in your cart' });
      }
    }

    // Check exclusions
    if (coupon.excludedProductIds.length > 0) {
      const allExcluded = cartItems.every(item => coupon.excludedProductIds.includes(item.productId));
      if (allExcluded) {
        return res.status(400).json({ success: false, message: 'All items in your cart are excluded from this coupon' });
      }
    }

    // Calculate discount amount
    let discount = 0;
    if (coupon.couponType === 'PERCENTAGE') {
      discount = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else if (coupon.couponType === 'FLAT') {
      discount = coupon.discountValue;
    } else if (coupon.couponType === 'FREE_SHIPPING') {
      discount = 0; // handled during shipping calculation
    }

    return res.json({
      success: true,
      message: 'Coupon code validated successfully!',
      coupon: {
        id: coupon.id,
        code: coupon.code,
        couponType: coupon.couponType,
        discountValue: coupon.discountValue,
        discountAmount: Math.min(discount, orderAmount)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Coupon validation failed', error: error.message });
  }
};
