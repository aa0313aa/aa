import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import fetchPkg from 'node-fetch';
const fetch = globalThis.fetch || fetchPkg;

 (async () => {
  const prisma = new PrismaClient();
  try {
    const email = 'dksgytjd07@gmail.com';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error('NO_USER');
      process.exit(1);
    }
    const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
    const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '7d' });
    const res = await fetch('http://localhost:3000/admin/users', { headers: { cookie: `token=${token}` } });
    console.log('STATUS:', res.status);
    const text = await res.text();
    console.log('BODY_SNIPPET:\n', text.slice(0, 2000));
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
