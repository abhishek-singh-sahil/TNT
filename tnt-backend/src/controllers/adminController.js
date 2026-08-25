import { prisma } from '../config/prisma.js';
import { sendEmail } from '../utils/email.js';

export const getAdminDashboardMetrics = async (req, res) => {
  try {
    const isSuper = req.user?.role?.name === 'SUPER_ADMIN';
    const permissions = req.user?.role?.permissions || [];
    const hasPerm = (pname) => isSuper || permissions.some(p => p.name === pname);

    const hasReports = hasPerm('view_reports');
    const hasOrders = hasPerm('view_orders');
    const hasCustomers = hasPerm('view_customers');
    const hasProducts = hasPerm('view_products');

    const totalOrders = hasOrders ? await prisma.order.count() : 0;
    const deliveredOrders = hasOrders ? await prisma.order.count({ where: { orderStatus: 'DELIVERED' } }) : 0;
    const pendingOrders = hasOrders ? await prisma.order.count({ where: { orderStatus: 'CONFIRMED' } }) : 0;
    const totalUsers = hasCustomers ? await prisma.user.count({ where: { role: { name: 'CUSTOMER' } } }) : 0;
    const totalProducts = hasProducts ? await prisma.product.count({ where: { deletedAt: null } }) : 0;

    let totalRevenue = 0;
    if (hasReports) {
      const revenueResult = await prisma.order.aggregate({
        where: {
          OR: [
            { paymentStatus: 'SUCCESS' },
            { orderStatus: 'DELIVERED' }
          ]
        },
        _sum: { totalAmount: true },
      });
      totalRevenue = revenueResult._sum.totalAmount || 0;
    }

    // Fetch low stock items from database
    let lowStockVariants = [];
    if (hasProducts) {
      lowStockVariants = await prisma.productVariant.findMany({
        where: { stock: { lte: 5 } },
        include: { product: true },
        take: 5,
      });
    }

    return res.json({
      success: true,
      metrics: {
        totalSales: hasReports ? `₹${totalRevenue.toLocaleString()}` : '₹0',
        todaySales: '₹0',
        weeklySales: '₹0',
        monthlySales: hasReports ? `₹${totalRevenue.toLocaleString()}` : '₹0',
        totalOrders,
        deliveredOrders,
        pendingOrders,
        totalCustomers: totalUsers,
        activeProducts: totalProducts,
        conversionRate: hasReports && totalOrders > 0 ? '3.4%' : '0.0%',
        cartAbandonmentRate: '0.0%',
      },
      salesGraphData: hasReports && totalOrders > 0 ? [
        { month: 'Current', revenue: totalRevenue, orders: totalOrders }
      ] : [],
      salesByCity: [],
      lowStockItems: lowStockVariants.map(v => ({
        id: v.id,
        name: `${v.product.name} (${v.sku})`,
        stock: v.stock
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch admin metrics', error: error.message });
  }
};

export const getCategoriesAdmin = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        products: {
          select: {
            genderMen: true,
            genderWomen: true,
            isAccessories: true
          }
        }
      }
    });
    return res.json({ success: true, categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch categories', error: error.message });
  }
};

export const createCategoryAdmin = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const category = await prisma.category.create({
      data: { name, slug, description }
    });
    return res.status(201).json({ success: true, message: 'Category created successfully', category });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create category', error: error.message });
  }
};

export const getCollectionsAdmin = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const collections = await prisma.collection.findMany({
      where: {
        name: { contains: search, mode: 'insensitive' }
      },
      include: {
        products: { select: { id: true, name: true, sku: true } }
      },
      orderBy: { displayOrder: 'asc' }
    });
    return res.json({ success: true, collections });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch admin collections', error: error.message });
  }
};

export const createCollectionAdmin = async (req, res) => {
  try {
    const { name, description, season, bannerImage, status, displayOrder, productIds = [] } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Collection name is required' });
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Create collection
    const collection = await prisma.collection.create({
      data: {
        name,
        slug,
        description,
        season,
        bannerImage,
        status,
        displayOrder: parseInt(displayOrder) || 0
      }
    });

    // Assign products if any provided
    if (productIds.length > 0) {
      await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { collectionId: collection.id }
      });
    }

    const fullCollection = await prisma.collection.findUnique({
      where: { id: collection.id },
      include: { products: true }
    });

    return res.status(201).json({ success: true, message: 'Collection created successfully', collection: fullCollection });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create collection', error: error.message });
  }
};

export const updateCollectionAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, season, bannerImage, status, displayOrder, productIds } = req.body;

    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined;

    // Update basic info
    const collection = await prisma.collection.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        season,
        bannerImage,
        status,
        displayOrder: displayOrder !== undefined ? (parseInt(displayOrder) || 0) : undefined
      }
    });

    // Update product assignments if provided
    if (productIds !== undefined) {
      // First, unlink all products currently in this collection
      await prisma.product.updateMany({
        where: { collectionId: id },
        data: { collectionId: null }
      });

      // Link newly selected products
      if (productIds.length > 0) {
        await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { collectionId: id }
        });
      }
    }

    const fullCollection = await prisma.collection.findUnique({
      where: { id },
      include: { products: true }
    });

    return res.json({ success: true, message: 'Collection updated successfully', collection: fullCollection });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update collection', error: error.message });
  }
};

export const deleteCollectionAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Unlink products first
    await prisma.product.updateMany({
      where: { collectionId: id },
      data: { collectionId: null }
    });

    await prisma.collection.delete({ where: { id } });
    return res.json({ success: true, message: 'Collection deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete collection', error: error.message });
  }
};

export const getCustomersAdmin = async (req, res) => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      status = 'all',
      location = 'all',
      sort = 'newest'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, parseInt(limit) || 10);
    const skip = (pageNum - 1) * limitNum;

    const where = { role: { name: 'CUSTOMER' } };

    if (status === 'active') where.isBlocked = false;
    else if (status === 'inactive') where.isBlocked = true;

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Location filter via address city
    if (location && location !== 'all') {
      where.addresses = { some: { city: { equals: location, mode: 'insensitive' } } };
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    else if (sort === 'name') orderBy = { firstName: 'asc' };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatar: true,
          isBlocked: true,
          isVerified: true,
          rewardPoints: true,
          createdAt: true,
          addresses: {
            where: { isDefault: true },
            select: { city: true, state: true },
            take: 1
          },
          orders: {
            where: {
              OR: [{ paymentStatus: 'SUCCESS' }, { orderStatus: 'DELIVERED' }]
            },
            select: { totalAmount: true }
          }
        }
      })
    ]);

    const customers = users.map(u => {
      const address = u.addresses?.[0];
      const location = address ? `${address.city}, ${address.state}` : null;
      const orderCount = u.orders.length;
      const totalSpent = u.orders.reduce((s, o) => s + o.totalAmount, 0);
      return {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName || '',
        email: u.email,
        phone: u.phone || null,
        avatar: u.avatar || null,
        isBlocked: u.isBlocked,
        isVerified: u.isVerified,
        rewardPoints: u.rewardPoints,
        createdAt: u.createdAt,
        location,
        orderCount,
        totalSpent
      };
    });

    return res.json({
      success: true,
      customers,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch customers', error: error.message });
  }
};

export const getCustomerStatsAdmin = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const now = new Date();
    let start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    let end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const duration = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - duration - 1);
    const prevEnd = new Date(start.getTime() - 1);

    const validOrderWhere = { OR: [{ paymentStatus: 'SUCCESS' }, { orderStatus: 'DELIVERED' }] };

    const [
      totalCustomers,
      newCustomersCurrent, newCustomersPrev,
      ordersCurrent, ordersPrev,
      revenueAggCurrent, revenueAggPrev,
      totalCustomersPrev
    ] = await Promise.all([
      prisma.user.count({ where: { role: { name: 'CUSTOMER' } } }),
      prisma.user.count({ where: { role: { name: 'CUSTOMER' }, createdAt: { gte: start, lte: end } } }),
      prisma.user.count({ where: { role: { name: 'CUSTOMER' }, createdAt: { gte: prevStart, lte: prevEnd } } }),
      prisma.order.count({ where: { ...validOrderWhere, createdAt: { gte: start, lte: end } } }),
      prisma.order.count({ where: { ...validOrderWhere, createdAt: { gte: prevStart, lte: prevEnd } } }),
      prisma.order.aggregate({ where: { ...validOrderWhere, createdAt: { gte: start, lte: end } }, _sum: { totalAmount: true }, _count: true }),
      prisma.order.aggregate({ where: { ...validOrderWhere, createdAt: { gte: prevStart, lte: prevEnd } }, _sum: { totalAmount: true }, _count: true }),
      prisma.user.count({ where: { role: { name: 'CUSTOMER' }, createdAt: { lt: start } } })
    ]);

    const calcChange = (cur, prev) => (prev === 0 ? null : parseFloat((((cur - prev) / prev) * 100).toFixed(1)));

    const avgCurrent = revenueAggCurrent._count > 0 ? (revenueAggCurrent._sum.totalAmount || 0) / revenueAggCurrent._count : 0;
    const avgPrev = revenueAggPrev._count > 0 ? (revenueAggPrev._sum.totalAmount || 0) / revenueAggPrev._count : 0;

    return res.json({
      success: true,
      stats: {
        totalCustomers,
        newCustomers: newCustomersCurrent,
        newCustomersChange: calcChange(newCustomersCurrent, newCustomersPrev),
        totalOrders: ordersCurrent,
        totalOrdersChange: calcChange(ordersCurrent, ordersPrev),
        avgOrderValue: parseFloat(avgCurrent.toFixed(2)),
        avgOrderValueChange: calcChange(avgCurrent, avgPrev),
        totalCustomersChange: calcChange(totalCustomers, totalCustomersPrev + totalCustomers)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch customer statistics', error: error.message });
  }
};

export const getCustomerByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        isBlocked: true,
        isVerified: true,
        rewardPoints: true,
        createdAt: true,
        addresses: { orderBy: { isDefault: 'desc' }, take: 3 },
        orders: {
          where: { OR: [{ paymentStatus: 'SUCCESS' }, { orderStatus: 'DELIVERED' }] },
          select: { totalAmount: true }
        }
      }
    });

    if (!user) return res.status(404).json({ success: false, message: 'Customer not found' });

    const defaultAddr = user.addresses?.[0];
    const totalOrders = user.orders.length;
    const totalSpent = user.orders.reduce((s, o) => s + o.totalAmount, 0);

    return res.json({
      success: true,
      customer: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName || '',
        email: user.email,
        phone: user.phone || null,
        avatar: user.avatar || null,
        isBlocked: user.isBlocked,
        isVerified: user.isVerified,
        rewardPoints: user.rewardPoints,
        createdAt: user.createdAt,
        location: defaultAddr ? `${defaultAddr.city}, ${defaultAddr.state}` : null,
        addresses: user.addresses,
        totalOrders,
        totalSpent
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch customer', error: error.message });
  }
};

export const getCustomerOrdersAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = '8' } = req.query;
    const limitNum = Math.min(50, parseInt(limit) || 8);

    const orders = await prisma.order.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: limitNum,
      include: {
        items: {
          take: 1,
          include: {
            product: { select: { name: true, images: { where: { isPrimary: true }, take: 1 } } }
          }
        }
      }
    });

    const formatted = orders.map(o => {
      const firstItem = o.items?.[0];
      const productName = firstItem?.product?.name || firstItem?.productName || 'Order';
      const productImage = firstItem?.product?.images?.[0]?.url || null;
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        totalAmount: o.totalAmount,
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
        productName,
        productImage,
        itemCount: o.items?.length || 0
      };
    });

    return res.json({ success: true, orders: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch customer orders', error: error.message });
  }
};

export const createCustomerAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, city, state } = req.body;

    if (!firstName || !email || !password) {
      return res.status(400).json({ success: false, message: 'First name, email, and password are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A customer with this email already exists' });
    }

    const { default: bcrypt } = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    const customerRole = await prisma.role.findFirst({ where: { name: 'CUSTOMER' } });
    if (!customerRole) {
      return res.status(500).json({ success: false, message: 'CUSTOMER role not found in database' });
    }

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName: lastName || null,
        email,
        phone: phone || null,
        passwordHash,
        roleId: customerRole.id,
        isVerified: true,
        rewardPoints: 320
      }
    });

    if (city && state) {
      await prisma.address.create({
        data: {
          userId: newUser.id,
          fullName: `${firstName} ${lastName || ''}`.trim(),
          phone: phone || 'N/A',
          street: 'N/A',
          city,
          state,
          postalCode: '000000',
          country: 'India',
          isDefault: true,
          type: 'Home'
        }
      });
    }

    return res.status(201).json({ success: true, message: 'Customer account created successfully', customerId: newUser.id });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create customer', error: error.message });
  }
};

