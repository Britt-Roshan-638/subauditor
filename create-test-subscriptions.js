const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

const TEST_SUBSCRIPTIONS = [
  { name: "Netflix Premium", amount: 22.99, currency: "USD", frequency: "monthly", category: "Entertainment", status: "active", lastChargeDate: daysAgo(5), nextChargeDate: daysFromNow(25), startDate: daysAgo(180) },
  { name: "Spotify Family", amount: 15.99, currency: "USD", frequency: "monthly", category: "Music", status: "active", lastChargeDate: daysAgo(3), nextChargeDate: daysFromNow(27), startDate: daysAgo(365) },
  { name: "Google Drive 2TB", amount: 9.99, currency: "USD", frequency: "monthly", category: "Storage", status: "active", lastChargeDate: daysAgo(10), nextChargeDate: daysFromNow(20), startDate: daysAgo(90) },
  { name: "Adobe Creative Cloud", amount: 54.99, currency: "USD", frequency: "monthly", category: "Productivity", status: "active", lastChargeDate: daysAgo(2), nextChargeDate: daysFromNow(28), startDate: daysAgo(240) },
  { name: "Medium Membership", amount: 5.0, currency: "USD", frequency: "monthly", category: "News", status: "active", lastChargeDate: daysAgo(7), nextChargeDate: daysFromNow(23), startDate: daysAgo(45) },
  { name: "Peloton Digital", amount: 12.99, currency: "USD", frequency: "monthly", category: "Health", status: "inactive", lastChargeDate: daysAgo(60), nextChargeDate: daysFromNow(-1), startDate: daysAgo(120) },
  { name: "Amazon Prime", amount: 139.0, currency: "USD", frequency: "yearly", category: "Shopping", status: "active", lastChargeDate: daysAgo(30), nextChargeDate: daysFromNow(335), startDate: daysAgo(60) },
  { name: "Notion Plus", amount: 10.0, currency: "USD", frequency: "monthly", category: "Productivity", status: "trial", lastChargeDate: daysAgo(1), nextChargeDate: daysFromNow(13), startDate: daysAgo(1) },
  { name: "The New York Times", amount: 4.0, currency: "USD", frequency: "weekly", category: "News", status: "active", lastChargeDate: daysAgo(4), nextChargeDate: daysFromNow(3), startDate: daysAgo(200) },
  { name: "iCloud+ 200GB", amount: 2.99, currency: "USD", frequency: "monthly", category: "Storage", status: "active", lastChargeDate: daysAgo(8), nextChargeDate: daysFromNow(22), startDate: daysAgo(400) },
  { name: "Headspace", amount: 69.99, currency: "USD", frequency: "yearly", category: "Health", status: "active", lastChargeDate: daysAgo(15), nextChargeDate: daysFromNow(350), startDate: daysAgo(15) },
  { name: "Audible Premium Plus", amount: 14.95, currency: "USD", frequency: "monthly", category: "Entertainment", status: "active", lastChargeDate: daysAgo(6), nextChargeDate: daysFromNow(24), startDate: daysAgo(300) },
];

const PRICE_CHANGES = {
  "Netflix Premium": [ { oldAmount: 15.99, newAmount: 22.99, daysAgo: 30 }, { oldAmount: 13.99, newAmount: 15.99, daysAgo: 180 } ],
  "Spotify Family": [ { oldAmount: 14.99, newAmount: 15.99, daysAgo: 45 } ],
  "Adobe Creative Cloud": [ { oldAmount: 52.99, newAmount: 54.99, daysAgo: 60 } ],
};

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'test@subauditor.com' } });
  if (!user) {
    console.log('User not found');
    return;
  }
  console.log('User:', user.id);

  // Create test subscriptions
  let createdCount = 0;
  for (const subData of TEST_SUBSCRIPTIONS) {
    const existing = await prisma.subscription.findFirst({ where: { userId: user.id, name: subData.name } });
    if (existing) continue;

    const sub = await prisma.subscription.create({
      data: { userId: user.id, ...subData },
    });

    createdCount++;

    // Add price changes
    const changes = PRICE_CHANGES[subData.name];
    if (changes) {
      for (const change of changes) {
        await prisma.priceChange.create({
          data: { subscriptionId: sub.id, oldAmount: change.oldAmount, newAmount: change.newAmount, detectedAt: daysAgo(change.daysAgo) },
        });
      }
    }
  }
  console.log(`Created ${createdCount} test subscriptions`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());