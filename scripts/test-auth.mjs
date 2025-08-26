import crypto from 'crypto';

const BASE = 'http://localhost:3000';

function randEmail() {
  return `test+${crypto.randomBytes(4).toString('hex')}@example.com`;
}

async function postForm(path, data) {
  const url = BASE + path;
  const body = new URLSearchParams(data);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    redirect: 'manual'
  });
  const headers = {};
  for (const [k, v] of res.headers) headers[k.toLowerCase()] = v;
  return { status: res.status, headers };
}

async function get(path, cookie) {
  const res = await fetch(BASE + path, { headers: cookie ? { Cookie: cookie } : {}, redirect: 'manual' });
  const headers = {};
  for (const [k, v] of res.headers) headers[k.toLowerCase()] = v;
  const text = await res.text();
  return { status: res.status, headers, text };
}

(async () => {
  const email = randEmail();
  const password = 'password123';
  console.log('Testing with', email);

  console.log('\n-- SIGNUP --');
  const signup = await postForm('/signup', { email, password });
  console.log('signup status', signup.status);
  console.log('signup headers', signup.headers);

  const setCookie = signup.headers['set-cookie'];
  if (!setCookie) console.log('No Set-Cookie from signup');
  else console.log('signup Set-Cookie:', setCookie);

  console.log('\n-- LOGIN --');
  const login = await postForm('/login', { email, password });
  console.log('login status', login.status);
  console.log('login headers', login.headers);
  const loginCookie = login.headers['set-cookie'];
  if (!loginCookie) console.log('No Set-Cookie from login');
  else console.log('login Set-Cookie:', loginCookie);

  const cookieToUse = loginCookie || setCookie;
  if (!cookieToUse) {
    console.log('\nNo cookie obtained, cannot test /new');
    process.exit(0);
  }

  // pick only token cookie value
  const tokenCookie = cookieToUse.split(';')[0];
  console.log('\n-- ACCESS /new with cookie --');
  const access = await get('/new', tokenCookie);
  console.log('GET /new status', access.status);
  console.log('GET /new headers', access.headers);
  console.log('GET /new body (trimmed):', access.text.slice(0,200));
})();