export const getCustomerLocationsAdmin = async (req, res) => {
  try {
    const cities = await prisma.address.findMany({
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' },
      where: { city: { not: '' } }
    });
    const locations = cities.map(a => a.city).filter(Boolean);
    return res.json({ success: true, locations });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch locations', error: error.message });
  }
};

export const exportCustomersAdmin = async (req, res) => {
  try {
    const { search = '', status = 'all', location = 'all' } = req.query;

    const where = { role: { name: 'CUSTOMER' } };
    if (status === 'active') where.isBlocked = false;
    else if (status === 'inactive') where.isBlocked = true;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (location && location !== 'all') {
      where.addresses = { some: { city: { equals: location, mode: 'insensitive' } } };
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        isBlocked: true, createdAt: true, rewardPoints: true,
        addresses: { where: { isDefault: true }, select: { city: true, state: true }, take: 1 },
        orders: {
          where: { OR: [{ paymentStatus: 'SUCCESS' }, { orderStatus: 'DELIVERED' }] },
          select: { totalAmount: true }
        }
      }
    });

    let csv = 'Customer ID,First Name,Last Name,Email,Phone,Orders,Total Spent,Status,Location,Member Since,Reward Points\n';
    users.forEach(u => {
      const name1 = (u.firstName || '').replace(/"/g, '""');
      const name2 = (u.lastName || '').replace(/"/g, '""');
      const email = (u.email || '').replace(/"/g, '""');
      const phone = (u.phone || 'N/A').replace(/"/g, '""');
      const addr = u.addresses?.[0];
      const loc = addr ? `${addr.city}, ${addr.state}` : 'N/A';
      const orders = u.orders.length;
      const spent = u.orders.reduce((s, o) => s + o.totalAmount, 0).toFixed(2);
      const statusStr = u.isBlocked ? 'Inactive' : 'Active';
      const joined = new Date(u.createdAt).toISOString().split('T')[0];
      csv += `"${u.id}","${name1}","${name2}","${email}","${phone}",${orders},${spent},"${statusStr}","${loc}","${joined}",${u.rewardPoints}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=tnt-customers-${Date.now()}.csv`);
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to export customers', error: error.message });
  }
};

export const bulkCustomerActionAdmin = async (req, res) => {
  try {
    const { action, ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No customer IDs provided' });
    }

    if (action === 'ACTIVATE') {
      await prisma.user.updateMany({ where: { id: { in: ids } }, data: { isBlocked: false } });
    } else if (action === 'DEACTIVATE') {
      await prisma.user.updateMany({ where: { id: { in: ids } }, data: { isBlocked: true } });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid bulk action type' });
    }

    return res.json({ success: true, message: `Bulk ${action} applied to ${ids.length} customer(s)` });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to execute bulk action', error: error.message });
  }
};

// Helper to recalculate average rating and review count of a product based on PUBLISHED reviews
const recalculateProductRating = async (productId) => {
  const reviews = await prisma.review.findMany({
    where: { productId, status: 'PUBLISHED' }
  });
  const count = reviews.length;
  const avgRating = count > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / count) : 0.0;
  
  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: parseFloat(avgRating.toFixed(1)),
      reviewCount: count
    }
  });
};

export const getReviewsAdmin = async (req, res) => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      productId = 'all',
      rating = 'all',
      status = 'all',
      startDate,
      endDate,
      sort = 'newest'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, parseInt(limit) || 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (rating && rating !== 'all') {
      where.rating = parseInt(rating);
    }

    if (productId && productId !== 'all') {
      where.productId = productId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { comment: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { product: { name: { contains: search, mode: 'insensitive' } } }
      ];

      // Support Order Number search
      if (search.startsWith('#') || search.length > 2) {
        const cleanSearch = search.replace('#', '');
        const orders = await prisma.order.findMany({
          where: { orderNumber: { contains: cleanSearch, mode: 'insensitive' } },
          include: { items: true }
        });
        if (orders.length > 0) {
          const userProductPairs = [];
          orders.forEach(o => {
            o.items.forEach(item => {
              userProductPairs.push({ userId: o.userId, productId: item.productId });
            });
          });
          if (userProductPairs.length > 0) {
            where.OR.push({
              OR: userProductPairs
            });
          }
        }
      }
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (sort === 'highest') {
      orderBy = { rating: 'desc' };
    } else if (sort === 'lowest') {
      orderBy = { rating: 'asc' };
    }

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          user: {
            include: {
              addresses: {
                where: { isDefault: true },
                take: 1
              }
            }
          },
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 }
            }
          }
        }
      })
    ]);

    // Format results to include purchase verification & order mapping
    const formattedReviews = await Promise.all(reviews.map(async (r) => {
      let location = null;
      let address = r.user?.addresses?.[0];
      if (!address) {
        // Fallback to first address if default doesn't exist
        const anyAddress = await prisma.address.findFirst({
          where: { userId: r.userId }
        });
        if (anyAddress) address = anyAddress;
      }
      if (address) {
        location = `${address.city}, ${address.state}`;
      }

      // Check if user actually ordered this product
      const orderItem = await prisma.orderItem.findFirst({
        where: {
          order: { userId: r.userId },
          productId: r.productId
        },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true
            }
          }
        }
      });

      return {
        id: r.id,
        userId: r.userId,
        productId: r.productId,
        variantInfo: r.variantInfo,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        helpfulCount: r.helpfulCount,
        status: r.status,
        createdAt: r.createdAt,
        user: {
          id: r.user?.id,
          firstName: r.user?.firstName || 'Anonymous',
          lastName: r.user?.lastName || '',
          email: r.user?.email || 'N/A',
          phone: r.user?.phone || 'N/A',
          avatar: r.user?.avatar || null,
          location
        },
        product: {
          id: r.product?.id,
          name: r.product?.name || 'Unknown Product',
          sku: r.product?.sku || 'N/A',
          image: r.product?.images?.[0]?.url || null,
          rating: r.product?.rating
        },
        isVerified: !!orderItem,
        orderId: orderItem?.order?.id || null,
        orderNumber: orderItem?.order?.orderNumber || null
      };
    }));

    return res.json({
      success: true,
      reviews: formattedReviews,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error.message });
  }
};

export const getReviewStatsAdmin = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const now = new Date();

    let start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    let end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const duration = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - duration - 1);
    const prevEnd = new Date(start.getTime() - 1);

    // Current metrics
    const [
      totalCurrent,
      approvedCurrent,
      pendingCurrent,
      rejectedCurrent
    ] = await Promise.all([
      prisma.review.count({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.review.count({ where: { status: 'PUBLISHED', createdAt: { gte: start, lte: end } } }),
      prisma.review.count({ where: { status: 'PENDING', createdAt: { gte: start, lte: end } } }),
      prisma.review.count({ where: { status: 'REJECTED', createdAt: { gte: start, lte: end } } })
    ]);

    // Previous metrics
    const [
      totalPrev,
      approvedPrev,
      pendingPrev,
      rejectedPrev
    ] = await Promise.all([
      prisma.review.count({ where: { createdAt: { gte: prevStart, lte: prevEnd } } }),
      prisma.review.count({ where: { status: 'PUBLISHED', createdAt: { gte: prevStart, lte: prevEnd } } }),
      prisma.review.count({ where: { status: 'PENDING', createdAt: { gte: prevStart, lte: prevEnd } } }),
      prisma.review.count({ where: { status: 'REJECTED', createdAt: { gte: prevStart, lte: prevEnd } } })
    ]);

    const getPctChange = (current, prev) => {
      if (!prev || prev === 0) return null;
      return parseFloat((((current - prev) / prev) * 100).toFixed(1));
    };

    return res.json({
      success: true,
      stats: {
        total: totalCurrent,
        totalChange: getPctChange(totalCurrent, totalPrev),
        approved: approvedCurrent,
        approvedChange: getPctChange(approvedCurrent, approvedPrev),
        pending: pendingCurrent,
        pendingChange: getPctChange(pendingCurrent, pendingPrev),
        rejected: rejectedCurrent,
        rejectedChange: getPctChange(rejectedCurrent, rejectedPrev)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch review statistics', error: error.message });
  }
};

export const updateReviewStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PUBLISHED', 'PENDING', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid review status value' });
    }

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: { status }
    });

    await recalculateProductRating(review.productId);

    return res.json({ success: true, message: `Review status updated to ${status} successfully`, review: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update review status', error: error.message });
  }
};

export const bulkReviewActionAdmin = async (req, res) => {
  try {
    const { action, ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No review IDs specified' });
    }

    const reviews = await prisma.review.findMany({
      where: { id: { in: ids } },
      select: { productId: true }
    });

    const uniqueProductIds = [...new Set(reviews.map(r => r.productId))];

    if (action === 'APPROVE') {
      await prisma.review.updateMany({
        where: { id: { in: ids } },
        data: { status: 'PUBLISHED' }
      });
    } else if (action === 'REJECT') {
      await prisma.review.updateMany({
        where: { id: { in: ids } },
        data: { status: 'REJECTED' }
      });
    } else if (action === 'DELETE') {
      await prisma.review.deleteMany({
        where: { id: { in: ids } }
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action type' });
    }

    await Promise.all(uniqueProductIds.map(pid => recalculateProductRating(pid)));

    return res.json({ success: true, message: `Bulk action ${action} executed successfully` });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to execute bulk action', error: error.message });
  }
};

export const exportReviewsAdmin = async (req, res) => {
  try {
    const { search, productId, rating, status, startDate, endDate } = req.query;

    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (rating && rating !== 'all') {
      where.rating = parseInt(rating);
    }
    if (productId && productId !== 'all') {
      where.productId = productId;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { comment: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { product: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        product: true
      }
    });

    const reviewsWithOrder = await Promise.all(reviews.map(async (r) => {
      const orderItem = await prisma.orderItem.findFirst({
        where: {
          order: { userId: r.userId },
          productId: r.productId
        },
        include: { order: { select: { orderNumber: true } } }
      });
      return {
        ...r,
        orderNumber: orderItem?.order?.orderNumber || 'N/A'
      };
    }));

    let csv = 'Review ID,Customer Name,Email,Product Name,Rating,Title,Comment,Status,Order Number,Date\n';
    reviewsWithOrder.forEach(r => {
      const name = `${r.user?.firstName || 'Anonymous'} ${r.user?.lastName || ''}`.trim().replace(/"/g, '""');
      const email = (r.user?.email || '').replace(/"/g, '""');
      const prodName = (r.product?.name || 'Unknown Product').replace(/"/g, '""');
      const title = (r.title || '').replace(/"/g, '""');
      const comment = (r.comment || '').replace(/\n/g, ' ').replace(/"/g, '""');
      const dateStr = r.createdAt.toISOString();

      csv += `"${r.id}","${name}","${email}","${prodName}",${r.rating},"${title}","${comment}","${r.status}","${r.orderNumber}","${dateStr}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=tnt-reviews-${Date.now()}.csv`);
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to export reviews', error: error.message });
  }
};

export const deleteReviewAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    await prisma.review.delete({ where: { id } });

    await recalculateProductRating(review.productId);

    return res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete review', error: error.message });
  }
};

const TAB_STATUS_MAP = {
  pending:    ['PENDING', 'CONFIRMED'],
  processing: ['PACKED'],
  shipped:    ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'],
  delivered:  ['DELIVERED'],
  cancelled:  ['CANCELLED', 'RETURNED', 'RETURN_REQUESTED', 'RETURN_STARTED', 'RETURNED_AND_REFUNDED'],
};

const VALID_TRANSITIONS = {
  PENDING:          ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:        ['PACKED', 'CANCELLED'],
  PACKED:           ['SHIPPED', 'CANCELLED'],
  SHIPPED:          ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT:       ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED:        ['RETURN_REQUESTED'],
  RETURN_REQUESTED: ['RETURN_STARTED', 'DELIVERED'],
  RETURN_STARTED:   ['RETURNED_AND_REFUNDED'],
  RETURNED_AND_REFUNDED: [],
  CANCELLED:        [],
  RETURNED:         [],
};

export const getOrdersAdmin = async (req, res) => {
  try {
    const {
      page = '1',
      limit = '8',
      search = '',
      status = 'all',
      payment = 'all',
      sort = 'newest',
      startDate,
      endDate
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, parseInt(limit) || 8);
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate)   where.createdAt.lte = new Date(endDate);
    }

    // Status filter (tab mapping)
    if (status && status !== 'all') {
      const statuses = TAB_STATUS_MAP[status.toLowerCase()];
      if (statuses) where.orderStatus = { in: statuses };
    }

    // Payment method filter
    if (payment && payment !== 'all') {
      const isCod = payment.toLowerCase() === 'cod';
      where.payment = {
        paymentMethod: isCod
          ? { contains: 'COD', mode: 'insensitive' }
          : { not: { contains: 'COD', mode: 'insensitive' } }
      };
    }

    // Search filter
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName:  { contains: search, mode: 'insensitive' } } },
        { user: { email:     { contains: search, mode: 'insensitive' } } },
        { user: { phone:     { contains: search, mode: 'insensitive' } } },
      ];
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'oldest')  orderBy = { createdAt: 'asc' };
    if (sort === 'highest') orderBy = { totalAmount: 'desc' };
    if (sort === 'lowest')  orderBy = { totalAmount: 'asc' };

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true } },
          address: true,
          payment: true,
          tracking: true,
          items: {
            include: {
              product: { select: { images: { where: { isPrimary: true }, take: 1 } } }
            }
          }
        }
      })
    ]);

    return res.json({
      success: true,
      orders,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch admin orders', error: error.message });
  }
};

