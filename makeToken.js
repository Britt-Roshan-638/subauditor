const { encode } = require('next-auth/jwt');
const secret = process.env.NEXTAUTH_SECRET || 'REPLACE-WITH-NEW-SECRET-32-CHARS-MIN';

// User data from DB for test@subauditor.com
const token = {
  id: 'cmqqwyhtd0000jhrif0jpihf7',
  email: 'test@subauditor.com',
  name: 'Test User',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
};

(async () => {
  const jwtToken = await encode({
    secret,
    token,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
  console.log(jwtToken);
})();
