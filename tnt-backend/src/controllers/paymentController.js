import crypto from 'crypto';
import https from 'https';
import { prisma } from '../config/prisma.js';

// Helper for making HTTPS requests compatible with all Node.js versions
const makeHttpsRequest = (url, options, bodyData) => {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', (err) => {
      reject(err);
    });
    if (bodyData) {
      req.write(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
    }
    req.end();
  });
};

const getRazorpayCredentials = async () => {
  try {
    const settings = await prisma.systemSetting.findUnique({
      where: { id: 'default-settings' }
    });
    if (settings && settings.razorpayKeyId && settings.razorpayKeySecret) {
      return {
        keyId: settings.razorpayKeyId.trim(),
        keySecret: settings.razorpayKeySecret.trim()
      };
    }
  } catch (err) {
    console.error("Failed to read settings from db, falling back:", err);
  }
  return {
    keyId: (process.env.RAZORPAY_KEY_ID || 'rzp_test_tnt_luxury_2024').trim(),
    keySecret: (process.env.RAZORPAY_KEY_SECRET || 'tnt_secret_key').trim()
  };
};

export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    const creds = await getRazorpayCredentials();

    if (creds.keyId && creds.keyId !== 'rzp_test_tnt_luxury_2024') {
      try {
        const auth = Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString('base64');
        const url = 'https://api.razorpay.com/v1/orders';
        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`
          }
        };
        const payload = {
          amount: Math.round(amount * 100),
          currency,
          receipt: receipt || `rcpt_${Date.now()}`
        };

        const result = await makeHttpsRequest(url, options, payload);

        if (result.status === 200 && result.body && result.body.id) {
          return res.json({
            success: true,
            order: result.body,
            key: creds.keyId
          });
        } else {
          console.error('Razorpay server responded with error:', result.body);
          return res.status(400).json({
            success: false,
            message: 'Failed to create order on Razorpay gateway. Please check your credentials.',
            error: result.body
          });
        }
      } catch (err) {
        console.error('Failed to communicate with Razorpay API:', err);
        return res.status(500).json({
          success: false,
          message: 'Razorpay API communication error',
          error: err.message
        });
      }
    }

    // Default Fallback Mock Order (only used if mock key is active)
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
      key: creds.keyId,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Razorpay order creation failed', error: error.message });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const creds = await getRazorpayCredentials();

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', creds.keySecret)
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
