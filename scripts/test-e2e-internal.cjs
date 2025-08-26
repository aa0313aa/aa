const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

(async () => {
  const prisma = new PrismaClient();
  try {
    const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
    const email = `e2e+internal+${Date.now()}@example.com`;
    console.log('Creating user', email);
    const user = await prisma.user.create({ data: { email, password: 'placeholder', name: 'E2E Internal', emailVerified: false } });
    console.log('Created user id', user.id);

    // create temp verification token and verify it (simulate clicking the email link)
    const tempToken = jwt.sign({ id: user.id }, secret, { expiresIn: '1h' });
    console.log('Temp token:', tempToken.slice(0, 40) + '...');
    const decoded = jwt.verify(tempToken, secret);
    if (!decoded || !decoded.id) throw new Error('Temp token verify failed');

    // mark email verified in DB (simulate verify route)
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
    const fresh = await prisma.user.findUnique({ where: { id: user.id } });
    console.log('Email verified in DB:', fresh.emailVerified);
    if (!fresh.emailVerified) throw new Error('emailVerified not set');

    // create a post as this user (simulate API server-side creation)
    const post = await prisma.post.create({ data: { title: 'E2E Internal Post', slug: `e2e-internal-${Date.now()}`, content: 'internal e2e content', authorId: user.id } });
    console.log('Created post id', post.id);

    const saved = await prisma.post.findUnique({ where: { id: post.id } });
    console.log('Post authorId in DB:', saved.authorId, 'expected:', user.id);
    if (saved.authorId !== user.id) throw new Error('authorId mismatch');

    // cleanup (optional)
    // await prisma.post.delete({ where: { id: post.id } });
    // await prisma.user.delete({ where: { id: user.id } });

    await prisma.$disconnect();
    console.log('Internal E2E successful');
  } catch (e) {
    console.error('E2E failed:', e);
    try { await prisma.$disconnect(); } catch{};
    process.exit(1);
  }
})();