export const getOrderStatsAdmin = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const now = new Date();
    let start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    let end   = endDate   ? new Date(endDate)   : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const duration  = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - duration - 1);
    const prevEnd   = new Date(start.getTime() - 1);

    const dateFilter      = { createdAt: { gte: start, lte: end } };
    const prevDateFilter  = { createdAt: { gte: prevStart, lte: prevEnd } };

    const [
      totalCur,    totalPrev,
      pendingCur,  pendingPrev,
      shippedCur,  shippedPrev,
      delivCur,    delivPrev,
      cancelCur,   cancelPrev
    ] = await Promise.all([
      prisma.order.count({ where: { ...dateFilter } }),
      prisma.order.count({ where: { ...prevDateFilter } }),
      prisma.order.count({ where: { ...dateFilter,     orderStatus: { in: ['PENDING','CONFIRMED'] } } }),
      prisma.order.count({ where: { ...prevDateFilter, orderStatus: { in: ['PENDING','CONFIRMED'] } } }),
      prisma.order.count({ where: { ...dateFilter,     orderStatus: { in: ['SHIPPED','IN_TRANSIT','OUT_FOR_DELIVERY'] } } }),
      prisma.order.count({ where: { ...prevDateFilter, orderStatus: { in: ['SHIPPED','IN_TRANSIT','OUT_FOR_DELIVERY'] } } }),
      prisma.order.count({ where: { ...dateFilter,     orderStatus: 'DELIVERED' } }),
      prisma.order.count({ where: { ...prevDateFilter, orderStatus: 'DELIVERED' } }),
      prisma.order.count({ where: { ...dateFilter,     orderStatus: { in: ['CANCELLED','RETURNED'] } } }),
      prisma.order.count({ where: { ...prevDateFilter, orderStatus: { in: ['CANCELLED','RETURNED'] } } }),
    ]);

    const chg = (cur, prev) => prev === 0 ? null : parseFloat((((cur - prev) / prev) * 100).toFixed(1));

    return res.json({
      success: true,
      stats: {
        totalOrders:    totalCur,   totalOrdersChange:    chg(totalCur, totalPrev),
        pendingOrders:  pendingCur, pendingOrdersChange:  chg(pendingCur, pendingPrev),
        shippedOrders:  shippedCur, shippedOrdersChange:  chg(shippedCur, shippedPrev),
        deliveredOrders:delivCur,   deliveredOrdersChange: chg(delivCur, delivPrev),
        cancelledOrders:cancelCur,  cancelledOrdersChange: chg(cancelCur, cancelPrev),
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch order statistics', error: error.message });
  }
};

export const getOrderTabCountsAdmin = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate)   dateFilter.createdAt.lte = new Date(endDate);
    }

    const [all, pending, processing, shipped, delivered, cancelled] = await Promise.all([
      prisma.order.count({ where: { ...dateFilter } }),
      prisma.order.count({ where: { ...dateFilter, orderStatus: { in: ['PENDING','CONFIRMED'] } } }),
      prisma.order.count({ where: { ...dateFilter, orderStatus: 'PACKED' } }),
      prisma.order.count({ where: { ...dateFilter, orderStatus: { in: ['SHIPPED','IN_TRANSIT','OUT_FOR_DELIVERY'] } } }),
      prisma.order.count({ where: { ...dateFilter, orderStatus: 'DELIVERED' } }),
      prisma.order.count({ where: { ...dateFilter, orderStatus: { in: ['CANCELLED','RETURNED'] } } }),
    ]);

    return res.json({ success: true, counts: { all, pending, processing, shipped, delivered, cancelled } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch tab counts', error: error.message });
  }
};

export const getOrderByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true } },
        address: true,
        payment: true,
        tracking: true,
        items: {
          include: {
            product: {
              select: {
                id: true, name: true, sku: true,
                images: { where: { isPrimary: true }, take: 1 }
              }
            },
            productVariant: { select: { id: true, sku: true } }
          }
        }
      }
    });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Parse timeline from tracking.logs
    let timeline = [];
    if (order.tracking?.logs) {
      try { timeline = JSON.parse(order.tracking.logs); } catch { timeline = []; }
    }

    return res.json({
      success: true,
      order: { ...order, timeline }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch order', error: error.message });
  }
};

export const exportOrdersAdmin = async (req, res) => {
  try {
    const { search = '', status = 'all', payment = 'all', startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate)   where.createdAt.lte = new Date(endDate);
    }
    if (status && status !== 'all') {
      const statuses = TAB_STATUS_MAP[status.toLowerCase()];
      if (statuses) where.orderStatus = { in: statuses };
    }
    if (payment && payment !== 'all') {
      const isCod = payment.toLowerCase() === 'cod';
      where.payment = {
        paymentMethod: isCod
          ? { contains: 'COD', mode: 'insensitive' }
          : { not: { contains: 'COD', mode: 'insensitive' } }
      };
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { email:     { contains: search, mode: 'insensitive' } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        payment: true
      }
    });

    let csv = 'Order Number,Customer,Email,Phone,Date,Subtotal,Shipping,Tax,Discount,Total,Payment Method,Payment Status,Order Status\n';
    orders.forEach(o => {
      const name   = `${o.user?.firstName || ''} ${o.user?.lastName || ''}`.trim().replace(/"/g, '""');
      const email  = (o.user?.email  || 'N/A').replace(/"/g, '""');
      const phone  = (o.user?.phone  || 'N/A').replace(/"/g, '""');
      const date   = new Date(o.createdAt).toISOString().split('T')[0];
      csv += `"${o.orderNumber}","${name}","${email}","${phone}","${date}",${o.subtotal.toFixed(2)},${o.shippingFee.toFixed(2)},${o.taxAmount.toFixed(2)},${o.discountAmount.toFixed(2)},${o.totalAmount.toFixed(2)},"${o.payment?.paymentMethod || 'N/A'}","${o.paymentStatus}","${o.orderStatus}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=tnt-orders-${Date.now()}.csv`);
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to export orders', error: error.message });
  }
};

export const createOrderAdmin = async (req, res) => {
  try {
    const { customerId, addressId, items, paymentMethod = 'COD', couponCode } = req.body;

    if (!customerId || !addressId || !items?.length) {
      return res.status(400).json({ success: false, message: 'Customer, address, and at least one item are required' });
    }

    // Validate customer
    const customer = await prisma.user.findUnique({ where: { id: customerId } });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    // Validate address belongs to customer
    const address = await prisma.address.findFirst({ where: { id: addressId, userId: customerId } });
    if (!address) return res.status(404).json({ success: false, message: 'Address not found for this customer' });

    // Validate and price items from DB (backend is authoritative)
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: true }
      });
      if (!variant) return res.status(404).json({ success: false, message: `Variant ${item.variantId} not found` });
      if (variant.stock < item.quantity) return res.status(400).json({ success: false, message: `Insufficient stock for ${variant.product.name}` });

      const salePrice = variant.salePrice || variant.price;
      const lineTotal = salePrice * item.quantity;
      subtotal += lineTotal;
      orderItems.push({
        productId: variant.productId,
        productVariantId: variant.id,
        productName: variant.product.name,
        variantInfo: JSON.stringify({ size: variant.size, color: variant.color }),
        price: salePrice,
        quantity: item.quantity,
        totalPrice: lineTotal
      });
    }

    // Coupon discount
    let discountAmount = 0;
    let validCouponCode = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: { code: couponCode, isActive: true, validFrom: { lte: new Date() }, validTill: { gte: new Date() } }
      });
      if (coupon && subtotal >= coupon.minOrderAmount) {
        if (coupon.couponType === 'PERCENTAGE') {
          discountAmount = Math.min(subtotal * (coupon.discountValue / 100), coupon.maxDiscount || Infinity);
        } else if (coupon.couponType === 'FLAT') {
          discountAmount = Math.min(coupon.discountValue, subtotal);
        } else if (coupon.couponType === 'FREE_SHIPPING') {
          discountAmount = 0; // handled via shippingFee
        }
        discountAmount = parseFloat(discountAmount.toFixed(2));
        validCouponCode = coupon.code;
      }
    }

    // Shipping fee (free over ₹499)
    const shippingFee = (subtotal - discountAmount) >= 499 ? 0 : 99;

    // Tax (18% GST on taxable amount after discount)
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = parseFloat((taxableAmount * 0.18).toFixed(2));

    const totalAmount = parseFloat((subtotal - discountAmount + shippingFee + taxAmount).toFixed(2));

    // Generate order number
    const orderCount = await prisma.order.count();
    const orderNumber = `TNT-${String(orderCount + 1001).padStart(4, '0')}`;

    // Create order with all related records
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: customerId,
        addressId,
        subtotal,
        discountAmount,
        shippingFee,
        taxAmount,
        totalAmount,
        orderStatus: 'CONFIRMED',
        paymentStatus: paymentMethod.toUpperCase().includes('COD') ? 'PENDING' : 'SUCCESS',
        couponCode: validCouponCode,
        items: { create: orderItems },
        payment: {
          create: {
            paymentMethod,
            transactionId: `ADMIN-${Date.now()}`,
            amount: totalAmount,
            status: paymentMethod.toUpperCase().includes('COD') ? 'PENDING' : 'SUCCESS'
          }
        },
        tracking: {
          create: {
            trackingNumber: `TNT-TRK-${Date.now()}`,
            currentStatus: 'CONFIRMED',
            logs: JSON.stringify([{ status: 'CONFIRMED', time: new Date().toLocaleString(), note: 'Order created by admin' }])
          }
        }
      },
      include: { items: true, payment: true, tracking: true }
    });

    // Decrement stock
    for (const item of orderItems) {
      await prisma.productVariant.update({
        where: { id: item.productVariantId },
        data: { stock: { decrement: item.quantity } }
      });
    }

    return res.status(201).json({ success: true, message: 'Order created successfully', order });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
  }
};

