const { PrismaClient } = require('@prisma/client');
const { signTempToken } = require('../src/lib/auth');
const { sendMail } = require('../src/lib/mailer');

(async () => {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!user) return console.error('no user');
    const token = signTempToken({ id: user.id, purpose: 'verify-email' }, '6h');
    const site = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000';
    const verifyUrl = new URL(`/verify/${token}`, site).toString();
    const info = await sendMail({ to: user.email, subject: '이메일 확인 테스트', html: `<p><a href="${verifyUrl}">${verifyUrl}</a></p>` });
    console.log('sent', info && info.messageId);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
