const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({
  datasources: { db: { url: 'mysql://root:pixbook_root@localhost:3306/pixbook' } },
});

async function main() {
  // Shift existing orders: status 1→2, 2→3, 3→4, 4→5 (insert CONFIRMED at 1)
  const r = await p.$executeRawUnsafe(`UPDATE pixbook.orders SET status = status + 1 WHERE status >= 1`);
  console.log('Migrated', r, 'rows');
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e.message);
  p.$disconnect();
});
