import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: parseInt(process.env.SMTP_PORT) === 465, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  tls: {
    rejectUnauthorized: false
  }
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const fromUser = process.env.SMTP_USER || 'threadntones25@gmail.com';
    const info = await transporter.sendMail({
      from: `"TNT Support" <${fromUser}>`,
      to,
      subject,
      html,
    });
    console.log('✉️ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to dispatch email:', error.message);
    return { success: false, error: error.message };
  }
};
