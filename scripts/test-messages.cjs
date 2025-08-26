const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const http = require('http');

const prisma = new PrismaClient();

async function run() {
  try {
    const senderEmail = 'dksgytjd07@gmail.com';
    const receiverEmail = 'user2@example.com';

    // ensure receiver exists
    let receiver = await prisma.user.findUnique({ where: { email: receiverEmail } });
    if (!receiver) {
      receiver = await prisma.user.create({ data: { email: receiverEmail, password: '$2b$10$examplehash', name: 'User Two' } });
      console.log('Created receiver:', receiver.email);
    }

    const sender = await prisma.user.findUnique({ where: { email: senderEmail } });
    if (!sender) throw new Error('Sender missing');

    const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
    const token = jwt.sign({ id: sender.id, email: sender.email }, secret, { expiresIn: '7d' });

    // send message via HTTP POST to /messages/compose form action is server action so we simulate by direct POST to /api/send-message if it existed;
    // app currently uses server action on the page, so we'll create message directly via Prisma to simulate user action and then test inbox endpoints.
    const msg = await prisma.message.create({ data: { senderId: sender.id, receiverId: receiver.id, content: '테스트 메시지 ' + Date.now() } });
    console.log('Created message id', msg.id);

    // fetch inbox page to see message
    await fetchPage('/messages', token);

    // mark read via direct DB update to simulate action
    await prisma.message.update({ where: { id: msg.id }, data: { read: true } });
    console.log('Marked read in DB for', msg.id);

    // fetch inbox page again
    await fetchPage('/messages', token);

    // create admin token for sender if not admin
    await prisma.user.update({ where: { id: sender.id }, data: { isAdmin: true } });
    const adminToken = jwt.sign({ id: sender.id, email: sender.email }, secret, { expiresIn: '7d' });
    await fetchPage('/admin/messages', adminToken);

    // delete message via direct DB delete
    await prisma.message.delete({ where: { id: msg.id } });
    console.log('Deleted message', msg.id);

    await fetchPage('/admin/messages', adminToken);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

function fetchPage(path, token) {
  return new Promise((resolve, reject) => {
    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    const options = {
      hostname: 'localhost',
      port,
      path,
      method: 'GET',
      headers: {
        Cookie: `token=${token}`,
      },
    };
    const req = http.request(options, (res) => {
      console.log('GET', path, '->', res.statusCode);
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        console.log('BODY snippet:', data.slice(0, 500));
        resolve();
      });
    });
    req.on('error', reject);
    req.end();
  });
}

run();
