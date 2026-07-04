const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findUnique({ where: { email: 'test@subauditor.com' }}).then(u => { console.log(u); prisma.$disconnect(); });