const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d; }
function daysFromNow(n) { const d = new Date(); d.setDate(d.getDate() + n); return d; }

const TEST_SUBSCRIPTIONS = [
  { name: "Netflix Premium", amount: 22.99, currency: "USD", frequency: "monthly", category: "Entertainment", status: "active", lastChargeDate: daysAgo(5), nextChargeDate: daysFromNow(25), startDate: daysAgo(180) },
  { name: "Spotify Family", amount: 15.99, currency: "USD", frequency: "monthly", category: "Music", status: "active", lastChargeDate: daysAgo(3), nextChargeDate: daysFromNow(27), startDate: daysAgo(365) },
  { name: "Google Drive 2TB", amount: 9.99, currency: "USD", frequency: "monthly", category: "Storage", status: "active", lastChargeDate: daysAgo(10), nextChargeDate: daysFromNow(20), startDate: daysAgo(90) },
  { name: "Adobe Creative Cloud", amount: 54.99, currency: "USD", frequency: "monthly", category: "Productivity", status: "active", lastChargeDate: daysAgo(2), nextChargeDate: daysFromNow(28), startDate: daysAgo(240) },
  { name: "Medium Membership", amount: 5.0, currency: "USD", frequency: "monthly", category: "News", status: "active", lastChargeDate: daysAgo(7), nextChargeDate: daysFromNow(23), startDate: daysAgo(45) },
  { name: "Peloton Digital", amount: 12.99, currency: "USD", frequency: "monthly", category: "Health", status: "inactive", lastChargeDate: daysAgo(60), nextChargeDate: daysFromNow(-1), startDate: daysAgo(120) },
  { name: "Amazon Prime", amount: 139.0, currency: "USD", frequency: "yearly", category: "Shopping", status: "active", lastChargeDate: daysAgo(30), nextChargeDate: daysFromNow(335), startDate: daysAgo(60) },
];

async function main() {
  const userId = 'cmr4h24mm0000rzy6b8xpci2j';

  // First, delete existing subscriptions for this user
  await prisma.subscription.deleteMany({ where: { userId } });

  for (const subData of TEST_SUBSCRIPTIONS) {
    const sub = await prisma.subscription.create({
      data: { userId, ...subData }
    });
    console.log('Created:', sub.name, sub.amount, sub.frequency);
  }
  console.log('Done!');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });