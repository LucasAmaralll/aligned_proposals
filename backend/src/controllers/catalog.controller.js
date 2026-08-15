const prisma = require('../lib/prisma');

const variantInclude = {
  stocks: {
    include: { unit: { select: { id: true, name: true, type: true } } },
  },
};

const productInclude = {
  category: true,
  variants: {
    orderBy: [{ color: 'asc' }, { size: 'asc' }],
    include: variantInclude,
  },
};

class CatalogController {
  async list(req, res) {
    try {
      const { search, active, limit = 40 } = req.query;
      const products = await prisma.product.findMany({
        where: {
          companyId: req.companyId,
          ...(active !== 'all' && { active: active === 'false' ? false : true }),
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { variants: { some: { sku: { contains: search, mode: 'insensitive' } } } },
            ],
          }),
        },
        include: productInclude,
        orderBy: { name: 'asc' },
        take: Number(limit),
      });
      return res.json({ products });
    } catch (error) {
      console.error('Erro ao listar catálogo:', error);
      return res.status(500).json({ error: 'Erro ao listar produtos' });
    }
  }

  async getById(req, res) {
    try {
      const product = await prisma.product.findFirst({
        where: { id: req.params.id, companyId: req.companyId },
        include: productInclude,
      });
      if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }
      return res.json(product);
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      return res.status(500).json({ error: 'Erro ao buscar produto' });
    }
  }

  async create(req, res) {
    try {
      const { name, description, type, gender, categoryId, active } = req.body;
      if (!name || !String(name).trim()) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }

      if (categoryId) {
        const category = await prisma.category.findFirst({
          where: { id: categoryId, companyId: req.companyId },
        });
        if (!category) {
          return res.status(400).json({ error: 'Categoria inválida' });
        }
      }

      const product = await prisma.product.create({
        data: {
          name: String(name).trim(),
          description: description || null,
          type: type || null,
          gender: gender || null,
          categoryId: categoryId || null,
          active: active !== false,
          userId: req.userId,
          companyId: req.companyId,
        },
        include: productInclude,
      });
      return res.status(201).json(product);
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      return res.status(500).json({ error: 'Erro ao criar produto' });
    }
  }

  async update(req, res) {
    try {
      const existing = await prisma.product.findFirst({
        where: { id: req.params.id, companyId: req.companyId },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      const { name, description, type, gender, categoryId, active } = req.body;

      const product = await prisma.product.update({
        where: { id: existing.id },
        data: {
          ...(name !== undefined && { name: String(name).trim() }),
          ...(description !== undefined && { description: description || null }),
          ...(type !== undefined && { type: type || null }),
          ...(gender !== undefined && { gender: gender || null }),
          ...(categoryId !== undefined && { categoryId: categoryId || null }),
          ...(active !== undefined && { active: Boolean(active) }),
        },
        include: productInclude,
      });
      return res.json(product);
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      return res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
  }

  async createVariant(req, res) {
    try {
      const product = await prisma.product.findFirst({
        where: { id: req.params.id, companyId: req.companyId },
      });
      if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      const { sku, size, color, width, height, salePrice, costPrice, ncm, ean, cest, active } = req.body;
      if (!sku || !String(sku).trim()) {
        return res.status(400).json({ error: 'SKU é obrigatório' });
      }
      if (salePrice === undefined || salePrice === null || salePrice === '') {
        return res.status(400).json({ error: 'Preço de venda é obrigatório' });
      }

      const variant = await prisma.productVariant.create({
        data: {
          sku: String(sku).trim().toUpperCase(),
          size: size || null,
          color: color || null,
          width: width || null,
          height: height || null,
          salePrice,
          costPrice: costPrice || null,
          ncm: ncm || null,
          ean: ean || null,
          cest: cest || null,
          active: active !== false,
          productId: product.id,
          companyId: req.companyId,
        },
        include: variantInclude,
      });
      return res.status(201).json(variant);
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Já existe uma variação com esse SKU' });
      }
      console.error('Erro ao criar variação:', error);
      return res.status(500).json({ error: 'Erro ao criar variação' });
    }
  }

  async updateVariant(req, res) {
    try {
      const existing = await prisma.productVariant.findFirst({
        where: { id: req.params.variantId, companyId: req.companyId },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Variação não encontrada' });
      }

      const { sku, size, color, width, height, salePrice, costPrice, ncm, ean, cest, active } = req.body;

      const variant = await prisma.productVariant.update({
        where: { id: existing.id },
        data: {
          ...(sku !== undefined && { sku: String(sku).trim().toUpperCase() }),
          ...(size !== undefined && { size: size || null }),
          ...(color !== undefined && { color: color || null }),
          ...(width !== undefined && { width: width || null }),
          ...(height !== undefined && { height: height || null }),
          ...(salePrice !== undefined && { salePrice }),
          ...(costPrice !== undefined && { costPrice: costPrice || null }),
          ...(ncm !== undefined && { ncm: ncm || null }),
          ...(ean !== undefined && { ean: ean || null }),
          ...(cest !== undefined && { cest: cest || null }),
          ...(active !== undefined && { active: Boolean(active) }),
        },
        include: variantInclude,
      });
      return res.json(variant);
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Já existe uma variação com esse SKU' });
      }
      console.error('Erro ao atualizar variação:', error);
      return res.status(500).json({ error: 'Erro ao atualizar variação' });
    }
  }
}

module.exports = new CatalogController();
