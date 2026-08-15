function num(value) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value) {
  return Math.round((num(value) + Number.EPSILON) * 100) / 100;
}

function percentOf(value, total) {
  if (!total) return 0;
  return money((value / total) * 100);
}

function fabricCost(item) {
  const meters = num(item.meters);
  const price = num(item.pricePerMeter);
  const waste = num(item.wastePercent);
  if (meters || price) {
    return meters * (1 + waste / 100) * price;
  }
  return num(item.cost);
}

function trimCost(item) {
  if (item.unitCost !== undefined || item.kind === 'trim') {
    return num(item.quantity) * num(item.unitCost);
  }
  return num(item.cost);
}

function isGarmentPayload(data) {
  const materials = data.rawMaterials || [];
  return materials.some((item) => item.kind === 'fabric' || item.kind === 'trim' || item.meters != null);
}

function calculateGarmentPrice(productData) {
  const materials = productData.rawMaterials || [];
  const expenses = productData.expenses || [];

  const fabrics = materials.filter((item) => item.kind === 'fabric' || item.meters != null);
  const trims = materials.filter((item) => item.kind === 'trim');
  const leftover = materials.filter((item) => !item.kind && item.meters == null);

  const fabricTotal = fabrics.reduce((sum, item) => sum + fabricCost(item), 0);
  const trimTotal = trims.reduce((sum, item) => sum + trimCost(item), 0);
  const leftoverTotal = leftover.reduce((sum, item) => sum + num(item.cost), 0);

  const sewingHours = num(productData.productionTimeHours);
  const labor = sewingHours * num(productData.laborCostPerHour);

  const finishing = expenses
    .filter((item) => item.type === 'variable' || item.kind === 'finishing')
    .reduce((sum, item) => sum + num(item.cost), 0);

  const overheadPercent = num(
    (expenses.find((item) => item.type === 'overhead' || item.kind === 'overhead') || {}).percent
  );
  const retailMargin = num(
    (expenses.find((item) => item.type === 'retail' || item.kind === 'retail') || {}).percent
  );

  const materialsCost = fabricTotal + trimTotal + leftoverTotal;
  const direct = materialsCost + labor + finishing;
  const overhead = direct * (overheadPercent / 100);
  const total = direct + overhead;
  const factoryMargin = num(productData.profitMargin);
  const factoryPrice = total * (1 + factoryMargin / 100);
  const retailPrice = factoryPrice * (1 + retailMargin / 100);
  const profitValue = factoryPrice - total;
  const base = factoryPrice || 1;

  return {
    costs: {
      fabric: money(fabricTotal),
      trims: money(trimTotal),
      rawMaterials: money(materialsCost),
      labor: money(labor),
      finishing: money(finishing),
      overhead: money(overhead),
      energy: money(overhead),
      fixedExpenses: money(overhead),
      variableExpenses: money(finishing),
      total: money(total),
    },
    prices: {
      minimumSalePrice: money(total),
      factoryPrice: money(factoryPrice),
      idealSalePrice: money(factoryPrice),
      retailPrice: money(retailPrice),
      profitValue: money(profitValue),
    },
    breakdown: {
      values: {
        fabric: fabricTotal,
        trims: trimTotal,
        labor,
        finishing,
        overhead,
        profit: profitValue,
      },
      percentages: {
        fabricPercent: percentOf(fabricTotal, base),
        trimsPercent: percentOf(trimTotal, base),
        rawMaterialsPercent: percentOf(materialsCost, base),
        laborPercent: percentOf(labor, base),
        finishingPercent: percentOf(finishing, base),
        overheadPercent: percentOf(overhead, base),
        energyPercent: percentOf(overhead, base),
        fixedExpensesPercent: percentOf(overhead, base),
        variableExpensesPercent: percentOf(finishing, base),
        profitPercent: percentOf(profitValue, base),
      },
    },
    profitMargin: factoryMargin,
    retailMargin,
    overheadPercent,
  };
}

function calculateLegacyPrice(productData) {
  const {
    rawMaterials = [],
    productionTimeHours = 0,
    energyConsumptionKwh = 0,
    energyCostPerKwh = 0,
    laborCostPerHour = 0,
    expenses = [],
    profitMargin = 0,
  } = productData;

  const rawMaterialsCost = rawMaterials.reduce((total, material) => total + num(material.cost), 0);
  const energyCost = num(energyConsumptionKwh) * num(energyCostPerKwh);
  const laborCost = num(productionTimeHours) * num(laborCostPerHour);
  const fixedExpenses = expenses
    .filter((expense) => expense.type === 'fixed')
    .reduce((total, expense) => total + num(expense.cost), 0);
  const variableExpenses = expenses
    .filter((expense) => expense.type === 'variable')
    .reduce((total, expense) => total + num(expense.cost), 0);
  const totalProductionCost = rawMaterialsCost + energyCost + laborCost + fixedExpenses + variableExpenses;
  const profitMarginDecimal = num(profitMargin) / 100;
  const idealSalePrice = totalProductionCost * (1 + profitMarginDecimal);
  const profitValue = idealSalePrice - totalProductionCost;

  return {
    costs: {
      rawMaterials: money(rawMaterialsCost),
      energy: money(energyCost),
      labor: money(laborCost),
      fixedExpenses: money(fixedExpenses),
      variableExpenses: money(variableExpenses),
      total: money(totalProductionCost),
    },
    prices: {
      minimumSalePrice: money(totalProductionCost),
      idealSalePrice: money(idealSalePrice),
      factoryPrice: money(idealSalePrice),
      retailPrice: money(idealSalePrice),
      profitValue: money(profitValue),
    },
    breakdown: {
      values: {
        rawMaterials: rawMaterialsCost,
        energy: energyCost,
        labor: laborCost,
        fixedExpenses,
        variableExpenses,
        profit: profitValue,
      },
      percentages: {
        rawMaterialsPercent: percentOf(rawMaterialsCost, idealSalePrice),
        energyPercent: percentOf(energyCost, idealSalePrice),
        laborPercent: percentOf(laborCost, idealSalePrice),
        fixedExpensesPercent: percentOf(fixedExpenses, idealSalePrice),
        variableExpensesPercent: percentOf(variableExpenses, idealSalePrice),
        profitPercent: percentOf(profitValue, idealSalePrice),
      },
    },
    profitMargin: num(profitMargin),
  };
}

function calculateProductPrice(productData) {
  if (isGarmentPayload(productData)) {
    return calculateGarmentPrice(productData);
  }
  return calculateLegacyPrice(productData);
}

module.exports = { calculateProductPrice };
