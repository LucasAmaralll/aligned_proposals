const prisma = require('../lib/prisma');

class CategoryController {
  async list(req, res) {
    try {
      const categories = await prisma.category.findMany({
        where: { companyId: req.companyId, active: true },
        orderBy: { name: 'asc' },
        include: { _count: { select: { products: true } } },
      });
      return res.json({ categories });
    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      return res.status(500).json({ error: 'Erro ao listar categorias' });
    }
  }

  async create(req, res) {
    try {
      const name = String(req.body.name || '').trim();
      if (!name) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }

      const category = await prisma.category.create({
        data: { name, companyId: req.companyId },
      });
      return res.status(201).json(category);
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Já existe uma categoria com esse nome' });
      }
      console.error('Erro ao criar categoria:', error);
      return res.status(500).json({ error: 'Erro ao criar categoria' });
    }
  }

  async update(req, res) {
    try {
      const existing = await prisma.category.findFirst({
        where: { id: req.params.id, companyId: req.companyId },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }

      const category = await prisma.category.update({
        where: { id: existing.id },
        data: {
          ...(req.body.name !== undefined && { name: String(req.body.name).trim() }),
          ...(req.body.active !== undefined && { active: Boolean(req.body.active) }),
        },
      });
      return res.json(category);
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      return res.status(500).json({ error: 'Erro ao atualizar categoria' });
    }
  }
}

module.exports = new CategoryController();
