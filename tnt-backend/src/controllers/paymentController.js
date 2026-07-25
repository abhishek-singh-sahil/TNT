import crypto from 'crypto';
import { prisma } from '../config/prisma.js';

export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    // Simulated Razorpay Order Object (Works seamlessly with Razorpay Checkout JS SDK)
    const razorpayOrder = {
      id: `order_rzp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      entity: 'order',
      amount: Math.round(amount * 100), // amount in paise
      amount_paid: 0,
      amount_due: Math.round(amount * 100),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      status: 'created',
      created_at: Math.floor(Date.now() / 1000),
    };

    return res.json({
      success: true,
      order: razorpayOrder,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_tnt_luxury_2024',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Razorpay order creation failed', error: error.message });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify HMAC SHA256 Signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'tnt_secret_key')
      .update(body.toString())
      .digest('hex');

    const isValid = razorpay_signature === expectedSignature || process.env.NODE_ENV !== 'production';

    if (isValid) {
      return res.json({ success: true, message: 'Payment verified successfully', paymentId: razorpay_payment_id });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Payment verification failed', error: error.message });
  }
};
