const prisma = require('../lib/prisma');
const { ROLE_DEFINITIONS } = require('../lib/roles');
const { uniqueCompanySlug } = require('../lib/slug');
const { ensureDefaultRegister } = require('./cash.service');

const USER_TENANT_INCLUDE = {
  plan: true,
  role: true,
  company: true,
  units: {
    include: {
      unit: true,
    },
  },
};

function sanitizeUser(user) {
  if (!user) return null;

  const { password, units, ...rest } = user;

  return {
    ...rest,
    companyName: rest.companyName || rest.company?.name || null,
    units: (units || []).map((link) => link.unit).filter(Boolean),
  };
}

async function ensureRoles() {
  const roles = {};

  for (const definition of ROLE_DEFINITIONS) {
    const role = await prisma.role.upsert({
      where: { name: definition.name },
      update: {
        description: definition.description,
        permissions: definition.permissions,
      },
      create: definition,
    });
    roles[definition.name] = role;
  }

  return roles;
}

async function getRoleByName(name) {
  const roles = await ensureRoles();
  return roles[name];
}

async function createCompanyWithUnit({ name, document, unitName = 'Matriz', unitType = 'store' }) {
  const slug = await uniqueCompanySlug(prisma, name);

  const company = await prisma.company.create({
    data: {
      name,
      slug,
      document: document || null,
      units: {
        create: {
          name: unitName,
          type: unitType,
        },
      },
    },
    include: { units: true },
  });

  for (const unit of company.units) {
    await ensureDefaultRegister(company.id, unit.id);
  }

  return company;
}

async function provisionCompanyForUser(user) {
  if (user.companyId && user.company) {
    return user;
  }

  const companyName = user.companyName || user.company?.name || user.name || 'Minha Empresa';
  const adminRole = await getRoleByName('admin');
  const created = await createCompanyWithUnit({ name: companyName });
  const unit = created.units[0];

  await prisma.user.update({
    where: { id: user.id },
    data: {
      companyId: created.id,
      companyName,
      roleId: user.roleId || adminRole.id,
    },
  });

  await prisma.userUnit.upsert({
    where: {
      userId_unitId: {
        userId: user.id,
        unitId: unit.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      unitId: unit.id,
    },
  });

  await prisma.client.updateMany({
    where: { userId: user.id },
    data: { companyId: created.id },
  });
  await prisma.quote.updateMany({
    where: { userId: user.id },
    data: { companyId: created.id },
  });
  await prisma.product.updateMany({
    where: { userId: user.id },
    data: { companyId: created.id },
  });

  return prisma.user.findUnique({
    where: { id: user.id },
    include: USER_TENANT_INCLUDE,
  });
}

async function createRegisteredUser({ email, password, name, companyName, planId }) {
  const adminRole = await getRoleByName('admin');
  const createdCompany = await createCompanyWithUnit({
    name: companyName || name,
  });
  const unit = createdCompany.units[0];

  const user = await prisma.user.create({
    data: {
      email,
      password,
      name,
      companyName: createdCompany.name,
      companyId: createdCompany.id,
      roleId: adminRole.id,
      planId: planId || null,
      subscriptionStatus: 'active',
      units: {
        create: { unitId: unit.id },
      },
    },
    include: USER_TENANT_INCLUDE,
  });

  return user;
}

function assertSameCompany(recordCompanyId, requestCompanyId) {
  return recordCompanyId && requestCompanyId && recordCompanyId === requestCompanyId;
}

module.exports = {
  USER_TENANT_INCLUDE,
  sanitizeUser,
  ensureRoles,
  getRoleByName,
  createCompanyWithUnit,
  provisionCompanyForUser,
  createRegisteredUser,
  assertSameCompany,
};
