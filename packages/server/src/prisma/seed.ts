import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ── 默认配置 ──────────────────────────────────────────
  const defaultFormFields = [
    { key: 'retouch_tier', label: '修图档位', type: 'select', required: true, options: ['普通', '精修'] },
    { key: 'extra_items', label: '附加项目', type: 'multi_select', required: false, options: ['大面积头发', 'bug修复', '加急'] },
    { key: 'cos_role', label: '角色', type: 'text', required: false, options: [] },
    { key: 'contact_method', label: '联系方式', type: 'select', required: true, options: ['微信', 'QQ'] },
    { key: 'contact_value', label: '联系方式号码', type: 'text', required: true, options: [] },
  ];

  const configs = [
    { key: 'default_max_slots', value: '5' },
    { key: 'booking_days', value: '30' },
    { key: 'rest_days_of_week', value: '[0]' },
    { key: 'extra_rest_dates', value: '[]' },
    { key: 'extra_work_dates', value: '[]' },
    { key: 'booking_form_fields', value: JSON.stringify(defaultFormFields) },
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
