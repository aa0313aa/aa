const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const http = require('http');

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

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/admin/users',
      method: 'GET',
      headers: {
        Cookie: `token=${token}`,
      },
    };

    const req = http.request(options, (res) => {
      console.log('STATUS:', res.statusCode);
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        console.log('BODY_SNIPPET:\n', data.slice(0, 2000));
        prisma.$disconnect();
      });
    });

    req.on('error', (err) => {
      console.error(err);
      prisma.$disconnect();
    });

    req.end();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