export const updateOrderStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, courierPartner, trackingNumber } = req.body;

    // Validate status value
    const validStatuses = Object.keys(VALID_TRANSITIONS);
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
    }

    // Fetch current order status
    const currentOrder = await prisma.order.findUnique({ where: { id }, select: { orderStatus: true } });
    if (!currentOrder) return res.status(404).json({ success: false, message: 'Order not found' });

    // Validate transition
    const allowedNext = VALID_TRANSITIONS[currentOrder.orderStatus] || [];
    if (!allowedNext.includes(status) && currentOrder.orderStatus !== status) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from ${currentOrder.orderStatus} to ${status}. Allowed: ${allowedNext.join(', ') || 'none'}`
      });
    }

    const updateData = { orderStatus: status };
    if (status === 'DELIVERED') {
      updateData.paymentStatus = 'SUCCESS';
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: { user: true }
    });


    const tracking = await prisma.orderTracking.findUnique({ where: { orderId: id } });
    let logs = [];
    if (tracking && tracking.logs) {
      try {
        logs = JSON.parse(tracking.logs);
      } catch {
        logs = [];
      }
    }
    logs.push({ status, time: new Date().toLocaleString(), ...(note ? { note } : {}) });

    const trackingUpdate = {
      currentStatus: status,
      logs: JSON.stringify(logs),
      deliveredAt: status === 'DELIVERED' ? new Date() : undefined
    };
    if (courierPartner) trackingUpdate.courierPartner = courierPartner;
    if (trackingNumber) trackingUpdate.trackingNumber = trackingNumber;

    await prisma.orderTracking.upsert({
      where: { orderId: id },
      update: trackingUpdate,
      create: {
        orderId: id,
        courierPartner: courierPartner || 'Delhivery',
        trackingNumber: trackingNumber || `TNT-TRK-${Date.now()}`,
        currentStatus: status,
        logs: JSON.stringify(logs),
        deliveredAt: status === 'DELIVERED' ? new Date() : undefined
      }
    });

    await sendEmail({
      to: order.user.email,
      subject: `Order Update: #${order.orderNumber} is now ${status}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #111111;">
          <h2 style="border-bottom: 2px solid #111111; padding-bottom: 10px;">TNT LUXURY CLOTHING</h2>
          <p>Dear ${order.user.firstName},</p>
          <p>Your order <strong>#${order.orderNumber}</strong> status is updated: <strong>${status}</strong>.</p>
          <p>Thank you for shopping with us!</p>
        </div>
      `
    });

    return res.json({ success: true, message: 'Order status updated and customer notified!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
};

export const updateOrderTrackingAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { courierPartner, trackingNumber } = req.body;

    const order = await prisma.order.findUnique({ where: { id }, include: { user: true } });

    await prisma.orderTracking.upsert({
      where: { orderId: id },
      update: { courierPartner, trackingNumber },
      create: { orderId: id, courierPartner, trackingNumber, currentStatus: order.orderStatus }
    });

    await sendEmail({
      to: order.user.email,
      subject: `Order Shipped: Track your TNT Package #${order.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #111111;">
          <h2 style="border-bottom: 2px solid #111111; padding-bottom: 10px;">TNT LUXURY CLOTHING</h2>
          <p>Dear ${order.user.firstName},</p>
          <p>Your order <strong>#${order.orderNumber}</strong> has been shipped with <strong>${courierPartner}</strong>.</p>
          <p>Tracking Number: <strong>${trackingNumber}</strong></p>
          <p>Thank you for shopping with us!</p>
        </div>
      `
    });

    return res.json({ success: true, message: 'Order tracking updated and customer notified!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update tracking', error: error.message });
  }
};

export const updateCustomerAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, rewardPoints, roleId, isBlocked } = req.body;
    const customer = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phone,
        rewardPoints: rewardPoints !== undefined ? parseInt(rewardPoints || '0') : undefined,
        roleId: roleId || undefined,
        isBlocked: isBlocked !== undefined ? Boolean(isBlocked) : undefined
      }
    });
    return res.json({ success: true, message: 'Customer profile updated successfully', customer });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update customer', error: error.message });
  }
};

export const deleteCustomerAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    return res.json({ success: true, message: 'Customer user account deleted from database' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete customer', error: error.message });
  }
};

export const sendBlastEmailAdmin = async (req, res) => {
  try {
    const { userId, subject, content, imageUrl } = req.body;

    let recipients = [];
    if (userId === 'all') {
      const customers = await prisma.user.findMany({
        where: { role: { name: 'CUSTOMER' } },
        select: { email: true }
      });
      recipients = customers.map(c => c.email);
    } else {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) recipients = [user.email];
    }

    if (recipients.length === 0) {
      return res.status(400).json({ success: false, message: 'No recipients found' });
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 25px; border: 1px solid #e5e5e7; max-width: 600px; margin: 0 auto; color: #111111;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px;">
          <span style="font-size: 24px; font-weight: 900; letter-spacing: -1px;">TNT LUXURY STREETWEAR</span>
        </div>
        <div style="font-size: 14px; line-height: 1.6; margin-bottom: 20px; white-space: pre-line;">
          ${content}
        </div>
        ${imageUrl ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${imageUrl}" alt="Promo Banner" style="max-width: 100%; border-radius: 8px;" /></div>` : ''}
        <div style="border-top: 1px solid #e5e5e7; padding-top: 15px; text-align: center; font-size: 10px; color: #6b6b6b;">
          You received this email because you are a registered customer of TNT Clothing.
        </div>
      </div>
    `;

    for (const email of recipients) {
      await sendEmail({ to: email, subject, html: emailHtml });
    }

    return res.json({ success: true, message: `Email broadcast dispatched to ${recipients.length} user(s)!` });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to broadcast email', error: error.message });
  }
};

export const getReturnsAdmin = async (req, res) => {
  try {
    const returns = await prisma.return.findMany({
      include: {
        order: true,
        user: { select: { firstName: true, lastName: true, email: true } },
        items: { include: { productVariant: { include: { product: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, returns });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch returns', error: error.message });
  }
};

export const updateReturnRequestAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const returnRequest = await prisma.return.findUnique({
      where: { id },
      include: {
        order: { include: { payment: true } },
        items: true,
        user: true
      }
    });

    if (!returnRequest) {
      return res.status(404).json({ success: false, message: 'Return request not found' });
    }

    const updatedReturn = await prisma.return.update({
      where: { id },
      data: { status }
    });

    let orderStatusUpdate = null;
    if (status === 'APPROVED') {
      orderStatusUpdate = 'RETURN_STARTED';
    } else if (status === 'REJECTED') {
      orderStatusUpdate = 'DELIVERED';
    } else if (status === 'COMPLETED') {
      orderStatusUpdate = 'RETURNED_AND_REFUNDED';

      // Replenish stock
      for (const item of returnRequest.items) {
        await prisma.productVariant.update({
          where: { id: item.productVariantId },
          data: { stock: { increment: item.quantity } }
        });
      }

      // Record refund in DB
      if (returnRequest.order?.payment?.id) {
        await prisma.refund.upsert({
          where: { returnId: returnRequest.id },
          create: {
            paymentId: returnRequest.order.payment.id,
            returnId: returnRequest.id,
            amount: returnRequest.order.totalAmount,
            status: 'PROCESSED'
          },
          update: {
            status: 'PROCESSED'
          }
        });

        // Update paymentStatus to REFUNDED
        await prisma.order.update({
          where: { id: returnRequest.orderId },
          data: { paymentStatus: 'REFUNDED' }
        });
      }

      // Send Refund Email
      await sendEmail({
        to: returnRequest.user.email,
        subject: `TNT Refund Processed: Order #${returnRequest.order.orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #111111;">
            <h2 style="border-bottom: 2px solid #111111; padding-bottom: 10px;">TNT LUXURY CLOTHING</h2>
            <p>Dear ${returnRequest.user.firstName},</p>
            <p>We are writing to inform you that your return request for order <strong>#${returnRequest.order.orderNumber}</strong> has been processed and your refund of <strong>₹${returnRequest.order.totalAmount.toLocaleString()}</strong> has been completed.</p>
            <p>Thank you for shopping with us!</p>
          </div>
        `
      });
    }

    if (orderStatusUpdate) {
      await prisma.order.update({
        where: { id: returnRequest.orderId },
        data: { orderStatus: orderStatusUpdate }
      });
    }

    return res.json({ success: true, message: `Return request marked as ${status}`, updatedReturn });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update return request', error: error.message });
  }
};

export const updateCategoryAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, showOnHomepage, displayOrder, homepageImage, bannerImage, cardImage, featured, status } = req.body;
    
    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined;
    
    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        showOnHomepage,
        displayOrder,
        homepageImage,
        bannerImage,
        cardImage,
        featured,
        status
      }
    });
    return res.json({ success: true, message: 'Category updated successfully', category });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update category', error: error.message });
  }
};

export const deleteCategoryAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has products
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (category._count.products > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category "${category.name}". It contains ${category._count.products} products.`
      });
    }

    await prisma.category.delete({ where: { id } });
    return res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete category', error: error.message });
  }
};

// Staff Management Controllers
export const getStaffAdmin = async (req, res) => {
  try {
    const { search, department, role, status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Base where clause to select only staff members
    const where = {
      role: {
        name: {
          in: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPPORT']
        }
      },
      deletedAt: null
    };

    // Apply search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Apply department filter
    if (department && department !== 'All Departments') {
      where.department = { equals: department, mode: 'insensitive' };
    }

    // Apply role filter
    if (role && role !== 'All Roles') {
      where.role = {
        name: { equals: role }
      };
    }

    // Apply status filter
    if (status && status !== 'All Status' && status !== 'all') {
      where.isBlocked = status === 'inactive';
    }

    // Resolve sorting order
    let orderBy = {};
    if (sortBy === 'role') {
      orderBy = { role: { name: sortOrder } };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    const [staff, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { role: true },
        orderBy,
        skip,
        take: limitNum
      }),
      prisma.user.count({ where })
    ]);

    // Fetch aggregated KPIs from database (all staff count)
    const kpis = await prisma.user.aggregate({
      where: {
        role: { name: { in: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPPORT'] } },
        deletedAt: null
      },
      _count: {
        _all: true
      }
    });
    
    const totalStaff = kpis._count._all;
    const activeStaff = await prisma.user.count({
      where: {
        role: { name: { in: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPPORT'] } },
        deletedAt: null,
        isBlocked: false
      }
    });
    const inactiveStaff = totalStaff - activeStaff;

    return res.json({ 
      success: true, 
      staff, 
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      kpis: {
        totalStaff,
        activeStaff,
        inactiveStaff
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch staff members', error: error.message });
  }
};

export const createStaffAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, roleId, password, department, isBlocked } = req.body;
    if (!firstName || !email || !password || !roleId) {
      return res.status(400).json({ success: false, message: 'Missing required staff fields' });
    }
    const { default: bcrypt } = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);
    const staff = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        passwordHash,
        isVerified: true,
        roleId,
        department: department || 'Operations',
        isBlocked: isBlocked === true
      },
      include: { role: true }
    });
    return res.status(201).json({ success: true, message: 'Staff member created successfully', staff });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create staff member', error: error.message });
  }
};

export const updateStaffAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, roleId, password, department, isBlocked } = req.body;
    const data = { 
      firstName, 
      lastName, 
      email, 
      phone, 
      roleId,
      department: department !== undefined ? department : undefined,
      isBlocked: isBlocked !== undefined ? Boolean(isBlocked) : undefined
    };
    if (password) {
      const { default: bcrypt } = await import('bcryptjs');
      data.passwordHash = await bcrypt.hash(password, 10);
    }
    const staff = await prisma.user.update({
      where: { id },
      data,
      include: { role: true }
    });
    return res.json({ success: true, message: 'Staff member profile updated successfully', staff });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update staff member', error: error.message });
  }
};

export const deleteStaffAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.id === id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }
    await prisma.user.delete({ where: { id } });
    return res.json({ success: true, message: 'Staff member deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete staff member', error: error.message });
  }
};

