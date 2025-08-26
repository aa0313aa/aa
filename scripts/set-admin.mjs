import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const email = 'dksgytjd07@gmail.com';

(async () => {
  try {
    const user = await prisma.user.update({ where: { email }, data: { isAdmin: true } });
    console.log('[SET-ADMIN] updated user:', user);
    process.exit(0);
  } catch (err) {
    console.error('[SET-ADMIN] error:', err);
    process.exit(1);
  }
})();
