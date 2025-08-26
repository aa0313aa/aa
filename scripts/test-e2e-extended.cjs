const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

(async () => {
  const prisma = new PrismaClient();
  try {
    const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
    const email = `e2e+ext+${Date.now()}@example.com`;
    const password = 'Password123!';
    console.log('Creating user', email);
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hashed, name: 'E2E Extended', emailVerified: false } });
    console.log('Created user id', user.id);

    // simulate sending and using verification token
    const tempToken = jwt.sign({ id: user.id }, secret, { expiresIn: '1h' });
    console.log('Temp token preview:', tempToken.slice(0,40) + '...');
    // verify token
    const decoded = jwt.verify(tempToken, secret);
    if (!decoded || !decoded.id) throw new Error('temp token verify failed');
    // mark verified
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
    const fresh = await prisma.user.findUnique({ where: { id: user.id } });
    if (!fresh.emailVerified) throw new Error('emailVerified not set');
    console.log('Email verified');

    // create JWT session token (simulate sign-in)
    const session = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '7d' });
    const verifySession = jwt.verify(session, secret);
    if (!verifySession || !verifySession.id) throw new Error('session token failed');
    console.log('Session token ok');

    // create a post
    const slug = `e2e-ext-${Date.now()}`;
    const post = await prisma.post.create({ data: { title: 'E2E Extended Post', slug, content: 'extended content', authorId: user.id } });
    console.log('Created post', post.id);

    // update post
    await prisma.post.update({ where: { id: post.id }, data: { title: 'E2E Extended Post (edited)', content: 'edited content' } });
    const edited = await prisma.post.findUnique({ where: { id: post.id } });
    if (edited.title.indexOf('edited') === -1) throw new Error('edit failed');
    console.log('Edit verified');

    // messaging: user -> user (self-message) create and read
    const msg = await prisma.message.create({ data: { senderId: user.id, receiverId: user.id, content: 'hello self' } });
    const inbox = await prisma.message.findMany({ where: { receiverId: user.id } });
    if (!inbox.length) throw new Error('message not saved');
    console.log('Message saved and readable');

    // delete post
    await prisma.post.delete({ where: { id: post.id } });
    const gone = await prisma.post.findUnique({ where: { id: post.id } });
    if (gone) throw new Error('post not deleted');
    console.log('Post deleted successfully');

  // cleanup messages and user
  await prisma.message.deleteMany({ where: { OR: [{ senderId: user.id }, { receiverId: user.id }] } });
  await prisma.user.delete({ where: { id: user.id } });

    await prisma.$disconnect();
    console.log('Extended internal E2E successful');
  } catch (e) {
    console.error('Extended E2E failed:', e);
    try { await prisma.$disconnect(); } catch {};
    process.exit(1);
  }
})();
