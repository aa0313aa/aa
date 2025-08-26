const {PrismaClient} = require('@prisma/client');
const http = require('http');
const qs = require('querystring');
(async()=>{
  const prisma = new PrismaClient();
  try{
    const user = await prisma.user.findFirst({orderBy:{createdAt:'desc'}});
    if(!user){console.error('NO_USER');process.exit(1)}
    const postData = qs.stringify({ email: user.email });
    const options = { hostname: '127.0.0.1', port: 3000, path: '/reset/request', method: 'POST', headers: { 'Content-Type':'application/x-www-form-urlencoded', 'Content-Length': postData.length } };
    const req = http.request(options,res=>{console.log('STATUS',res.statusCode); let d=''; res.on('data',c=>d+=c); res.on('end',()=>{console.log('BODY',d.slice(0,2000)); prisma.$disconnect();});});
    req.on('error',e=>{console.error(e); prisma.$disconnect();});
    req.write(postData); req.end();
  }catch(e){console.error(e);process.exit(1)}
})()
