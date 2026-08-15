const prisma = require('../lib/prisma');
const { calculateProductPrice } = require('../utils/calculatePrice');

/**
 * Listar todos os produtos do usuário
 */
const getProducts = async (req, res) => {
  try {
    const { search, limit = 40 } = req.query;
    const products = await prisma.product.findMany({
      where: {
        companyId: req.companyId,
        ...(search && { name: { contains: search, mode: 'insensitive' } }),
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });

    res.json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
};

/**
 * Buscar um produto específico
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        id,
        companyId: req.companyId,
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json(product);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
};

/**
 * Criar um novo produto
 */
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      rawMaterials,
      productionTimeHours,
      energyConsumptionKwh,
      energyCostPerKwh,
      laborCostPerHour,
      expenses,
      profitMargin,
    } = req.body;

    // Validações básicas
    if (!name) {
      return res.status(400).json({ error: 'Nome do produto é obrigatório' });
    }

    // Calcular os preços
    const calculation = calculateProductPrice({
      rawMaterials: rawMaterials || [],
      productionTimeHours: productionTimeHours || 0,
      energyConsumptionKwh: energyConsumptionKwh || 0,
      energyCostPerKwh: energyCostPerKwh || 0,
      laborCostPerHour: laborCostPerHour || 0,
      expenses: expenses || [],
      profitMargin: profitMargin || 0,
    });

    // Criar o produto com os valores calculados
    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        rawMaterials: rawMaterials || [],
        productionTimeHours: productionTimeHours || 0,
        energyConsumptionKwh: energyConsumptionKwh || 0,
        energyCostPerKwh: energyCostPerKwh || 0,
        laborCostPerHour: laborCostPerHour || 0,
        expenses: expenses || [],
        profitMargin: profitMargin || 0,
        totalProductionCost: calculation.costs.total,
        minimumSalePrice: calculation.prices.minimumSalePrice,
        idealSalePrice: calculation.prices.idealSalePrice,
        userId: req.userId,
        companyId: req.companyId,
      },
    });

    // Retornar o produto com os cálculos
    res.status(201).json({
      product,
      calculation,
    });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
};

/**
 * Atualizar um produto existente
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      rawMaterials,
      productionTimeHours,
      energyConsumptionKwh,
      energyCostPerKwh,
      laborCostPerHour,
      expenses,
      profitMargin,
    } = req.body;

    // Verificar se o produto existe e pertence ao usuário
    const existingProduct = await prisma.product.findFirst({
      where: { id, companyId: req.companyId },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Recalcular os preços
    const calculation = calculateProductPrice({
      rawMaterials: rawMaterials !== undefined ? rawMaterials : existingProduct.rawMaterials,
      productionTimeHours: productionTimeHours !== undefined ? productionTimeHours : existingProduct.productionTimeHours,
      energyConsumptionKwh: energyConsumptionKwh !== undefined ? energyConsumptionKwh : existingProduct.energyConsumptionKwh,
      energyCostPerKwh: energyCostPerKwh !== undefined ? energyCostPerKwh : existingProduct.energyCostPerKwh,
      laborCostPerHour: laborCostPerHour !== undefined ? laborCostPerHour : existingProduct.laborCostPerHour,
      expenses: expenses !== undefined ? expenses : existingProduct.expenses,
      profitMargin: profitMargin !== undefined ? profitMargin : existingProduct.profitMargin,
    });

    // Atualizar o produto
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingProduct.name,
        description: description !== undefined ? description : existingProduct.description,
        rawMaterials: rawMaterials !== undefined ? rawMaterials : existingProduct.rawMaterials,
        productionTimeHours: productionTimeHours !== undefined ? productionTimeHours : existingProduct.productionTimeHours,
        energyConsumptionKwh: energyConsumptionKwh !== undefined ? energyConsumptionKwh : existingProduct.energyConsumptionKwh,
        energyCostPerKwh: energyCostPerKwh !== undefined ? energyCostPerKwh : existingProduct.energyCostPerKwh,
        laborCostPerHour: laborCostPerHour !== undefined ? laborCostPerHour : existingProduct.laborCostPerHour,
        expenses: expenses !== undefined ? expenses : existingProduct.expenses,
        profitMargin: profitMargin !== undefined ? profitMargin : existingProduct.profitMargin,
        totalProductionCost: calculation.costs.total,
        minimumSalePrice: calculation.prices.minimumSalePrice,
        idealSalePrice: calculation.prices.idealSalePrice,
      },
    });

    res.json({
      product,
      calculation,
    });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
};

/**
 * Deletar um produto
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: { id, companyId: req.companyId },
    });

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const variantCount = await prisma.productVariant.count({
      where: { productId: id },
    });

    if (variantCount > 0) {
      await prisma.product.update({
        where: { id },
        data: { active: false },
      });
      return res.json({ message: 'Produto inativado porque possui variações' });
    }

    await prisma.product.delete({
      where: { id },
    });

    res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ error: 'Erro ao deletar produto' });
  }
};

/**
 * Calcular preço de um produto sem salvar (preview)
 */
const calculatePrice = async (req, res) => {
  try {
    const {
      rawMaterials,
      productionTimeHours,
      energyConsumptionKwh,
      energyCostPerKwh,
      laborCostPerHour,
      expenses,
      profitMargin,
    } = req.body;

    const calculation = calculateProductPrice({
      rawMaterials: rawMaterials || [],
      productionTimeHours: productionTimeHours || 0,
      energyConsumptionKwh: energyConsumptionKwh || 0,
      energyCostPerKwh: energyCostPerKwh || 0,
      laborCostPerHour: laborCostPerHour || 0,
      expenses: expenses || [],
      profitMargin: profitMargin || 0,
    });

    res.json(calculation);
  } catch (error) {
    console.error('Erro ao calcular preço:', error);
    res.status(500).json({ error: 'Erro ao calcular preço' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  calculatePrice,
};
