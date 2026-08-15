const prisma = require('../lib/prisma');
const { ensureDefaultRegister } = require('../services/cash.service');

const ADDRESS_FIELDS = [
  'document',
  'phone',
  'email',
  'zip',
  'street',
  'number',
  'complement',
  'neighborhood',
  'city',
  'state',
];

function pickAddress(body) {
  const data = {};
  for (const field of ADDRESS_FIELDS) {
    if (body[field] !== undefined) {
      data[field] = body[field] ? String(body[field]).trim() : null;
    }
  }
  return data;
}

class CompanyController {
  async me(req, res) {
    try {
      const company = await prisma.company.findUnique({
        where: { id: req.companyId },
        include: {
          units: {
            where: { active: true },
            orderBy: { name: 'asc' },
          },
        },
      });

      if (!company) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      const isAdmin = req.user?.role?.name === 'admin';
      const allowedUnitIds = new Set((req.user?.units || []).map((unit) => unit.id));

      const units = isAdmin
        ? company.units
        : company.units.filter((unit) => allowedUnitIds.has(unit.id));

      return res.json({
        ...company,
        units,
        role: req.user?.role || null,
      });
    } catch (error) {
      console.error('Erro ao buscar empresa:', error);
      return res.status(500).json({ error: 'Erro ao buscar empresa' });
    }
  }

  async update(req, res) {
    try {
      const { name } = req.body;
      const data = {
        ...pickAddress(req.body),
      };
      if (name !== undefined) {
        if (!String(name).trim()) {
          return res.status(400).json({ error: 'Nome da empresa é obrigatório' });
        }
        data.name = String(name).trim();
      }

      const company = await prisma.company.update({
        where: { id: req.companyId },
        data,
      });

      if (data.name) {
        await prisma.user.updateMany({
          where: { companyId: req.companyId },
          data: { companyName: data.name },
        });
      }

      return res.json(company);
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      return res.status(500).json({ error: 'Erro ao atualizar empresa' });
    }
  }

  async listUnits(req, res) {
    try {
      const isAdmin = req.user?.role?.name === 'admin';
      const allowedUnitIds = (req.user?.units || []).map((unit) => unit.id);

      const units = await prisma.unit.findMany({
        where: {
          companyId: req.companyId,
          active: true,
          ...(!isAdmin && { id: { in: allowedUnitIds } }),
        },
        orderBy: { name: 'asc' },
      });

      return res.json({ units });
    } catch (error) {
      console.error('Erro ao listar unidades:', error);
      return res.status(500).json({ error: 'Erro ao listar unidades' });
    }
  }

  async createUnit(req, res) {
    try {
      const { name, type } = req.body;
      if (!name || !String(name).trim()) {
        return res.status(400).json({ error: 'Nome da loja é obrigatório' });
      }

      const unit = await prisma.unit.create({
        data: {
          name: String(name).trim(),
          type: type === 'factory' ? 'factory' : 'store',
          companyId: req.companyId,
          ...pickAddress(req.body),
        },
      });

      await prisma.userUnit.upsert({
        where: {
          userId_unitId: {
            userId: req.userId,
            unitId: unit.id,
          },
        },
        update: {},
        create: {
          userId: req.userId,
          unitId: unit.id,
        },
      });

      await ensureDefaultRegister(req.companyId, unit.id);

      return res.status(201).json(unit);
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Já existe uma loja com esse nome' });
      }
      console.error('Erro ao criar loja:', error);
      return res.status(500).json({ error: 'Erro ao criar loja' });
    }
  }

  async updateUnit(req, res) {
    try {
      const existing = await prisma.unit.findFirst({
        where: { id: req.params.id, companyId: req.companyId },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Loja não encontrada' });
      }

      const { name, type } = req.body;
      if (name !== undefined && !String(name).trim()) {
        return res.status(400).json({ error: 'Nome da loja é obrigatório' });
      }

      const unit = await prisma.unit.update({
        where: { id: existing.id },
        data: {
          ...(name !== undefined && { name: String(name).trim() }),
          ...(type && { type: type === 'factory' ? 'factory' : 'store' }),
          ...pickAddress(req.body),
        },
      });

      return res.json(unit);
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Já existe uma loja com esse nome' });
      }
      console.error('Erro ao atualizar loja:', error);
      return res.status(500).json({ error: 'Erro ao atualizar loja' });
    }
  }

  async deactivateUnit(req, res) {
    try {
      const existing = await prisma.unit.findFirst({
        where: { id: req.params.id, companyId: req.companyId },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Loja não encontrada' });
      }

      const activeCount = await prisma.unit.count({
        where: { companyId: req.companyId, active: true },
      });
      if (activeCount <= 1) {
        return res.status(400).json({ error: 'Mantenha pelo menos uma loja ativa' });
      }

      await prisma.unit.update({
        where: { id: existing.id },
        data: { active: false },
      });

      return res.json({ message: 'Loja desativada' });
    } catch (error) {
      console.error('Erro ao desativar loja:', error);
      return res.status(500).json({ error: 'Erro ao desativar loja' });
    }
  }

  async listApiKeys(req, res) {
    try {
      const { listApiKeys } = require('../services/apiKey.service');
      const keys = await listApiKeys(req.companyId);
      return res.json({ keys });
    } catch (error) {
      console.error('Erro ao listar chaves:', error);
      return res.status(500).json({ error: 'Erro ao listar chaves' });
    }
  }

  async createApiKey(req, res) {
    try {
      const { createApiKey } = require('../services/apiKey.service');
      const key = await createApiKey({
        companyId: req.companyId,
        userId: req.userId,
        name: req.body.name,
      });
      return res.status(201).json(key);
    } catch (error) {
      console.error('Erro ao criar chave:', error);
      return res.status(500).json({ error: 'Erro ao criar chave' });
    }
  }

  async revokeApiKey(req, res) {
    try {
      const { revokeApiKey } = require('../services/apiKey.service');
      await revokeApiKey({ companyId: req.companyId, id: req.params.id });
      return res.json({ message: 'Chave desativada' });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message || 'Erro ao desativar chave' });
    }
  }
}

module.exports = new CompanyController();
