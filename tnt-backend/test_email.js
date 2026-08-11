import nodemailer from 'nodemailer';

const host = "smtp.gmail.com";
const port = 587;
const user = "threadntones25@gmail.com";
const pass = "gnro gdaa hfyh aree";

async function main() {
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: false, // true for 465, false for other ports
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false
    }
  });

  console.log('Sending test email via Gmail SMTP...');
  try {
    const info = await transporter.sendMail({
      from: `"TNT Support" <${user}>`,
      to: "threadntones25@gmail.com",
      subject: "Test email from TNT backend",
      text: "This is a test email to verify Gmail SMTP credentials."
    });
    console.log('SUCCESS:', info.messageId);
  } catch (error) {
    console.error('ERROR:', error);
  }
}

main().catch(console.error);