// Roles & Permissions Controllers
// Roles & Permissions Controllers
const ensureDefaultPermissions = async () => {
  const defaultGroups = [
    { name: 'Dashboard', description: 'Access to system analytics, metrics and business charts' },
    { name: 'Product Management', description: 'Manage products, collections, categories, sizes and colors' },
    { name: 'Order Management', description: 'Track customer orders, process shipping status and issue returns' },
    { name: 'Customer Management', description: 'View customers profiles, reward point balances and details' },
    { name: 'Inventory Management', description: 'Monitor stocks, warehouses and restock item alerts' },
    { name: 'Content Management', description: 'Manage homepage banners, trust features, CMS blogs and reviews' },
    { name: 'Marketing & Promotions', description: 'Manage campaigns, newsletters and promo coupons' },
    { name: 'System Management', description: 'Configure settings, access audit logs and manage administrative staff' }
  ];

  const groupMap = {};
  for (const g of defaultGroups) {
    const groupRecord = await prisma.permissionGroup.upsert({
      where: { name: g.name },
      update: { description: g.description },
      create: { name: g.name, description: g.description }
    });
    groupMap[g.name] = groupRecord.id;
  }

  const defaultPermissions = [
    // Dashboard
    { name: 'view_dashboard', description: 'Can View Dashboard', group: 'Dashboard' },
    
    // Product Management
    { name: 'view_products', description: 'Can View Products', group: 'Product Management' },
    { name: 'create_products', description: 'Can Create Products', group: 'Product Management' },
    { name: 'edit_products', description: 'Can Edit Products', group: 'Product Management' },
    { name: 'delete_products', description: 'Can Delete Products', group: 'Product Management' },
    { name: 'view_categories', description: 'Can View Categories', group: 'Product Management' },
    { name: 'create_categories', description: 'Can Create Categories', group: 'Product Management' },
    { name: 'edit_categories', description: 'Can Edit Categories', group: 'Product Management' },
    { name: 'delete_categories', description: 'Can Delete Categories', group: 'Product Management' },

    // Order Management
    { name: 'view_orders', description: 'Can View Orders', group: 'Order Management' },
    { name: 'update_orders', description: 'Can Update Orders', group: 'Order Management' },
    { name: 'cancel_orders', description: 'Can Cancel Orders', group: 'Order Management' },
    { name: 'refund_orders', description: 'Can Refund Orders', group: 'Order Management' },

    // Customer Management
    { name: 'view_customers', description: 'Can View Customers', group: 'Customer Management' },
    { name: 'edit_customers', description: 'Can Edit Customers', group: 'Customer Management' },
    { name: 'delete_customers', description: 'Can Delete Customers', group: 'Customer Management' },

    // Inventory Management
    { name: 'view_inventory', description: 'Can View Inventory', group: 'Inventory Management' },
    { name: 'edit_inventory', description: 'Can Edit Inventory', group: 'Inventory Management' },

    // Content Management
    { name: 'view_reviews', description: 'Can View Reviews', group: 'Content Management' },
    { name: 'approve_reviews', description: 'Can Approve Reviews', group: 'Content Management' },
    { name: 'reject_reviews', description: 'Can Reject Reviews', group: 'Content Management' },
    { name: 'delete_reviews', description: 'Can Delete Reviews', group: 'Content Management' },
    { name: 'edit_homepage', description: 'Can Edit Homepage CMS', group: 'Content Management' },

    // Marketing & Promotions
    { name: 'view_coupons', description: 'Can View Coupons', group: 'Marketing & Promotions' },
    { name: 'create_coupons', description: 'Can Create Coupons', group: 'Marketing & Promotions' },
    { name: 'edit_coupons', description: 'Can Edit Coupons', group: 'Marketing & Promotions' },
    { name: 'delete_coupons', description: 'Can Delete Coupons', group: 'Marketing & Promotions' },

    // System Management
    { name: 'view_staff', description: 'Can View Staff', group: 'System Management' },
    { name: 'create_staff', description: 'Can Create Staff', group: 'System Management' },
    { name: 'edit_staff', description: 'Can Edit Staff', group: 'System Management' },
    { name: 'delete_staff', description: 'Can Delete Staff', group: 'System Management' },
    { name: 'view_roles', description: 'Can View Roles', group: 'System Management' },
    { name: 'create_roles', description: 'Can Create Roles', group: 'System Management' },
    { name: 'edit_roles', description: 'Can Edit Roles', group: 'System Management' },
    { name: 'delete_roles', description: 'Can Delete Roles', group: 'System Management' },
    { name: 'manage_permissions', description: 'Can Manage Permissions', group: 'System Management' },
    { name: 'assign_roles', description: 'Can Assign Roles', group: 'System Management' },
    { name: 'view_settings', description: 'Can View Settings', group: 'System Management' },
    { name: 'edit_settings', description: 'Can Edit Settings', group: 'System Management' },
    { name: 'view_reports', description: 'Can View Reports', group: 'System Management' },
    { name: 'export_reports', description: 'Can Export Reports', group: 'System Management' },
    { name: 'view_audit_logs', description: 'Can View Audit Logs', group: 'System Management' },
    { name: 'view_media', description: 'Can View Media', group: 'System Management' },
    { name: 'upload_media', description: 'Can Upload Media', group: 'System Management' },
    { name: 'edit_media', description: 'Can Edit Media', group: 'System Management' },
    { name: 'delete_media', description: 'Can Delete Media', group: 'System Management' }
  ];

  for (const perm of defaultPermissions) {
    const groupId = groupMap[perm.group] || null;
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description, groupId },
      create: { name: perm.name, description: perm.description, groupId }
    });
  }

  // Ensure default roles exist as text values
  const defaultRoles = [
    { name: 'SUPER_ADMIN', description: 'Super Administrator with absolute control over staff and settings' },
    { name: 'ADMIN', description: 'Manage all modules and settings except role management' },
    { name: 'MANAGER', description: 'Manage store operations, orders, customers and content' },
    { name: 'SUPPORT', description: 'Handle customer queries, orders and reviews' },
    { name: 'CUSTOMER', description: 'Standard Customer Account' }
  ];

  for (const dr of defaultRoles) {
    const roleExist = await prisma.role.findUnique({ where: { name: dr.name } });
    if (!roleExist) {
      await prisma.role.create({
        data: { name: dr.name, description: dr.description, status: 'ACTIVE' }
      });
    }
  }

  // Auto connect all permissions to SUPER_ADMIN role for security
  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'SUPER_ADMIN' },
    include: { permissions: true }
  });
  if (superAdminRole) {
    const allPerms = await prisma.permission.findMany();
    await prisma.role.update({
      where: { id: superAdminRole.id },
      data: {
        permissions: {
          set: [],
          connect: allPerms.map(p => ({ id: p.id }))
        }
      }
    });
  }
};

export const getRolesAdmin = async (req, res) => {
  try {
    await ensureDefaultPermissions();
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: { group: true }
        },
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    return res.json({ success: true, roles });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch roles', error: error.message });
  }
};

export const createRoleAdmin = async (req, res) => {
  try {
    const { name, description, status, groupIds = [], permissionIds = [] } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Role name is required' });
    }
    const cleanName = name.trim().toUpperCase().replace(/\s+/g, '_');

    // Check duplicate
    const existing = await prisma.role.findUnique({ where: { name: cleanName } });
    if (existing) {
      return res.status(400).json({ success: false, message: `Role name "${name}" already exists` });
    }

    // Determine target permissions
    let finalPermIds = [...permissionIds];
    if (groupIds.length > 0) {
      const groupPerms = await prisma.permission.findMany({
        where: { groupId: { in: groupIds } },
        select: { id: true }
      });
      finalPermIds = Array.from(new Set([...finalPermIds, ...groupPerms.map(p => p.id)]));
    }

    const role = await prisma.role.create({
      data: {
        name: cleanName,
        description,
        status: status || 'ACTIVE',
        permissions: {
          connect: finalPermIds.map(pid => ({ id: pid }))
        }
      },
      include: { permissions: true }
    });

    return res.status(201).json({ success: true, message: 'Role created successfully', role });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create role', error: error.message });
  }
};

export const updateRoleAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, groupIds, permissionIds } = req.body;

    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    if (role.name === 'SUPER_ADMIN') {
      if (status && status !== 'ACTIVE') {
        return res.status(400).json({ success: false, message: 'SUPER_ADMIN role cannot be deactivated' });
      }
    }

    let updateData = {
      description,
      status: status || undefined
    };

    if (name && role.name !== 'SUPER_ADMIN') {
      const cleanName = name.trim().toUpperCase().replace(/\s+/g, '_');
      if (cleanName !== role.name) {
        const dup = await prisma.role.findUnique({ where: { name: cleanName } });
        if (dup) {
          return res.status(400).json({ success: false, message: `Role name "${name}" already exists` });
        }
        updateData.name = cleanName;
      }
    }

    if (groupIds !== undefined || permissionIds !== undefined) {
      if (role.name === 'SUPER_ADMIN') {
        // Absolute protect
        const allPerms = await prisma.permission.findMany();
        updateData.permissions = {
          set: [],
          connect: allPerms.map(p => ({ id: p.id }))
        };
      } else {
        let finalPermIds = permissionIds || [];
        if (groupIds && groupIds.length > 0) {
          const groupPerms = await prisma.permission.findMany({
            where: { groupId: { in: groupIds } },
            select: { id: true }
          });
          finalPermIds = Array.from(new Set([...finalPermIds, ...groupPerms.map(p => p.id)]));
        }
        updateData.permissions = {
          set: [],
          connect: finalPermIds.map(pid => ({ id: pid }))
        };
      }
    }

    const updatedRole = await prisma.role.update({
      where: { id },
      data: updateData,
      include: { permissions: true }
    });

    return res.json({ success: true, message: 'Role updated successfully', role: updatedRole });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update role', error: error.message });
  }
};

