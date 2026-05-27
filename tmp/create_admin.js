const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      role: 'OWNER'
    }
  });
  
  console.log('Admin user created:', admin.username);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
