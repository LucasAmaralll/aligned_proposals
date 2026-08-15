const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { getRoleByName, USER_TENANT_INCLUDE } = require('../services/tenant.service');

const ROLE_NAMES = new Set(['admin', 'manager', 'seller']);

function publicMember(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    active: user.active,
    commissionRate: user.commissionRate,
    salary: user.salary,
    role: user.role,
    units: (user.units || []).map((link) => link.unit).filter(Boolean),
    createdAt: user.createdAt,
  };
}

async function assertUnits(companyId, unitIds) {
  if (!unitIds?.length) return [];
  const units = await prisma.unit.findMany({
    where: { companyId, id: { in: unitIds }, active: true },
  });
  if (units.length !== unitIds.length) {
    const error = new Error('Uma ou mais unidades são inválidas');
    error.status = 400;
    throw error;
  }
  return units;
}

class TeamController {
  async list(req, res) {
    try {
      const members = await prisma.user.findMany({
        where: { companyId: req.companyId },
        include: USER_TENANT_INCLUDE,
        orderBy: { name: 'asc' },
      });
      return res.json({ members: members.map(publicMember) });
    } catch (error) {
      console.error('Erro ao listar equipe:', error);
      return res.status(500).json({ error: 'Erro ao listar equipe' });
    }
  }

  async create(req, res) {
    try {
      const { name, email, password, role: roleName, unitIds, commissionRate, salary } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios' });
      }
      if (String(password).length < 8) {
        return res.status(400).json({ error: 'A senha precisa ter pelo menos 8 caracteres' });
      }

      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) {
        return res.status(400).json({ error: 'E-mail já cadastrado' });
      }

      const role = await getRoleByName(ROLE_NAMES.has(roleName) ? roleName : 'seller');
      const units = await assertUnits(req.companyId, unitIds || []);
      const hashed = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          name: String(name).trim(),
          email: String(email).trim().toLowerCase(),
          password: hashed,
          companyId: req.companyId,
          companyName: req.user?.company?.name || req.user?.companyName,
          roleId: role.id,
          commissionRate: commissionRate === '' || commissionRate == null ? null : commissionRate,
          salary: salary === '' || salary == null ? null : salary,
          subscriptionStatus: 'active',
          units: {
            create: units.map((unit) => ({ unitId: unit.id })),
          },
        },
        include: USER_TENANT_INCLUDE,
      });

      return res.status(201).json(publicMember(user));
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return res.status(error.status || 500).json({ error: error.message || 'Erro ao criar usuário' });
    }
  }

  async update(req, res) {
    try {
      const existing = await prisma.user.findFirst({
        where: { id: req.params.id, companyId: req.companyId },
        include: USER_TENANT_INCLUDE,
      });
      if (!existing) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const { name, role: roleName, unitIds, commissionRate, salary, active, password } = req.body;
      const data = {};

      if (name !== undefined) data.name = String(name).trim();
      if (active !== undefined) data.active = Boolean(active);
      if (commissionRate !== undefined) {
        data.commissionRate = commissionRate === '' || commissionRate == null ? null : commissionRate;
      }
      if (salary !== undefined) {
        data.salary = salary === '' || salary == null ? null : salary;
      }
      if (password) {
        if (String(password).length < 8) {
          return res.status(400).json({ error: 'A senha precisa ter pelo menos 8 caracteres' });
        }
        data.password = await bcrypt.hash(password, 10);
      }
      if (roleName && ROLE_NAMES.has(roleName)) {
        const role = await getRoleByName(roleName);
        data.roleId = role.id;
      }

      if (existing.id === req.userId && data.active === false) {
        return res.status(400).json({ error: 'Você não pode desativar a própria conta' });
      }

      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: existing.id }, data });

        if (Array.isArray(unitIds)) {
          const units = await assertUnits(req.companyId, unitIds);
          await tx.userUnit.deleteMany({ where: { userId: existing.id } });
          if (units.length) {
            await tx.userUnit.createMany({
              data: units.map((unit) => ({ userId: existing.id, unitId: unit.id })),
            });
          }
        }
      });

      const user = await prisma.user.findUnique({
        where: { id: existing.id },
        include: USER_TENANT_INCLUDE,
      });
      return res.json(publicMember(user));
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return res.status(error.status || 500).json({ error: error.message || 'Erro ao atualizar usuário' });
    }
  }
}

module.exports = new TeamController();