export const deleteRoleAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true } }
      }
    });

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    if (role.name === 'SUPER_ADMIN') {
      return res.status(400).json({ success: false, message: 'SUPER_ADMIN role cannot be deleted' });
    }

    if (role._count.users > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role "${role.name}" because it is currently assigned to ${role._count.users} staff members.`
      });
    }

    await prisma.role.delete({ where: { id } });
    return res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete role', error: error.message });
  }
};

export const getPermissionsAdmin = async (req, res) => {
  try {
    await ensureDefaultPermissions();
    const permissions = await prisma.permission.findMany({
      include: { group: true }
    });
    return res.json({ success: true, permissions });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch permissions', error: error.message });
  }
};

export const updateRolePermissionsAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissionKeys } = req.body;

    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    if (role.name === 'SUPER_ADMIN') {
      return res.status(400).json({ success: false, message: 'SUPER_ADMIN permissions are absolute and cannot be modified' });
    }

    const perms = await prisma.permission.findMany({
      where: { name: { in: permissionKeys } }
    });

    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        permissions: {
          set: [],
          connect: perms.map(p => ({ id: p.id }))
        }
      },
      include: { permissions: true }
    });
    return res.json({ success: true, message: 'Role permissions updated successfully', role: updatedRole });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update role permissions', error: error.message });
  }
};

// Permission Groups Controllers
export const getPermissionGroupsAdmin = async (req, res) => {
  try {
    const groups = await prisma.permissionGroup.findMany({
      include: {
        permissions: true
      },
      orderBy: { name: 'asc' }
    });
    return res.json({ success: true, groups });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch permission groups', error: error.message });
  }
};

export const createPermissionGroupAdmin = async (req, res) => {
  try {
    const { name, description, permissionIds = [] } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }

    const existing = await prisma.permissionGroup.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ success: false, message: `Group name "${name}" already exists` });
    }

    const group = await prisma.permissionGroup.create({
      data: {
        name,
        description,
        permissions: {
          connect: permissionIds.map(pid => ({ id: pid }))
        }
      },
      include: { permissions: true }
    });

    return res.status(201).json({ success: true, message: 'Permission group created successfully', group });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create permission group', error: error.message });
  }
};

export const updatePermissionGroupAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissionIds } = req.body;

    const group = await prisma.permissionGroup.findUnique({ where: { id } });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Permission group not found' });
    }

    let updateData = { name, description };
    if (permissionIds !== undefined) {
      // First disconnect all permissions in this group
      await prisma.permission.updateMany({
        where: { groupId: id },
        data: { groupId: null }
      });
      // Link new ones
      if (permissionIds.length > 0) {
        updateData.permissions = {
          connect: permissionIds.map(pid => ({ id: pid }))
        };
      }
    }

    const updatedGroup = await prisma.permissionGroup.update({
      where: { id },
      data: updateData,
      include: { permissions: true }
    });

    return res.json({ success: true, message: 'Permission group updated successfully', group: updatedGroup });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update permission group', error: error.message });
  }
};

export const deletePermissionGroupAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Disconnect permissions
    await prisma.permission.updateMany({
      where: { groupId: id },
      data: { groupId: null }
    });

    await prisma.permissionGroup.delete({ where: { id } });
    return res.json({ success: true, message: 'Permission group deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete permission group', error: error.message });
  }
};

// Staff Role Assignment Controller
export const updateStaffRoleAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;

    if (!roleId) {
      return res.status(400).json({ success: false, message: 'Role ID is required' });
    }

    const staffUser = await prisma.user.findUnique({
      where: { id },
      include: { role: true }
    });

    if (!staffUser) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    // Safety check: Cannot alter Super Admin user role easily
    if (staffUser.role.name === 'SUPER_ADMIN' && req.user.id !== staffUser.id) {
      return res.status(400).json({ success: false, message: 'You cannot change the role of another SUPER_ADMIN' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { roleId },
      include: { role: true }
    });

    return res.json({ success: true, message: 'Staff member role updated successfully', user: updatedUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update staff role', error: error.message });
  }
};

// Import Permissions Controller
export const importPermissionsAdmin = async (req, res) => {
  try {
    await ensureDefaultPermissions();
    const permissions = await prisma.permission.findMany({
      include: { group: true }
    });
    return res.json({
      success: true,
      message: 'Permissions synchronized successfully.',
      count: permissions.length
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to sync permissions', error: error.message });
  }
};
// Helper for logging audit events
export const logAuditEvent = async (user, action, target, req) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const userName = typeof user === 'string' ? user : `${user.firstName} ${user.lastName || ''} (${user.email})`;
    await prisma.auditLog.create({
      data: {
        user: userName,
        userId: user?.id || null,
        action,
        target,
        ip: typeof ip === 'string' ? ip : '127.0.0.1'
      }
    });
  } catch (err) {
    console.error('Failed to log audit event:', err.message);
  }
};

export const getSettingsAdmin = async (req, res) => {
  try {
    let settings = await prisma.systemSetting.findUnique({
      where: { id: 'default-settings' }
    });

    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: {
          id: 'default-settings',
          siteName: 'TNT Luxury Streetwear',
          siteEmail: 'contact@tntclothing.com',
          sitePhone: '+91 99999 88888',
          currency: 'INR',
          razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
          razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
          razorpayEnabled: true,
          codEnabled: true,
          freeShippingMin: 1999
        }
      });
    }

    // Mask key secret
    if (settings.razorpayKeySecret) {
      settings.razorpayKeySecret = '●●●●●●●●●●●●●●●●';
    }

    return res.json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch settings', error: error.message });
  }
};

export const updateSettingsAdmin = async (req, res) => {
  try {
    const {
      siteName, siteEmail, sitePhone, currency, logo, favicon, tagline,
      businessName, businessType, gstin, address, city, state, pinCode, country,
      maintenanceMode, maintenanceMessage,
      timezone, dateFormat, lowStockThreshold, cancellationWindow,
      razorpayKeyId, razorpayKeySecret, razorpayEnabled,
      cardEnabled, upiEnabled, netBankingEnabled, codEnabled, codCharge, codMaxLimit, storePaymentInfo,
      freeShippingEnabled, freeShippingMin,
      emailNewOrder, emailOrderConfirm, emailOrderShipped, emailOrderDelivered, emailOrderCancelled, emailPaymentFailed, emailLowStock,
      smsOrderConfirm, smsShippingUpdate, smsDeliveryConfirm, smsPaymentAlert, smsLowStock, smsNewReview, smsFailedPayment,
      emailFromName, emailFromAddress, emailReplyTo,
      notifyNewLogin, notifySuspiciousLogin, sessionTimeout, twoFactorEnabled
    } = req.body;

    // Load existing settings to compare and handle secret
    let existing = await prisma.systemSetting.findUnique({ where: { id: 'default-settings' } });

    let secretToUpdate = undefined;
    if (razorpayKeySecret !== undefined) {
      if (razorpayKeySecret !== '●●●●●●●●●●●●●●●●' && razorpayKeySecret !== '' && !razorpayKeySecret.startsWith('●')) {
        secretToUpdate = razorpayKeySecret;
      }
    }

    const settings = await prisma.systemSetting.upsert({
      where: { id: 'default-settings' },
      update: {
        siteName, siteEmail, sitePhone, currency, logo, favicon, tagline,
        businessName, businessType, gstin, address, city, state, pinCode, country,
        maintenanceMode: maintenanceMode !== undefined ? Boolean(maintenanceMode) : undefined,
        maintenanceMessage,
        timezone, dateFormat,
        lowStockThreshold: lowStockThreshold !== undefined ? parseInt(lowStockThreshold) : undefined,
        cancellationWindow: cancellationWindow !== undefined ? parseInt(cancellationWindow) : undefined,
        razorpayKeyId,
        razorpayKeySecret: secretToUpdate,
        razorpayEnabled: razorpayEnabled !== undefined ? Boolean(razorpayEnabled) : undefined,
        cardEnabled: cardEnabled !== undefined ? Boolean(cardEnabled) : undefined,
        upiEnabled: upiEnabled !== undefined ? Boolean(upiEnabled) : undefined,
        netBankingEnabled: netBankingEnabled !== undefined ? Boolean(netBankingEnabled) : undefined,
        codEnabled: codEnabled !== undefined ? Boolean(codEnabled) : undefined,
        codCharge: codCharge !== undefined ? parseFloat(codCharge) : undefined,
        codMaxLimit: codMaxLimit !== undefined ? parseFloat(codMaxLimit) : undefined,
        storePaymentInfo: storePaymentInfo !== undefined ? Boolean(storePaymentInfo) : undefined,
        freeShippingEnabled: freeShippingEnabled !== undefined ? Boolean(freeShippingEnabled) : undefined,
        freeShippingMin: freeShippingMin !== undefined ? parseFloat(freeShippingMin) : undefined,
        emailNewOrder: emailNewOrder !== undefined ? Boolean(emailNewOrder) : undefined,
        emailOrderConfirm: emailOrderConfirm !== undefined ? Boolean(emailOrderConfirm) : undefined,
        emailOrderShipped: emailOrderShipped !== undefined ? Boolean(emailOrderShipped) : undefined,
        emailOrderDelivered: emailOrderDelivered !== undefined ? Boolean(emailOrderDelivered) : undefined,
        emailOrderCancelled: emailOrderCancelled !== undefined ? Boolean(emailOrderCancelled) : undefined,
        emailPaymentFailed: emailPaymentFailed !== undefined ? Boolean(emailPaymentFailed) : undefined,
        emailLowStock: emailLowStock !== undefined ? Boolean(emailLowStock) : undefined,
        smsOrderConfirm: smsOrderConfirm !== undefined ? Boolean(smsOrderConfirm) : undefined,
        smsShippingUpdate: smsShippingUpdate !== undefined ? Boolean(smsShippingUpdate) : undefined,
        smsDeliveryConfirm: smsDeliveryConfirm !== undefined ? Boolean(smsDeliveryConfirm) : undefined,
        smsPaymentAlert: smsPaymentAlert !== undefined ? Boolean(smsPaymentAlert) : undefined,
        smsLowStock: smsLowStock !== undefined ? Boolean(smsLowStock) : undefined,
        smsNewReview: smsNewReview !== undefined ? Boolean(smsNewReview) : undefined,
        smsFailedPayment: smsFailedPayment !== undefined ? Boolean(smsFailedPayment) : undefined,
        emailFromName, emailFromAddress, emailReplyTo,
        notifyNewLogin: notifyNewLogin !== undefined ? Boolean(notifyNewLogin) : undefined,
        notifySuspiciousLogin: notifySuspiciousLogin !== undefined ? Boolean(notifySuspiciousLogin) : undefined,
        sessionTimeout: sessionTimeout !== undefined ? parseInt(sessionTimeout) : undefined,
        twoFactorEnabled: twoFactorEnabled !== undefined ? Boolean(twoFactorEnabled) : undefined
      },
      create: {
        id: 'default-settings',
        siteName: siteName || 'TNT Luxury Streetwear',
        siteEmail: siteEmail || 'contact@tntclothing.com',
        sitePhone: sitePhone || '+91 99999 88888',
        currency: currency || 'INR',
        logo: logo || '',
        favicon: favicon || '',
        tagline: tagline || 'Threadones - Wear Your Vibe',
        businessName: businessName || 'Threadones Private Limited',
        businessType: businessType || 'Private Limited',
        gstin: gstin || '',
        address: address || '123 Business Park, New Delhi, India',
        city: city || 'New Delhi',
        state: state || 'Delhi',
        pinCode: pinCode || '110001',
        country: country || 'India',
        maintenanceMode: maintenanceMode !== undefined ? Boolean(maintenanceMode) : false,
        maintenanceMessage: maintenanceMessage || "We'll be back soon. Thank you for your patience!",
        timezone: timezone || "UTC+05:30",
        dateFormat: dateFormat || "DD/MM/YYYY",
        lowStockThreshold: lowStockThreshold !== undefined ? parseInt(lowStockThreshold) : 5,
        cancellationWindow: cancellationWindow !== undefined ? parseInt(cancellationWindow) : 30,
        razorpayKeyId: razorpayKeyId || '',
        razorpayKeySecret: secretToUpdate || '',
        razorpayEnabled: razorpayEnabled !== undefined ? Boolean(razorpayEnabled) : true,
        cardEnabled: cardEnabled !== undefined ? Boolean(cardEnabled) : true,
        upiEnabled: upiEnabled !== undefined ? Boolean(upiEnabled) : true,
        netBankingEnabled: netBankingEnabled !== undefined ? Boolean(netBankingEnabled) : true,
        codEnabled: codEnabled !== undefined ? Boolean(codEnabled) : true,
        codCharge: codCharge !== undefined ? parseFloat(codCharge) : 50,
        codMaxLimit: codMaxLimit !== undefined ? parseFloat(codMaxLimit) : 10000,
        storePaymentInfo: storePaymentInfo !== undefined ? Boolean(storePaymentInfo) : true,
        freeShippingEnabled: freeShippingEnabled !== undefined ? Boolean(freeShippingEnabled) : true,
        freeShippingMin: freeShippingMin !== undefined ? parseFloat(freeShippingMin) : 1999,
        emailNewOrder: emailNewOrder !== undefined ? Boolean(emailNewOrder) : true,
        emailOrderConfirm: emailOrderConfirm !== undefined ? Boolean(emailOrderConfirm) : true,
        emailOrderShipped: emailOrderShipped !== undefined ? Boolean(emailOrderShipped) : true,
        emailOrderDelivered: emailOrderDelivered !== undefined ? Boolean(emailOrderDelivered) : true,
        emailOrderCancelled: emailOrderCancelled !== undefined ? Boolean(emailOrderCancelled) : true,
        emailPaymentFailed: emailPaymentFailed !== undefined ? Boolean(emailPaymentFailed) : true,
        emailLowStock: emailLowStock !== undefined ? Boolean(emailLowStock) : true,
        smsOrderConfirm: smsOrderConfirm !== undefined ? Boolean(smsOrderConfirm) : true,
        smsShippingUpdate: smsShippingUpdate !== undefined ? Boolean(smsShippingUpdate) : true,
        smsDeliveryConfirm: smsDeliveryConfirm !== undefined ? Boolean(smsDeliveryConfirm) : true,
        smsPaymentAlert: smsPaymentAlert !== undefined ? Boolean(smsPaymentAlert) : true,
        smsLowStock: smsLowStock !== undefined ? Boolean(smsLowStock) : true,
        smsNewReview: smsNewReview !== undefined ? Boolean(smsNewReview) : true,
        smsFailedPayment: smsFailedPayment !== undefined ? Boolean(smsFailedPayment) : true,
        emailFromName: emailFromName || 'Threadones',
        emailFromAddress: emailFromAddress || 'no-reply@tntclothing.com',
        emailReplyTo: emailReplyTo || 'support@tntclothing.com',
        notifyNewLogin: notifyNewLogin !== undefined ? Boolean(notifyNewLogin) : true,
        notifySuspiciousLogin: notifySuspiciousLogin !== undefined ? Boolean(notifySuspiciousLogin) : true,
        sessionTimeout: sessionTimeout !== undefined ? parseInt(sessionTimeout) : 30,
        twoFactorEnabled: twoFactorEnabled !== undefined ? Boolean(twoFactorEnabled) : false
      }
    });

    // Audit Log settings change
    await logAuditEvent(req.user, 'UPDATED_SYSTEM_SETTINGS', 'General / Store parameters config', req);

    return res.json({ success: true, message: 'System settings updated successfully', settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update settings', error: error.message });
  }
};

export const getSettingsPublic = async (req, res) => {
  try {
    let settings = await prisma.systemSetting.findUnique({
      where: { id: 'default-settings' }
    });

    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: {
          id: 'default-settings',
          siteName: 'TNT Luxury Streetwear',
          siteEmail: 'contact@tntclothing.com',
          sitePhone: '+91 99999 88888',
          currency: 'INR',
          razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
          razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
          razorpayEnabled: true,
          codEnabled: true,
          freeShippingMin: 1999
        }
      });
    }

    // Exclude secret key and payment gate keys
    const { razorpayKeySecret, razorpayKeyId, ...publicSettings } = settings;
    return res.json({ success: true, settings: publicSettings });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch public settings', error: error.message });
  }
};

// ─── Audit Logs ─────────────────────────────────────────────────────────────
export const getAuditLogs = async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100
    });
    return res.json({ success: true, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs', error: error.message });
  }
};

// ─── Shipping Zones CRUD ──────────────────────────────────────────────────────
export const getShippingZonesAdmin = async (req, res) => {
  try {
    const zones = await prisma.shippingZone.findMany({
      include: { rates: true },
      orderBy: { name: 'asc' }
    });
    return res.json({ success: true, zones });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch shipping zones', error: error.message });
  }
};

export const getShippingZonesPublic = async (req, res) => {
  try {
    const zones = await prisma.shippingZone.findMany({
      where: { status: 'ACTIVE' },
      include: { rates: true },
      orderBy: { name: 'asc' }
    });
    return res.json({ success: true, zones });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch shipping zones', error: error.message });
  }
};

export const createShippingZoneAdmin = async (req, res) => {
  try {
    const { name, regions, status, estimatedDelivery, rates } = req.body;
    
    const zone = await prisma.shippingZone.create({
      data: {
        name,
        regions,
        status: status || 'ACTIVE',
        estimatedDelivery: estimatedDelivery || '2-4 working days',
        rates: rates ? {
          create: rates.map(r => ({
            weightUpper: parseFloat(r.weightUpper),
            charge: parseFloat(r.charge)
          }))
        } : undefined
      },
      include: { rates: true }
    });

    await logAuditEvent(req.user, 'CREATED_SHIPPING_ZONE', `Zone: ${name}`, req);

    return res.json({ success: true, message: 'Shipping zone created successfully', zone });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create shipping zone', error: error.message });
  }
};

export const updateShippingZoneAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, regions, status, estimatedDelivery, rates } = req.body;

    // Delete existing rates and recreate
    if (rates) {
      await prisma.shippingRate.deleteMany({ where: { zoneId: id } });
    }

    const zone = await prisma.shippingZone.update({
      where: { id },
      data: {
        name,
        regions,
        status,
        estimatedDelivery,
        rates: rates ? {
          create: rates.map(r => ({
            weightUpper: parseFloat(r.weightUpper),
            charge: parseFloat(r.charge)
          }))
        } : undefined
      },
      include: { rates: true }
    });

    await logAuditEvent(req.user, 'UPDATED_SHIPPING_ZONE', `Zone: ${name || id}`, req);

    return res.json({ success: true, message: 'Shipping zone updated successfully', zone });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update shipping zone', error: error.message });
  }
};

export const deleteShippingZoneAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const zone = await prisma.shippingZone.delete({ where: { id } });
    
    await logAuditEvent(req.user, 'DELETED_SHIPPING_ZONE', `Zone ID: ${id}`, req);

    return res.json({ success: true, message: 'Shipping zone deleted successfully', zone });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete shipping zone', error: error.message });
  }
};

// ─── Change Password Settings ───────────────────────────────────────────────
export const changePasswordSettings = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashed }
    });

    // Revoke all sessions for this user except current
    await prisma.userSession.deleteMany({
      where: {
        userId,
        // Delete older ones, let authMiddleware handle cookies
      }
    });

    await logAuditEvent(req.user, 'CHANGED_PASSWORD', 'User security password change', req);

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to change password', error: error.message });
  }
};

// ─── Active Sessions CRUD ─────────────────────────────────────────────────────
export const getActiveSessions = async (req, res) => {
  try {
    const sessions = await prisma.userSession.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, sessions });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load sessions', error: error.message });
  }
};

export const revokeSession = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.userSession.delete({
      where: { id, userId: req.user.id }
    });

    await logAuditEvent(req.user, 'REVOKED_SESSION', `Session ID: ${id}`, req);

    return res.json({ success: true, message: 'Session revoked successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to revoke session', error: error.message });
  }
};

export const revokeAllOtherSessions = async (req, res) => {
  try {
    const latest = await prisma.userSession.findFirst({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    if (latest) {
      await prisma.userSession.deleteMany({
        where: {
          userId: req.user.id,
          id: { not: latest.id }
        }
      });
    } else {
      await prisma.userSession.deleteMany({
        where: { userId: req.user.id }
      });
    }

    await logAuditEvent(req.user, 'REVOKED_ALL_OTHER_SESSIONS', 'Security session clear-out', req);

    return res.json({ success: true, message: 'All other sessions revoked successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to revoke other sessions', error: error.message });
  }
};

export const getAdminDashboardData = async (req, res) => {
  try {
    const isSuper = req.user?.role?.name === 'SUPER_ADMIN';
    const permissions = req.user?.role?.permissions || [];
    const hasPerm = (pname) => isSuper || permissions.some(p => p.name === pname);

    const hasReports = hasPerm('view_reports');
    const hasOrders = hasPerm('view_orders');
    const hasCustomers = hasPerm('view_customers');
    const hasProducts = hasPerm('view_products');
    const hasReviews = hasPerm('view_reviews');

    const { startDate, endDate } = req.query;

    let start = startDate ? new Date(startDate) : new Date();
    let end = endDate ? new Date(endDate) : new Date();

    if (!startDate || !endDate) {
      start.setDate(start.getDate() - 30);
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const durationMs = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - durationMs - 1);
    const prevEnd = new Date(start.getTime() - 1);

    // 1. Fetch orders
    let currentOrders = [];
    let prevOrders = [];
    if (hasOrders || hasReports) {
      currentOrders = await prisma.order.findMany({
        where: {
          OR: [
            { paymentStatus: 'SUCCESS' },
            { orderStatus: 'DELIVERED' }
          ],
          createdAt: { gte: start, lte: end }
        },
        select: {
          totalAmount: true,
          createdAt: true,
          orderNumber: true,
          id: true,
          user: { select: { firstName: true, lastName: true, email: true } },
          orderStatus: true
        }
      });

      prevOrders = await prisma.order.findMany({
        where: {
          OR: [
            { paymentStatus: 'SUCCESS' },
            { orderStatus: 'DELIVERED' }
          ],
          createdAt: { gte: prevStart, lte: prevEnd }
        },
        select: {
          totalAmount: true
        }
      });
    }

    const currentRevenue = hasReports ? currentOrders.reduce((sum, o) => sum + o.totalAmount, 0) : 0;
    const prevRevenue = hasReports ? prevOrders.reduce((sum, o) => sum + o.totalAmount, 0) : 0;

    const currentOrdersCount = hasOrders ? currentOrders.length : 0;
    const prevOrdersCount = hasOrders ? prevOrders.length : 0;

    // 2. Fetch Customers
    let currentCustomers = 0;
    let prevCustomers = 0;
    let totalCustomersCount = 0;
    if (hasCustomers) {
      currentCustomers = await prisma.user.count({
        where: {
          role: { name: 'CUSTOMER' },
          createdAt: { gte: start, lte: end }
        }
      });

      prevCustomers = await prisma.user.count({
        where: {
          role: { name: 'CUSTOMER' },
          createdAt: { gte: prevStart, lte: prevEnd }
        }
      });

      totalCustomersCount = await prisma.user.count({
        where: { role: { name: 'CUSTOMER' } }
      });
    }

    // 3. Conversion Rate
    let currentSessions = 0;
    let prevSessions = 0;
    if (hasReports) {
      currentSessions = await prisma.visitorLog?.count({
        where: { visitedAt: { gte: start, lte: end } }
      }) || 0;
      prevSessions = await prisma.visitorLog?.count({
        where: { visitedAt: { gte: prevStart, lte: prevEnd } }
      }) || 0;
    }

    const fallbackSessionsCurrent = currentSessions || Math.max(currentOrdersCount * 25, 100);
    const fallbackSessionsPrev = prevSessions || Math.max(prevOrdersCount * 25, 100);

    const currentConvRate = hasReports ? (currentOrdersCount / fallbackSessionsCurrent) * 100 : 0;
    const prevConvRate = hasReports ? (prevOrdersCount / fallbackSessionsPrev) * 100 : 0;

    const getPercentChange = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return parseFloat((((curr - prev) / prev) * 100).toFixed(1));
    };

    // 4. Sales performance daily grouping
    const dailyDataMap = {};
    const dateCursor = new Date(start);
    while (dateCursor <= end) {
      const dateStr = dateCursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyDataMap[dateStr] = { label: dateStr, revenue: 0, orders: 0 };
      dateCursor.setDate(dateCursor.getDate() + 1);
    }

    if (hasReports || hasOrders) {
      currentOrders.forEach(o => {
        const dateStr = o.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (dailyDataMap[dateStr]) {
          if (hasReports) dailyDataMap[dateStr].revenue += o.totalAmount;
          if (hasOrders) dailyDataMap[dateStr].orders += 1;
        }
      });
    }
    const salesChartData = Object.values(dailyDataMap);

    // 5. Inventory alerts
    let inventoryAlerts = [];
    if (hasProducts) {
      const allVariants = await prisma.productVariant.findMany({
        include: { product: true },
        orderBy: { stock: 'asc' }
      });

      inventoryAlerts = allVariants.map(v => {
        const stock = v.stock;
        const reorderLevel = 10;
        const criticalThreshold = 5;
        let status = 'Healthy';
        if (stock <= criticalThreshold) status = 'Critical';
        else if (stock <= reorderLevel) status = 'Low';

        return {
          id: v.id,
          name: v.product.name,
          sku: v.sku,
          stock,
          reorderLevel,
          status,
          image: v.product.slug ? `/uploads/${v.product.slug}-thumbnail.png` : null
        };
      });
    }

    // 6. Recent Orders
    let recentOrders = [];
    if (hasOrders) {
      const recentOrdersDb = await prisma.order.findMany({
        where: {
          createdAt: { gte: start, lte: end }
        },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      recentOrders = recentOrdersDb.map(o => ({
        id: o.orderNumber,
        customer: `${o.user.firstName} ${o.user.lastName || ''}`.trim(),
        amount: o.totalAmount,
        status: o.orderStatus
      }));
    }

    // 7. Top Selling Products
    let topSellingProducts = [];
    if (hasReports) {
      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: {
            OR: [
              { paymentStatus: 'SUCCESS' },
              { orderStatus: 'DELIVERED' }
            ],
            orderStatus: { notIn: ['CANCELLED'] },
            createdAt: { gte: start, lte: end }
          }
        },
        select: {
          productId: true,
          productName: true,
          quantity: true,
          price: true
        }
      });

      const productSalesMap = {};
      orderItems.forEach(item => {
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = {
            id: item.productId,
            name: item.productName,
            unitsSold: 0,
            revenue: 0
          };
        }
        productSalesMap[item.productId].unitsSold += item.quantity;
        productSalesMap[item.productId].revenue += item.quantity * item.price;
      });
      topSellingProducts = Object.values(productSalesMap)
        .sort((a, b) => b.unitsSold - a.unitsSold)
        .slice(0, 5);
    }

    // 8. Recent Reviews
    let recentReviews = [];
    if (hasReviews) {
      const recentReviewsDb = await prisma.review.findMany({
        where: {
          createdAt: { gte: start, lte: end }
        },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      recentReviews = recentReviewsDb.map(r => ({
        id: r.id,
        customer: `${r.user.firstName} ${r.user.lastName || ''}`.trim(),
        rating: r.rating,
        comment: r.comment
      }));
    }

    // 9. Customer Growth chart
    let customerGrowthChartData = [];
    if (hasCustomers) {
      const userRegistrations = await prisma.user.findMany({
        where: {
          role: { name: 'CUSTOMER' },
          createdAt: { gte: start, lte: end }
        },
        select: { createdAt: true }
      });

      const dailyUsersMap = {};
      const uCursor = new Date(start);
      while (uCursor <= end) {
        const dateStr = uCursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dailyUsersMap[dateStr] = { label: dateStr, count: 0 };
        uCursor.setDate(uCursor.getDate() + 1);
      }
      userRegistrations.forEach(u => {
        const dateStr = u.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (dailyUsersMap[dateStr]) {
          dailyUsersMap[dateStr].count += 1;
        }
      });
      customerGrowthChartData = Object.values(dailyUsersMap);
    }

    return res.json({
      success: true,
      data: {
        kpis: {
          revenue: {
            value: hasReports ? currentRevenue : 0,
            change: hasReports ? getPercentChange(currentRevenue, prevRevenue) : 0,
            sparkline: hasReports ? salesChartData.map(d => d.revenue) : []
          },
          orders: {
            value: hasOrders ? currentOrdersCount : 0,
            change: hasOrders ? getPercentChange(currentOrdersCount, prevOrdersCount) : 0,
            sparkline: hasOrders ? salesChartData.map(d => d.orders) : []
          },
          customers: {
            value: hasCustomers ? totalCustomersCount : 0,
            change: hasCustomers ? getPercentChange(currentCustomers, prevCustomers) : 0,
            sparkline: hasCustomers ? customerGrowthChartData.map(d => d.count) : []
          },
          conversion: {
            value: hasReports ? parseFloat(currentConvRate.toFixed(2)) : 0,
            change: hasReports ? getPercentChange(currentConvRate, prevConvRate) : 0,
            sparkline: hasReports ? salesChartData.map(d => d.orders > 0 ? parseFloat(((d.orders / (fallbackSessionsCurrent / salesChartData.length || 1)) * 100).toFixed(2)) : 0) : []
          }
        },
        salesPerformance: {
          revenue: hasReports ? currentRevenue : 0,
          orders: hasOrders ? currentOrdersCount : 0,
          aov: hasReports && currentOrdersCount > 0 ? parseFloat((currentRevenue / currentOrdersCount).toFixed(2)) : 0,
          newCustomers: hasCustomers ? currentCustomers : 0,
          chart: hasReports ? salesChartData : []
        },
        inventoryAlerts: hasProducts ? inventoryAlerts.filter(i => i.status !== 'Healthy').slice(0, 5) : [],
        recentOrders,
        topSellingProducts,
        customerGrowth: {
          total: hasCustomers ? totalCustomersCount : 0,
          change: hasCustomers ? getPercentChange(currentCustomers, prevCustomers) : 0,
          chart: hasCustomers ? customerGrowthChartData : []
        },
        recentReviews
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard data', error: error.message });
  }
};

export const restockInventory = async (req, res) => {
  try {
    const { productVariantId, quantity } = req.body;
    if (!productVariantId || quantity === undefined || parseInt(quantity) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid variant ID or quantity' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { id: productVariantId },
        include: { product: true }
      });
      if (!variant) throw new Error('Product variant not found');

      const updatedVariant = await tx.productVariant.update({
        where: { id: productVariantId },
        data: { stock: { increment: parseInt(quantity) } }
      });

      const existingInventory = await tx.inventory.findFirst({
        where: { productVariantId }
      });

      if (existingInventory) {
        const updatedInventory = await tx.inventory.update({
          where: { id: existingInventory.id },
          data: { quantity: { increment: parseInt(quantity) } }
        });

        await tx.inventoryLog.create({
          data: {
            inventoryId: updatedInventory.id,
            changeQty: parseInt(quantity),
            reason: `Restock - Admin manual updates`
          }
        });
      } else {
        let warehouse = await tx.warehouse.findFirst();
        if (!warehouse) {
          warehouse = await tx.warehouse.create({
            data: { name: 'Default Warehouse', code: 'WH001', city: 'Jhumri Telaiya' }
          });
        }
        const newInventory = await tx.inventory.create({
          data: {
            productVariantId,
            warehouseId: warehouse.id,
            quantity: updatedVariant.stock
          }
        });
        await tx.inventoryLog.create({
          data: {
            inventoryId: newInventory.id,
            changeQty: parseInt(quantity),
            reason: `Initial restock log creation`
          }
        });
      }

      return updatedVariant;
    });

    return res.json({ success: true, message: 'Restocked successfully!', variant: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Restock failed', error: error.message });
  }
};

export const getReportsAdmin = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    let start = startDate ? new Date(startDate) : new Date();
    let end = endDate ? new Date(endDate) : new Date();

    if (!startDate || !endDate) {
      start.setDate(start.getDate() - 30);
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const durationMs = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - durationMs - 1);
    const prevEnd = new Date(start.getTime() - 1);

    // 1. Fetch current and previous orders
    const whereCurrent = {
      OR: [
        { paymentStatus: 'SUCCESS' },
        { orderStatus: 'DELIVERED' }
      ],
      createdAt: { gte: start, lte: end }
    };
    const wherePrev = {
      OR: [
        { paymentStatus: 'SUCCESS' },
        { orderStatus: 'DELIVERED' }
      ],
      createdAt: { gte: prevStart, lte: prevEnd }
    };

    const [currentOrders, prevOrders] = await Promise.all([
      prisma.order.findMany({
        where: whereCurrent,
        include: {
          items: {
            include: {
              product: {
                include: {
                  categories: true
                }
              }
            }
          }
        }
      }),
      prisma.order.findMany({
        where: wherePrev,
        include: {
          items: {
            include: {
              product: {
                include: {
                  categories: true
                }
              }
            }
          }
        }
      })
    ]);

    // Apply department (Category-based) filtering on current/prev orders if requested
    let filteredCurrentOrders = currentOrders;
    let filteredPrevOrders = prevOrders;
    if (department && department !== 'All Departments') {
      filteredCurrentOrders = currentOrders.filter(o => 
        o.items.some(item => item.product?.categories?.some(cat => cat.name.toLowerCase() === department.toLowerCase()))
      );
      filteredPrevOrders = prevOrders.filter(o => 
        o.items.some(item => item.product?.categories?.some(cat => cat.name.toLowerCase() === department.toLowerCase()))
      );
    }

    // Revenue
    const revenue = filteredCurrentOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const prevRevenue = filteredPrevOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Orders Count
    const ordersCount = filteredCurrentOrders.length;
    const prevOrdersCount = filteredPrevOrders.length;

    // AOV
    const aov = ordersCount > 0 ? revenue / ordersCount : 0;
    const prevAov = prevOrdersCount > 0 ? prevRevenue / prevOrdersCount : 0;

    // Discounts
    const discounts = filteredCurrentOrders.reduce((sum, o) => sum + o.discountAmount, 0);
    const prevDiscounts = filteredPrevOrders.reduce((sum, o) => sum + o.discountAmount, 0);

    // Refunds (sum from Refund model during selected dates)
    const [currentRefundsDb, prevRefundsDb] = await Promise.all([
      prisma.refund.findMany({
        where: {
          createdAt: { gte: start, lte: end }
        }
      }),
      prisma.refund.findMany({
        where: {
          createdAt: { gte: prevStart, lte: prevEnd }
        }
      })
    ]);
    const refunds = currentRefundsDb.reduce((sum, r) => sum + r.amount, 0);
    const prevRefunds = prevRefundsDb.reduce((sum, r) => sum + r.amount, 0);

    const getPercentChange = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 'New' : '0%';
      const val = (((curr - prev) / prev) * 100).toFixed(1);
      return `${val > 0 ? '+' : ''}${val}%`;
    };

    // Customer metrics
    const [newCustomers, prevCustomers, allCustomersWithOrders] = await Promise.all([
      prisma.user.count({
        where: {
          role: { name: 'CUSTOMER' },
          createdAt: { gte: start, lte: end }
        }
      }),
      prisma.user.count({
        where: {
          role: { name: 'CUSTOMER' },
          createdAt: { gte: prevStart, lte: prevEnd }
        }
      }),
      prisma.user.findMany({
        where: {
          role: { name: 'CUSTOMER' }
        },
        include: {
          orders: {
            where: {
              OR: [
                { paymentStatus: 'SUCCESS' },
                { orderStatus: 'DELIVERED' }
              ]
            }
          }
        }
      })
    ]);

    const returningCustomers = allCustomersWithOrders.filter(u => u.orders.length > 1).length;
    const clv = allCustomersWithOrders.length > 0 
      ? allCustomersWithOrders.reduce((sum, u) => sum + u.orders.reduce((oSum, o) => oSum + o.totalAmount, 0), 0) / allCustomersWithOrders.length
      : 0;

    // Inventory metrics
    const allVariants = await prisma.productVariant.findMany({
      include: {
        product: true
      }
    });

    const stockValue = allVariants.reduce((sum, v) => sum + (v.stock * v.price), 0);
    const lowStock = allVariants.filter(v => v.stock > 0 && v.stock <= 10).length;
    const outOfStock = allVariants.filter(v => v.stock === 0).length;

    // Dead Stock calculation: variants with available stock > 0 but 0 units sold in the selected period
    const allOrderedItems = filteredCurrentOrders.flatMap(o => o.items);
    const orderedProductIds = new Set(allOrderedItems.map(item => item.productId));
    const deadStock = allVariants.filter(v => v.stock > 0 && !orderedProductIds.has(v.productId)).length;

    // Sales daily grouping
    const dailyDataMap = {};
    const dateCursor = new Date(start);
    while (dateCursor <= end) {
      const dateStr = dateCursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyDataMap[dateStr] = { label: dateStr, revenue: 0, orders: 0 };
      dateCursor.setDate(dateCursor.getDate() + 1);
    }

    filteredCurrentOrders.forEach(o => {
      const dateStr = o.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyDataMap[dateStr]) {
        dailyDataMap[dateStr].revenue += o.totalAmount;
        dailyDataMap[dateStr].orders += 1;
      }
    });
    const salesChartData = Object.values(dailyDataMap);

    // Top products ranking
    const productSalesMap = {};
    allOrderedItems.forEach(item => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          id: item.productId,
          name: item.productName || item.product?.name,
          image: item.product?.images?.[0]?.url || item.product?.coverImage || '/placeholder.png',
          unitsSold: 0,
          revenue: 0
        };
      }
      productSalesMap[item.productId].unitsSold += item.quantity;
      productSalesMap[item.productId].revenue += item.price * item.quantity;
    });

    const rankedProducts = Object.values(productSalesMap);
    const bestSellersList = [...rankedProducts].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5);
    const byRevenueList = [...rankedProducts].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const byQuantityList = [...rankedProducts].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5);

    // Count of best/worst seller summary metrics
    const bestSellersCount = rankedProducts.filter(p => p.unitsSold >= 10).length;
    const worstSellersCount = allVariants.filter(v => v.stock > 0 && !orderedProductIds.has(v.productId)).length;

    return res.json({
      success: true,
      kpi: {
        revenue: { value: revenue, change: getPercentChange(revenue, prevRevenue) },
        orders: { value: ordersCount, change: getPercentChange(ordersCount, prevOrdersCount) },
        aov: { value: aov, change: getPercentChange(aov, prevAov) },
        refunds: { value: refunds, change: getPercentChange(refunds, prevRefunds) },
        discounts: { value: discounts, change: getPercentChange(discounts, prevDiscounts) }
      },
      salesReport: [
        { name: 'Revenue', value: revenue, change: getPercentChange(revenue, prevRevenue) },
        { name: 'Orders', value: ordersCount, change: getPercentChange(ordersCount, prevOrdersCount) },
        { name: 'AOV', value: aov, change: getPercentChange(aov, prevAov) },
        { name: 'Refunds', value: refunds, change: getPercentChange(refunds, prevRefunds) },
        { name: 'Discounts', value: discounts, change: getPercentChange(discounts, prevDiscounts) }
      ],
      productReport: {
        bestSellers: bestSellersCount,
        worstSellers: worstSellersCount,
        topProductsCount: rankedProducts.length
      },
      customerReport: {
        newCustomers,
        newCustomersChange: getPercentChange(newCustomers, prevCustomers),
        returningCustomers,
        clv: Math.round(clv)
      },
      inventoryReport: {
        stockValue,
        lowStock,
        outOfStock,
        deadStock
      },
      salesTrend: salesChartData,
      topProducts: {
        bestSellers: bestSellersList,
        byRevenue: byRevenueList,
        byQuantity: byQuantityList
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate analytics report', error: error.message });
  }
};

export const getInventoryNotifications = async (req, res) => {
  try {
    const outOfStockVariants = await prisma.productVariant.findMany({
      where: { stock: 0 },
      include: {
        product: true,
        color: true,
        size: true
      }
    });

    const notifications = outOfStockVariants.map(v => ({
      id: v.id,
      sku: v.sku,
      title: 'Stock Out of Bounds',
      message: `SKU ${v.sku} (${v.product.name} - ${v.color.name} | ${v.size.code}) reached 0 quantity.`,
      actionUrl: `/admin/products?search=${v.sku}`
    }));

    return res.json({ success: true, notifications });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch inventory notifications', error: error.message });
  }
};
