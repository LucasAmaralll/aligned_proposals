/**
 * Calcula o preço de um produto baseado em seus custos e margem de lucro
 * @param {Object} productData - Dados do produto para cálculo
 * @returns {Object} Objeto com custos detalhados e preços calculados
 */
function calculateProductPrice(productData) {
  const {
    rawMaterials = [],
    productionTimeHours = 0,
    energyConsumptionKwh = 0,
    energyCostPerKwh = 0,
    laborCostPerHour = 0,
    expenses = [],
    profitMargin = 0,
  } = productData;

  // 1. Calcular custo de matérias-primas
  const rawMaterialsCost = rawMaterials.reduce(
    (total, material) => total + parseFloat(material.cost || 0),
    0
  );

  // 2. Calcular custo de energia elétrica
  const energyCost = parseFloat(energyConsumptionKwh) * parseFloat(energyCostPerKwh);

  // 3. Calcular custo de mão de obra
  const laborCost = parseFloat(productionTimeHours) * parseFloat(laborCostPerHour);

  // 4. Calcular despesas fixas e variáveis
  const fixedExpenses = expenses
    .filter((expense) => expense.type === 'fixed')
    .reduce((total, expense) => total + parseFloat(expense.cost || 0), 0);

  const variableExpenses = expenses
    .filter((expense) => expense.type === 'variable')
    .reduce((total, expense) => total + parseFloat(expense.cost || 0), 0);

  const totalExpenses = fixedExpenses + variableExpenses;

  // 5. Calcular custo total de produção
  const totalProductionCost = 
    rawMaterialsCost + 
    energyCost + 
    laborCost + 
    totalExpenses;

  // 6. Calcular preço mínimo de venda (sem lucro)
  const minimumSalePrice = totalProductionCost;

  // 7. Calcular preço ideal de venda (com margem de lucro)
  // Usando markup sobre o custo: Preço = Custo × (1 + markup%)
  const profitMarginDecimal = parseFloat(profitMargin) / 100;
  const idealSalePrice = totalProductionCost * (1 + profitMarginDecimal);

  // 8. Calcular o valor do lucro
  const profitValue = idealSalePrice - totalProductionCost;

  // 9. Composição dos custos (para gráfico)
  const costBreakdown = {
    rawMaterials: rawMaterialsCost,
    energy: energyCost,
    labor: laborCost,
    fixedExpenses: fixedExpenses,
    variableExpenses: variableExpenses,
    profit: profitValue,
  };

  // 10. Percentual de cada custo em relação ao preço ideal
  const costPercentages = {
    rawMaterialsPercent: (rawMaterialsCost / idealSalePrice) * 100,
    energyPercent: (energyCost / idealSalePrice) * 100,
    laborPercent: (laborCost / idealSalePrice) * 100,
    fixedExpensesPercent: (fixedExpenses / idealSalePrice) * 100,
    variableExpensesPercent: (variableExpenses / idealSalePrice) * 100,
    profitPercent: (profitValue / idealSalePrice) * 100,
  };

  return {
    // Custos detalhados
    costs: {
      rawMaterials: parseFloat(rawMaterialsCost.toFixed(2)),
      energy: parseFloat(energyCost.toFixed(2)),
      labor: parseFloat(laborCost.toFixed(2)),
      fixedExpenses: parseFloat(fixedExpenses.toFixed(2)),
      variableExpenses: parseFloat(variableExpenses.toFixed(2)),
      total: parseFloat(totalProductionCost.toFixed(2)),
    },
    
    // Preços calculados
    prices: {
      minimumSalePrice: parseFloat(minimumSalePrice.toFixed(2)),
      idealSalePrice: parseFloat(idealSalePrice.toFixed(2)),
      profitValue: parseFloat(profitValue.toFixed(2)),
    },
    
    // Composição para gráficos
    breakdown: {
      values: costBreakdown,
      percentages: {
        rawMaterialsPercent: parseFloat(costPercentages.rawMaterialsPercent.toFixed(2)),
        energyPercent: parseFloat(costPercentages.energyPercent.toFixed(2)),
        laborPercent: parseFloat(costPercentages.laborPercent.toFixed(2)),
        fixedExpensesPercent: parseFloat(costPercentages.fixedExpensesPercent.toFixed(2)),
        variableExpensesPercent: parseFloat(costPercentages.variableExpensesPercent.toFixed(2)),
        profitPercent: parseFloat(costPercentages.profitPercent.toFixed(2)),
      },
    },
    
    // Margem de lucro aplicada
    profitMargin: parseFloat(profitMargin),
  };
}

module.exports = { calculateProductPrice };
