const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'test@subauditor.com';
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log('User already exists:', existing.id);
    await prisma.user.update({
      where: { id: existing.id },
      data: { plan: 'pro', referralCode: 'TEST-PRO' }
    });
    console.log('Updated to Pro');
    return;
  }

  const hashedPassword = await bcrypt.hash('testpassword123', 12);
  const user = await prisma.user.create({
    data: {
      email,
      name: 'Test User',
      password: hashedPassword,
      plan: 'pro',
      referralCode: 'TEST-PRO',
    }
  });
  console.log('Created user:', user.id);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());