import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ── 默认配置 ──────────────────────────────────────────
  const configs = [
    { key: 'default_max_slots', value: '5' },
    { key: 'booking_range_days', value: '30' },
    { key: 'rest_days_of_week', value: '[0]' },
    { key: 'extra_rest_dates', value: '[]' },
  ];

  for (const cfg of configs) {
    await prisma.config.upsert({
      where: { key: cfg.key },
      create: cfg,
      update: { value: cfg.value },
    });
  }

  console.log('✅ Seed complete: default configs inserted.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
