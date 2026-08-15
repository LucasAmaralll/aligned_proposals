const prisma = require('../src/lib/prisma');
const bcrypt = require('bcryptjs');
const { ensureRoles } = require('../src/services/tenant.service');

async function seedPlans() {
  const existingPlans = await prisma.plan.findMany();
  if (existingPlans.length > 0) {
    console.log(`Planos já existem (${existingPlans.length}).`);
    return;
  }

  const plans = [
    {
      name: 'Gratuito',
      price: 0,
      quotesLimit: 5,
      hasWatermark: true,
      features: [
        '5 orçamentos por mês',
        'PDF com marca d\'água',
        'Cadastro de clientes',
      ],
    },
    {
      name: 'Básico',
      price: 29.9,
      quotesLimit: 50,
      hasWatermark: false,
      features: ['50 orçamentos por mês', 'PDF sem marca d\'água'],
    },
    {
      name: 'Pro',
      price: 79.9,
      quotesLimit: -1,
      hasWatermark: false,
      features: ['Orçamentos ilimitados', 'Relatórios'],
    },
  ];

  for (const planData of plans) {
    await prisma.plan.create({ data: planData });
    console.log(`Plano "${planData.name}" criado.`);
  }
}

async function upsertCompany({ name, slug, document, units }) {
  const company = await prisma.company.upsert({
    where: { slug },
    update: { name, document, active: true },
    create: {
      name,
      slug,
      document,
      units: {
        create: units,
      },
    },
    include: { units: true },
  });

  for (const unit of units) {
    await prisma.unit.upsert({
      where: {
        companyId_name: {
          companyId: company.id,
          name: unit.name,
        },
      },
      update: { type: unit.type, active: true },
      create: {
        companyId: company.id,
        name: unit.name,
        type: unit.type,
      },
    });
  }

  return prisma.company.findUnique({
    where: { id: company.id },
    include: { units: { orderBy: { name: 'asc' } } },
  });
}

async function upsertDemoUser({ email, name, password, company, role, unitNames, commissionRate, salary }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Usuário ${email} já existe.`);
    return existing;
  }

  const hashed = await bcrypt.hash(password, 10);
  const freePlan = await prisma.plan.findUnique({ where: { name: 'Gratuito' } });
  const units = company.units.filter((unit) => unitNames.includes(unit.name));

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashed,
      companyName: company.name,
      companyId: company.id,
      roleId: role.id,
      commissionRate: commissionRate ?? null,
      salary: salary ?? null,
      planId: freePlan?.id,
      subscriptionStatus: 'active',
      units: {
        create: units.map((unit) => ({ unitId: unit.id })),
      },
    },
  });

  console.log(`Usuário ${email} criado (${role.name} @ ${company.name}).`);
  return user;
}

async function renameLegacyCompanies() {
  await prisma.company.updateMany({
    where: { slug: 'reversa' },
    data: { name: 'Reveza', slug: 'reveza' },
  });
  await prisma.company.updateMany({
    where: { slug: 'reza' },
    data: { name: 'Rezza', slug: 'rezza' },
  });

  const reveza = await prisma.company.findUnique({ where: { slug: 'reveza' } });
  const rezza = await prisma.company.findUnique({ where: { slug: 'rezza' } });

  if (reveza) {
    await prisma.user.updateMany({
      where: { email: 'leo.a@example.org' },
      data: {
        email: 'samuel.w@example.com',
        name: 'Admin Reveza',
        companyName: 'Reveza',
      },
    });
  }

  if (rezza) {
    await prisma.user.updateMany({
      where: { email: 'james.b@example.com' },
      data: {
        email: 'uma.s@example.org',
        name: 'Admin Rezza',
        companyName: 'Rezza',
      },
    });
  }
}

async function seedCategories(company) {
  const names = ['Camisetas', 'Calças', 'Acessórios'];
  for (const name of names) {
    await prisma.category.upsert({
      where: {
        companyId_name: { companyId: company.id, name },
      },
      update: { active: true },
      create: { companyId: company.id, name },
    });
  }
  console.log(`Categorias padrão em ${company.name}.`);
}

async function main() {
  console.log('Seed: papéis, empresas e usuários demo');

  await renameLegacyCompanies();

  const roles = await ensureRoles();
  console.log('Papéis: admin, manager, seller');

  await seedPlans();

  const reveza = await upsertCompany({
    name: 'Reveza',
    slug: 'reveza',
    document: null,
    units: [
      { name: 'Loja 1', type: 'store' },
      { name: 'Loja 2', type: 'store' },
      { name: 'Fábrica', type: 'factory' },
    ],
  });
  console.log('Empresa Reveza: Loja 1, Loja 2, Fábrica');

  const rezza = await upsertCompany({
    name: 'Rezza',
    slug: 'rezza',
    document: null,
    units: [{ name: 'Fábrica', type: 'factory' }],
  });
  console.log('Empresa Rezza: Fábrica');

  await seedCategories(reveza);
  await seedCategories(rezza);

  await upsertDemoUser({
    email: 'samuel.w@example.com',
    name: 'Admin Reveza',
    password: 'reveza123',
    company: reveza,
    role: roles.admin,
    unitNames: ['Loja 1', 'Loja 2', 'Fábrica'],
  });

  await upsertDemoUser({
    email: 'uma.s@example.org',
    name: 'Admin Rezza',
    password: 'rezza123',
    company: rezza,
    role: roles.admin,
    unitNames: ['Fábrica'],
  });

  await upsertDemoUser({
    email: 'nina.v@example.com',
    name: 'Ana Souza',
    password: 'vendedora123',
    company: reveza,
    role: roles.seller,
    unitNames: ['Loja 1'],
    commissionRate: 8,
    salary: 2500,
  });

  console.log('\nSeed concluído.');
  console.log('Login Reveza admin: samuel.w@example.com / reveza123');
  console.log('Login Reveza vendedora: nina.v@example.com / vendedora123');
  console.log('Login Rezza:  uma.s@example.org / rezza123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Erro no seed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
