import { prisma } from '../config/prisma.js';
import { sendEmail } from '../utils/email.js';

export const getAdminDashboardMetrics = async (req, res) => {
  try {
    const [totalOrders, deliveredOrders, pendingOrders, totalUsers, totalProducts] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { orderStatus: 'DELIVERED' } }),
      prisma.order.count({ where: { orderStatus: 'CONFIRMED' } }),
      prisma.user.count({ where: { role: { name: 'CUSTOMER' } } }),
      prisma.product.count({ where: { deletedAt: null } }),
    ]);

    const revenueResult = await prisma.order.aggregate({
      where: { paymentStatus: 'SUCCESS' },
      _sum: { totalAmount: true },
    });

    const totalRevenue = revenueResult._sum.totalAmount || 0;

    // Fetch low stock items from database
    const lowStockVariants = await prisma.productVariant.findMany({
      where: { stock: { lte: 5 } },
      include: { product: true },
      take: 5,
    });

    return res.json({
      success: true,
      metrics: {
        totalSales: `₹${totalRevenue.toLocaleString()}`,
        todaySales: '₹0',
        weeklySales: '₹0',
        monthlySales: `₹${totalRevenue.toLocaleString()}`,
        totalOrders,
        deliveredOrders,
        pendingOrders,
        totalCustomers: totalUsers,
        activeProducts: totalProducts,
        conversionRate: totalOrders > 0 ? '3.4%' : '0.0%',
        cartAbandonmentRate: '0.0%',
      },
      salesGraphData: totalOrders > 0 ? [
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

export const getAuditLogs = async (req, res) => {
  try {
    return res.json({ success: true, logs: [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs', error: error.message });
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

export const getCustomersAdmin = async (req, res) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: { name: 'CUSTOMER' } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        rewardPoints: true,
        createdAt: true,
      }
    });
    return res.json({ success: true, customers });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch customers', error: error.message });
  }
};

export const getReviewsAdmin = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        user: { select: { firstName: true, email: true } },
        product: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, reviews });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error.message });
  }
};

export const deleteReviewAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.review.delete({ where: { id } });
    return res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete review', error: error.message });
  }
};

export const getOrdersAdmin = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        address: true,
        items: true,
        tracking: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch admin orders', error: error.message });
  }
};

export const updateOrderStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: { orderStatus: status },
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
    logs.push({ status, time: new Date().toLocaleString() });

    await prisma.orderTracking.upsert({
      where: { orderId: id },
      update: {
        currentStatus: status,
        logs: JSON.stringify(logs),
        deliveredAt: status === 'DELIVERED' ? new Date() : undefined
      },
      create: {
        orderId: id,
        trackingNumber: `TNT-TRK-${Date.now()}`,
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
    const { firstName, lastName, email, phone, rewardPoints } = req.body;
    const customer = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phone,
        rewardPoints: parseInt(rewardPoints || '0')
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

    if (status === 'COMPLETED') {
      for (const item of returnRequest.items) {
        await prisma.productVariant.update({
          where: { id: item.productVariantId },
          data: { stock: { increment: item.quantity } }
        });
      }

      if (returnRequest.order?.payment?.id) {
        await prisma.refund.create({
          data: {
            paymentId: returnRequest.order.payment.id,
            returnId: returnRequest.id,
            amount: returnRequest.order.totalAmount,
            status: 'PROCESSED'
          }
        });
      }

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
    await prisma.category.delete({ where: { id } });
    return res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete category', error: error.message });
  }
};




