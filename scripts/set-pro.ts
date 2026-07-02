// quick script to set user to pro
const { PrismaClient } = require("@prisma/client");

const POSTGRES_PRISMA_URL = process.env.POSTGRES_PRISMA_URL;
const POSTGRES_URL_NON_POOLING = process.env.POSTGRES_URL_NON_POOLING;

async function main() {
  const prisma = new PrismaClient();
  
  // Find all users
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, plan: true } });
  console.log("Users found:", users.length);
  users.forEach(u => console.log(`  - ${u.email} (${u.name || "no name"}) plan:${u.plan}`));
  
  // Set the first user to pro (presumably the owner)
  if (users.length > 0) {
    // Find the user with brittroshan23@gmail.com or just use the first one
    const targetEmail = "brittroshan23@gmail.com";
    let target = users.find(u => u.email === targetEmail);
    if (!target) target = users[0];
    
    const updated = await prisma.user.update({
      where: { id: target.id },
      data: { 
        plan: "pro",
        referralCode: "BRITT-PRO-2025"
      }
    });
    console.log(`\n✅ Set ${updated.email} to plan: ${updated.plan}, referralCode: ${updated.referralCode}`);
  }
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
