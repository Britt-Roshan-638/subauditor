const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TEST_SUBSCRIPTIONS = [
  { name: "Netflix Premium", amount: 22.99, currency: "USD", frequency: "monthly", category: "Entertainment", status: "active" },
  { name: "Spotify Family", amount: 15.99, currency: "USD", frequency: "monthly", category: "Music", status: "active" },
  { name: "Google Drive 2TB", amount: 9.99, currency: "USD", frequency: "monthly", category: "Storage", status: "active" },
  { name: "Adobe Creative Cloud", amount: 54.99, currency: "USD", frequency: "monthly", category: "Productivity", status: "active" },
  { name: "Medium Membership", amount: 5.0, currency: "USD", frequency: "monthly", category: "News", status: "active" },
  { name: "Peloton Digital", amount: 12.99, currency: "USD", frequency: "monthly", category: "Health", status: "inactive" },
  { name: "Amazon Prime", amount: 139.0, currency: "USD", frequency: "yearly", category: "Shopping", status: "active" },
  { name: "Notion Plus", amount: 10.0, currency: "USD", frequency: "monthly", category: "Productivity", status: "trial" },
  { name: "The New York Times", amount: 4.0, currency: "USD", frequency: "weekly", category: "News", status: "active" },
  { name: "iCloud+ 200GB", amount: 2.99, currency: "USD", frequency: "monthly", category: "Storage", status: "active" },
  { name: "Headspace", amount: 69.99, currency: "USD", frequency: "yearly", category: "Health", status: "active" },
  { name: "Audible Premium Plus", amount: 14.95, currency: "USD", frequency: "monthly", category: "Entertainment", status: "active" },
];

const PRICE_CHANGES = {
  "Netflix Premium": [
    { oldAmount: 19.99, newAmount: 22.99, daysAgo: 45 },
    { oldAmount: 17.99, newAmount: 19.99, daysAgo: 120 },
  ],
  "Spotify Family": [
    { oldAmount: 14.99, newAmount: 15.99, daysAgo: 30 },
  ],
  "Google Drive 2TB": [
    { oldAmount: 9.99, newAmount: 9.99, daysAgo: 10 }, // no change
  ],
  "Adobe Creative Cloud": [
    { oldAmount: 52.99, newAmount: 54.99, daysAgo: 60 },
    { oldAmount: 49.99, newAmount: 52.99, daysAgo: 180 },
  ],
  "Amazon Prime": [
    { oldAmount: 119.0, newAmount: 139.0, daysAgo: 90 },
  ],
};

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'test@subauditor.com' } });
  if (!user) {
    console.log('User not found');
    return;
  }
  console.log('User:', user.id);

  let createdCount = 0;
  for (const subData of TEST_SUBSCRIPTIONS) {
    const existing = await prisma.subscription.findFirst({ where: { userId: user.id, name: subData.name } });
    if (existing) {
      console.log(`Skipping existing: ${subData.name}`);
      continue;
    }

    // Add date fields
    const d = new Date();
    d.setDate(d.getDate() - 5);
    const lastChargeDate = d;

    const d2 = new Date();
    d2.setDate(d2.getDate() + 25);
    const nextChargeDate = d2;

    const d3 = new Date();
    d3.setDate(d3.getDate() - 180);
    const startDate = d3;

    const sub = await prisma.subscription.create({
      data: { userId: user.id, ...subData, lastChargeDate, nextChargeDate, startDate },
    });

    createdCount++;
    console.log(`Created: ${subData.name}`);

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