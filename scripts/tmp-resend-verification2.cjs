const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

(async () => {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!user) return console.error('no user');

    const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
    const token = jwt.sign({ id: user.id, purpose: 'verify-email' }, secret, { expiresIn: '6h' });
    const site = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000';
    const verifyUrl = new URL(`/verify/${token}`, site).toString();

    // create test account and transport
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email', port: 587, auth: { user: testAccount.user, pass: testAccount.pass }
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'no-reply@example.com',
      to: user.email,
      subject: '이메일 확인 테스트',
      html: `<p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });

    console.log('sent messageId', info.messageId);
    const url = nodemailer.getTestMessageUrl(info);
    if (url) console.log('[MAIL] preview URL:', url);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
