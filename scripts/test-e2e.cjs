const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const http = require('http');

(async () => {
  const prisma = new PrismaClient();
  try {
    const email = `e2e+${Date.now()}@example.com`;
    console.log('Creating user', email);
    const user = await prisma.user.create({ data: { email, password: 'placeholder', name: 'E2E Tester', emailVerified: false } });
    console.log('Created user id', user.id);

    const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
    const tempToken = jwt.sign({ id: user.id }, secret, { expiresIn: '1h' });
    console.log('Temp token created');

    // call verify route
    await new Promise((resolve) => {
      const options = { hostname: '127.0.0.1', port: 3000, path: `/verify/${tempToken}`, method: 'GET' };
      const req = http.request(options, (res) => {
        console.log('VERIFY STATUS', res.statusCode);
        res.on('data', () => {});
        res.on('end', resolve);
      });
      req.on('error', (e) => { console.error('VERIFY ERR', e); resolve(); });
      req.end();
    });

    const fresh = await prisma.user.findUnique({ where: { id: user.id } });
    console.log('After verify emailVerified=', fresh.emailVerified);
    if (!fresh.emailVerified) {
      console.error('Email verification failed');
      process.exit(1);
    }

    // create session token
    const session = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '7d' });

    // post to /api/posts
    const postData = JSON.stringify({ title: 'E2E Test Post', content: 'This is a test post from E2E script', tags: ['test', 'e2e'] });
    await new Promise((resolve) => {
      const options = {
        hostname: '127.0.0.1', port: 3000, path: '/api/posts', method: 'POST',
        headers: {
          'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData),
          'Cookie': `token=${session}`
        }
      };
      const req = http.request(options, (res) => {
        console.log('POST /api/posts STATUS', res.statusCode);
        let d = '';
        res.on('data', (c) => d += c);
        res.on('end', async () => {
          console.log('POST BODY', d.slice(0,1000));
          if (res.statusCode === 201) {
            const p = JSON.parse(d);
            const byDb = await prisma.post.findUnique({ where: { id: p.id } });
            console.log('Post saved with authorId=', byDb.authorId);
            if (byDb.authorId !== user.id) console.error('Author mismatch');
          }
          resolve();
        });
      });
      req.on('error', (e) => { console.error('POST ERR', e); resolve(); });
      req.write(postData);
      req.end();
    });

    await prisma.$disconnect();
    console.log('E2E done');
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
