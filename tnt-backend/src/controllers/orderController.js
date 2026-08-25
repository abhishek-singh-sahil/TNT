import { prisma } from '../config/prisma.js';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { sendEmail } from '../utils/email.js';

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

    // Fetch system settings
    const settings = await prisma.systemSetting.findUnique({
      where: { id: 'default-settings' }
    });

    if (paymentMethod === 'COD') {
      if (settings && !settings.codEnabled) {
        return res.status(400).json({ success: false, message: 'Cash on Delivery (COD) is currently disabled.' });
      }
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
      let appliedCouponId = null;

      if (couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: couponCode.toUpperCase() }
        });

        if (coupon && coupon.isActive) {
          const now = new Date();
          const isValidTime = coupon.validFrom <= now && coupon.validTill >= now;
          const isUnderMaxUses = coupon.usedCount < coupon.maxUses;
          const isAboveMinAmount = subtotal >= coupon.minOrderAmount;

          if (isValidTime && isUnderMaxUses && isAboveMinAmount) {
            appliedCouponId = coupon.id;
            if (coupon.couponType === 'PERCENTAGE') {
              discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
              if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                discountAmount = Math.round(coupon.maxDiscount);
              }
            } else if (coupon.couponType === 'FLAT') {
              discountAmount = Math.round(coupon.discountValue);
            }
            discountAmount = Math.min(discountAmount, subtotal);
          }
        }
      }

      // Fetch address inside transaction
      const address = await tx.address.findUnique({ where: { id: addressId } });

      let calculatedShippingFee = 0;
      if (settings) {
        if (settings.freeShippingEnabled && subtotal >= settings.freeShippingMin) {
          calculatedShippingFee = 0;
        } else if (address) {
          const zones = await tx.shippingZone.findMany({
            where: { status: 'ACTIVE' },
            include: { rates: true }
          });

          let matchedZone = null;
          const searchCity = (address.city || '').toLowerCase();
          const searchState = (address.state || '').toLowerCase();

          for (const zone of zones) {
            const regions = zone.regions.toLowerCase();
            if (regions.includes(searchCity) || regions.includes(searchState)) {
              matchedZone = zone;
              break;
            }
          }

          if (!matchedZone) {
            matchedZone = zones.find(z => z.name.toLowerCase().includes('india') || z.name.toLowerCase().includes('default'));
          }

          if (matchedZone && matchedZone.rates.length > 0) {
            const totalQty = orderItemData.reduce((acc, item) => acc + item.quantity, 0);
            const totalWeight = totalQty * 0.4;
            const sortedRates = [...matchedZone.rates].sort((a, b) => a.weightUpper - b.weightUpper);
            const rate = sortedRates.find(r => totalWeight <= r.weightUpper) || sortedRates[sortedRates.length - 1];
            if (rate) {
              calculatedShippingFee = rate.charge;
            }
          } else {
            calculatedShippingFee = 80;
          }
        } else {
          calculatedShippingFee = 80;
        }
      } else {
        calculatedShippingFee = 80;
      }

      let codCharge = 0;
      if (paymentMethod === 'COD') {
        const netSubtotal = subtotal - discountAmount;
        if (settings) {
          if (netSubtotal > settings.codMaxLimit) {
            throw new Error(`COD option is not available for orders exceeding ₹${settings.codMaxLimit}.`);
          }
          codCharge = settings.codCharge;
        }
      }

      const finalShippingFee = calculatedShippingFee;
      const totalAmount = subtotal - discountAmount + finalShippingFee + codCharge;
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const ddmmyy = `${day}${month}${year}`;

      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const countToday = await tx.order.count({
        where: {
          createdAt: {
            gte: startOfToday,
            lte: endOfToday
          }
        }
      });

      const serialNum = String(countToday + 1).padStart(3, '0');
      const orderNumber = `TNT${ddmmyy}${serialNum}`;

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId,
          subtotal,
          discountAmount,
          shippingFee: finalShippingFee + codCharge,
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
        },
        include: { items: true, payment: true, tracking: true },
      });

      // Increment coupon usage & save log if valid coupon applied
      if (appliedCouponId) {
        await tx.couponUsage.create({
          data: {
            couponId: appliedCouponId,
            userId,
            orderId: newOrder.id
          }
        });

        await tx.coupon.update({
          where: { id: appliedCouponId },
          data: { usedCount: { increment: 1 } }
        });
      }

      // Reward points update
      await tx.user.update({
        where: { id: userId },
        data: { rewardPoints: { increment: Math.floor(totalAmount * 0.05) } },
      });

      return newOrder;
    });

    // Send background emails
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 25px; border: 1px solid #e5e5e7; max-width: 600px; margin: 0 auto; color: #111111;">
          <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px;">
            <span style="font-size: 24px; font-weight: 900;">TNT LUXURY STREETWEAR</span>
          </div>
          <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">Order Confirmed!</h2>
          <p style="font-size: 14px; line-height: 1.6;">Hi ${req.user.firstName},</p>
          <p style="font-size: 14px; line-height: 1.6;">Thank you for shopping at TNT! Your order <strong>#${result.orderNumber}</strong> has been successfully placed and is being processed.</p>
          
          <div style="background: #f4f2ee; padding: 15px; border-radius: 4px; border: 1px solid #e3e1dc; margin: 20px 0;">
            <h3 style="font-size: 14px; font-weight: bold; margin-top: 0; margin-bottom: 10px; border-bottom: 1px solid #d3d1cb; padding-bottom: 5px;">ORDER SUMMARY</h3>
            <p style="font-size: 12px; margin: 5px 0;"><strong>Payment Method:</strong> ${paymentMethod}</p>
            <p style="font-size: 12px; margin: 5px 0;"><strong>Subtotal:</strong> ₹${result.subtotal.toLocaleString()}</p>
            <p style="font-size: 12px; margin: 5px 0;"><strong>Discount Amount:</strong> -₹${result.discountAmount.toLocaleString()}</p>
            <p style="font-size: 12px; margin: 5px 0;"><strong>Shipping:</strong> ${result.shippingFee === 0 ? 'FREE' : `₹${result.shippingFee}`}</p>
            <p style="font-size: 14px; margin: 10px 0 0 0; font-weight: bold; border-top: 1px dashed #d3d1cb; padding-top: 10px;">Total Amount Paid: ₹${result.totalAmount.toLocaleString()}</p>
          </div>
          <p style="font-size: 12px; color: #6b6b6b; border-top: 1px solid #e5e5e7; padding-top: 15px; text-align: center;">Need assistance? Contact our support channels or check your account registry.</p>
        </div>
      `;
      // Send confirmation to user
      sendEmail({
        to: req.user.email,
        subject: `TNT Order Confirmation #${result.orderNumber}`,
        html: emailHtml
      });

      // Send notice to admin
      const adminEmailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 25px; border: 1px solid #e5e5e7; max-width: 600px; margin: 0 auto; color: #111111;">
          <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px;">
            <span style="font-size: 20px; font-weight: 900;">TNT ADMIN CONSOLE</span>
          </div>
          <h2 style="font-size: 16px; font-weight: bold; color: #c2410c; margin-bottom: 10px;">🔔 NEW ORDER RECEIVED</h2>
          <p style="font-size: 14px; line-height: 1.6;">Order <strong>#${result.orderNumber}</strong> has been created in your registry.</p>
          <div style="background: #f4f2ee; padding: 15px; border-radius: 4px; border: 1px solid #e3e1dc; margin: 20px 0;">
            <p style="font-size: 12px; margin: 5px 0;"><strong>Customer Name:</strong> ${req.user.firstName} ${req.user.lastName || ''}</p>
            <p style="font-size: 12px; margin: 5px 0;"><strong>Email:</strong> ${req.user.email}</p>
            <p style="font-size: 12px; margin: 5px 0;"><strong>Order Amount:</strong> ₹${result.totalAmount.toLocaleString()}</p>
          </div>
        </div>
      `;
      const settings = await prisma.systemSetting.findUnique({ where: { id: 'default-settings' } });
      sendEmail({
        to: settings?.siteEmail || 'contact@tntclothing.com',
        subject: `🔔 New Order Placed: #${result.orderNumber}`,
        html: adminEmailHtml
      });
    } catch (err) {
      console.error('Failed to trigger background order emails:', err);
    }

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
      data: { orderStatus: 'RETURN_REQUESTED' }
    });

    return res.json({ success: true, message: 'Return request submitted successfully!', newReturn });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create return request', error: error.message });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized action' });
    }

    const allowedCancel = ['PENDING', 'CONFIRMED', 'PACKED'];
    if (!allowedCancel.includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled after it has been shipped.' });
    }

    await prisma.$transaction(async (tx) => {
      // Replenish stock
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { stock: { increment: item.quantity } }
        });
      }

      // Update status to CANCELLED
      await tx.order.update({
        where: { id: order.id },
        data: { orderStatus: 'CANCELLED' }
      });
    });

    return res.json({ success: true, message: 'Order cancelled successfully and inventory replenished.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to cancel order', error: error.message });
  }
};

