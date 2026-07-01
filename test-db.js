const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Test connection
    const userCount = await prisma.user.count();
    console.log('✓ Database connection successful');
    console.log('  Total users in DB:', userCount);
    
    // Check for test user
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@subauditor.com' }
    });
    
    if (testUser) {
      console.log('✓ Test user found:', testUser.email);
      
      // Check if user has subscriptions
      const subscriptionCount = await prisma.subscription.count({
        where: { userId: testUser.id }
      });
      console.log('✓ User has', subscriptionCount, 'subscriptions');
      
      // Check for Plaid accounts
      const plaidAccountCount = await prisma.plaidAccount.count({
        where: { userId: testUser.id }
      });
      console.log('✓ User has', plaidAccountCount, 'Plaid accounts linked');
    } else {
      console.log('✗ Test user not found');
      
      // List all users
      const users = await prisma.user.findMany();
      console.log('Users in database:', users.map(u => u.email));
    }
  } catch (error) {
    console.error('✗ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
