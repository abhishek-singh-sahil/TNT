import { prisma } from '../config/prisma.js';
import { OrderStatus, PaymentStatus } from '@prisma/client';

export const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      addressId,
      items,
      paymentMethod,
      couponCode,
      shippingFee = 0,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items cannot be empty' });
    }

    let verifiedTransactionId = `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    let initialPaymentStatus = PaymentStatus.PENDING;

    if (paymentMethod !== 'COD') {
      if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
        return res.status(400).json({ success: false, message: 'Missing Razorpay payment parameters for online checkout' });
      }

      // Fetch Razorpay credentials from system settings
      const settings = await prisma.systemSetting.findUnique({
        where: { id: 'default-settings' }
      });
      const keySecret = settings?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || 'tnt_secret_key';

      // Verify HMAC SHA256 Signature
      const crypto = await import('crypto');
      const body = razorpayOrderId + '|' + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(body.toString())
        .digest('hex');

      const isValid = razorpaySignature === expectedSignature;
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature. Aborted.' });
      }

      verifiedTransactionId = razorpayPaymentId;
      initialPaymentStatus = PaymentStatus.SUCCESS;
    }

    // Execute order creation in a PRISMA TRANSACTION
    const result = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemData = [];

      for (const item of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.productVariantId },
          include: { product: true, color: true, size: true, inventory: true },
        });

        if (!variant || variant.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.productName || 'variant'}`);
        }

        const itemTotal = variant.price * item.quantity;
        subtotal += itemTotal;

        // Deduct inventory
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: { decrement: item.quantity } },
        });

        orderItemData.push({
          productId: variant.productId,
          productVariantId: variant.id,
          productName: variant.product.name,
          variantInfo: `${variant.color.name} | ${variant.size.name}`,
          price: variant.price,
          quantity: item.quantity,
          totalPrice: itemTotal,
        });
      }

      let discountAmount = 0;
      if (couponCode === 'WELCOME10') {
        discountAmount = Math.round(subtotal * 0.1);
      }

      const totalAmount = subtotal - discountAmount + shippingFee;
      const orderNumber = `TNT${Math.floor(10000 + Math.random() * 90000)}`;

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId,
          subtotal,
          discountAmount,
          shippingFee,
          totalAmount,
          orderStatus: OrderStatus.CONFIRMED,
          paymentStatus: initialPaymentStatus,
          couponCode,
          items: { create: orderItemData },
          payment: {
            create: {
              paymentMethod,
              transactionId: verifiedTransactionId,
              amount: totalAmount,
              status: initialPaymentStatus,
            },
          },
          tracking: {
            create: {
              courierPartner: 'Delhivery',
              trackingNumber: `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`,
              currentStatus: OrderStatus.CONFIRMED,
              logs: JSON.stringify([
                { status: 'Order Confirmed', time: new Date().toLocaleString() },
              ]),
            },
          },
        },
        include: { items: true, payment: true, tracking: true },
      });

      // Reward points update
      await tx.user.update({
        where: { id: userId },
        data: { rewardPoints: { increment: Math.floor(totalAmount * 0.05) } },
      });

      return newOrder;
    });

    return res.status(201).json({ success: true, message: 'Order placed successfully', order: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Order placement failed', error: error.message });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: { include: { product: true } }, tracking: true, address: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch orders', error: error.message });
  }
};

export const getOrderTracking = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findFirst({
      where: { OR: [{ id: orderId }, { orderNumber: orderId }] },
      include: {
        items: { include: { product: true } },
        tracking: true,
        address: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch order tracking', error: error.message });
  }
};

export const createReturnRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, items } = req.body;
    const userId = req.user.id;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const newReturn = await prisma.return.create({
      data: {
        orderId: order.id,
        userId,
        reason,
        status: 'PENDING',
        items: {
          create: items.map(item => ({
            orderItemId: item.orderItemId,
            productVariantId: item.productVariantId,
            quantity: item.quantity,
            reason: reason
          }))
        }
      }
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { orderStatus: 'RETURNED' }
    });

    return res.json({ success: true, message: 'Return request submitted successfully!', newReturn });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create return request', error: error.message });
  }
};

