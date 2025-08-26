const {PrismaClient} = require('@prisma/client');
const jwt = require('jsonwebtoken');
const http = require('http');

(async () => {
  const prisma = new PrismaClient();
  try {
    let admin = await prisma.user.findFirst({ where: { isAdmin: true } });
    if (!admin) {
      const latest = await prisma.user.findFirst({ orderBy: { createdAt: 'desc' } });
      if (!latest) {
        console.error('NO_USERS');
        process.exit(1);
      }
      admin = await prisma.user.update({ where: { id: latest.id }, data: { isAdmin: true } });
      console.log('Promoted to admin:', admin.id, admin.email);
    } else {
      console.log('Found admin:', admin.id, admin.email);
    }

    const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
    const token = jwt.sign({ id: admin.id, email: admin.email }, secret, { expiresIn: '7d' });

    async function doReq(path, host) {
      return new Promise((resolve) => {
        const options = {
          hostname: host,
          port: 3000,
          path,
          method: 'GET',
          family: host.includes(':') ? 6 : 4,
          headers: {
            Cookie: `token=${token}`,
          },
        };
        const req = http.request(options, (res) => {
          console.log('REQ', host, path, 'STATUS', res.statusCode);
          let d = '';
          res.on('data', (c) => (d += c));
          res.on('end', () => {
            console.log('BODY_SNIPPET', host, path, d.slice(0, 1500));
            resolve();
          });
        });
        req.on('error', (e) => {
          console.error('ERR', host, path, e.message);
          resolve();
        });
        req.end();
      });
    }

    await doReq('/admin/users', '::1');
    await doReq(`/admin/users/${admin.id}/posts`, '::1');
    await prisma.$disconnect();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
