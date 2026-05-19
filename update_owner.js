const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateOwner() {
  const hashedPassword = await bcrypt.hash('clicco2026', 10);
  
  try {
    const updatedUser = await prisma.user.update({
      where: { username: 'owner' },
      data: {
        username: 'owner@clicco.id',
        password: hashedPassword
      }
    });
    console.log('User updated successfully:', updatedUser.username);
  } catch (error) {
    if (error.code === 'P2025') {
      console.log('User owner not found, checking if owner@clicco.id already exists...');
      const existing = await prisma.user.findUnique({ where: { username: 'owner@clicco.id' }});
      if (existing) {
        await prisma.user.update({
          where: { username: 'owner@clicco.id' },
          data: { password: hashedPassword }
        });
        console.log('User password updated successfully.');
      }
    } else {
      console.error('Error updating user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

updateOwner();
