const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const data = [
    { name: 'BCA 001', balance: 4550825 },
    { name: 'BCA Khusniayana', balance: 3829584 },
    { name: 'BRI', balance: 3608811 },
    { name: 'MANDIRI', balance: 1013000 },
    { name: 'CASH / TUNAI', balance: 487479 },
    { name: 'OVO', balance: 282893 },
    { name: 'LINE BANK', balance: 22335 },
    { name: 'BCA IKA', balance: 1027967 },
    { name: 'MANDIRI CV', balance: 205142413 },
    { name: 'BRI CV', balance: 318948951 },
    { name: 'BRI VALAS', balance: 826306 },
    { name: 'SALDO MARKETING', balance: 7453023 },
    { name: 'MANDIRI IKLAN 1', balance: 128074 },
    { name: 'MANDIRI IKLAN 2', balance: 440503 },
    { name: 'MANDIRI IKLAN 3', balance: 2657662 },
    { name: 'MANDIRI IKLAN 4', balance: 1850230 },
    { name: 'JENIUS', balance: -1090970 },
    { name: 'SHOPEE PAY', balance: 102 },
    { name: 'DANA', balance: 214319 }
];

async function main() {
    console.log("Updating bank account balances...");

    for (const bank of data) {
        // Try to update it if it exists (case insensitive isn't directly supported by Prisma's unique find, so we find first, then create/update)
        
        let existingBank = await prisma.bankAccount.findFirst({
            where: {
                name: {
                    equals: bank.name,
                    mode: 'insensitive' // Requires postgres
                }
            }
        });

        if (existingBank) {
            await prisma.bankAccount.update({
                where: { id: existingBank.id },
                data: { realBalance: bank.balance, name: bank.name }
            });
            console.log(`Updated ${bank.name} -> Rp ${bank.balance}`);
        } else {
            await prisma.bankAccount.create({
                data: { name: bank.name, realBalance: bank.balance }
            });
            console.log(`Created ${bank.name} -> Rp ${bank.balance}`);
        }
    }

    // Now, there's a problem: 'TUNAI' is probably known as 'CASH / TUNAI' inside Prisma right now.
    // Let's manually ensure we merge 'TUNAI' and 'CASH / TUNAI' and 'CASH' so they don't split up the P&L logic.
    const allBanks = await prisma.bankAccount.findMany({ select: { id: true, name: true }});
    // Find all 'cash' 'tunai' named banks and potentially merge them if needed. But for now, we just update the specific ones the user asked for.
    console.log("SUCCESS");
}

main().catch(console.error).finally(() => prisma.$disconnect());
