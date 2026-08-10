import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { sendEmail } from '../utils/email.js';

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'tnt_luxury_streetwear_secret_key_2024', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Helper to generate and send OTP
const sendVerificationOTP = async (user) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

  // Deactivate old OTPs for this target
  await prisma.oTPVerification.updateMany({
    where: { target: user.email, isUsed: false },
    data: { isUsed: true }
  });

  // Save new OTP
  await prisma.oTPVerification.create({
    data: {
      userId: user.id,
      target: user.email,
      code,
      expiresAt,
      type: 'EMAIL_VERIFICATION'
    }
  });

  // Send Email via Nodemailer
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; padding: 25px; border: 1px solid #e5e5e7; max-width: 500px; margin: 0 auto; color: #111111;">
      <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px;">
        <span style="font-size: 24px; font-weight: 900;">TNT LUXURY STREETWEAR</span>
      </div>
      <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">Verify Your Email Address</h2>
      <p style="font-size: 14px; line-height: 1.6;">Thank you for registering at TNT. Please use the following 6-digit One-Time Password (OTP) to verify your account. This code is valid for 15 minutes.</p>
      <div style="text-align: center; margin: 25px 0;">
        <span style="font-size: 32px; font-weight: 900; letter-spacing: 4px; background: #f4f2ee; padding: 10px 20px; border-radius: 4px; border: 1px solid #e3e1dc;">${code}</span>
      </div>
      <p style="font-size: 12px; color: #6b6b6b; border-top: 1px solid #e5e5e7; padding-top: 15px; text-align: center;">If you did not request this code, please ignore this email.</p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: `Verify your TNT Account OTP - ${code}`,
    html: emailHtml
  });
};

export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone: phone || '' }] },
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email or phone already exists' });
    }

    const customerRole = await prisma.role.findFirst({ where: { name: 'CUSTOMER' } });
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        passwordHash,
        roleId: customerRole.id,
        isVerified: false, // Must verify OTP first
        rewardPoints: 320, // Default reward points balance
      },
      include: { role: true },
    });

    // Send OTP verification email
    await sendVerificationOTP(newUser);

    return res.status(201).json({
      success: true,
      requireVerification: true,
      email: newUser.email,
      message: 'Account registered. Verification OTP code has been sent to your email.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true, addresses: true, wishlist: { include: { items: true } } },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check OTP verification status
    if (!user.isVerified) {
      await sendVerificationOTP(user);
      return res.status(200).json({
        success: false,
        requireVerification: true,
        email: user.email,
        message: 'Account not verified. A verification OTP code has been sent to your email.'
      });
    }

    const token = generateToken(user.id);
    delete user.passwordHash;

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
};

// Verify OTP code
export const verifyOTP = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true, addresses: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find valid OTP record
    const otpRecord = await prisma.oTPVerification.findFirst({
      where: {
        userId: user.id,
        code,
        isUsed: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    // Mark OTP as used and user as verified
    await prisma.oTPVerification.update({
      where: { id: otpRecord.id },
      data: { isUsed: true }
    });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
      include: { role: true, addresses: true }
    });

    const token = generateToken(updatedUser.id);
    delete updatedUser.passwordHash;

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: 'Account verified successfully!',
      token,
      user: updatedUser
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Verification failed', error: error.message });
  }
};

// Resend OTP code
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await sendVerificationOTP(user);

    return res.json({
      success: true,
      message: 'Verification OTP code has been resent to your email.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to resend OTP', error: error.message });
  }
};

// Google OAuth Sign-in/Sign-up
export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential token is missing' });
    }

    // Verify ID Token with Google Info Endpoint
    const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!tokenInfoRes.ok) {
      return res.status(400).json({ success: false, message: 'Failed to verify Google credential token' });
    }

    const payload = await tokenInfoRes.json();
    const { email, given_name, family_name, picture, email_verified } = payload;

    if (!email_verified) {
      return res.status(400).json({ success: false, message: 'Google account email is not verified' });
    }

    let user = await prisma.user.findUnique({
      where: { email },
      include: { role: true, addresses: true }
    });

    if (!user) {
      // Register user automatically
      const customerRole = await prisma.role.findFirst({ where: { name: 'CUSTOMER' } });
      user = await prisma.user.create({
        data: {
          firstName: given_name || 'Google User',
          lastName: family_name || '',
          email,
          avatar: picture || '',
          passwordHash: '', // OAuth users have blank local password
          isVerified: true,  // verified by Google
          roleId: customerRole.id,
          rewardPoints: 320
        },
        include: { role: true, addresses: true }
      });
    } else {
      // Update details
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          avatar: user.avatar || picture || '',
          isVerified: true
        },
        include: { role: true, addresses: true }
      });
    }

    const token = generateToken(user.id);
    delete user.passwordHash;

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: 'Logged in successfully with Google',
      token,
      user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Google login failed', error: error.message });
  }
};

export const getProfile = async (req, res) => {
  return res.json({
    success: true,
    user: req.user,
  });
};

export const logout = async (req, res) => {
  res.clearCookie('token');
  return res.json({ success: true, message: 'Logged out successfully' });
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, email, phone, password } = req.body;

    const data = { firstName, lastName, email, phone };
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      include: { role: true, addresses: true }
    });

    delete updatedUser.passwordHash;
    return res.json({ success: true, message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
  }
};
