const { calculateProductPrice } = require('../src/utils/calculatePrice');

// Exemplo 1: Bolo de Chocolate
console.log('=== Exemplo 1: Bolo de Chocolate ===\n');

const bolo = {
  rawMaterials: [
    { name: 'Farinha de trigo', cost: 5.00 },
    { name: 'Açúcar', cost: 3.00 },
    { name: 'Chocolate em pó', cost: 8.00 },
    { name: 'Ovos', cost: 4.00 },
    { name: 'Leite', cost: 2.50 }
  ],
  productionTimeHours: 2.5,
  energyConsumptionKwh: 2.0,
  energyCostPerKwh: 0.85,
  laborCostPerHour: 30.00,
  expenses: [
    { name: 'Aluguel da cozinha', cost: 15.00, type: 'fixed' },
    { name: 'Gás', cost: 3.00, type: 'variable' },
    { name: 'Embalagem', cost: 5.00, type: 'variable' }
  ],
  profitMargin: 35
};

const resultadoBolo = calculateProductPrice(bolo);

console.log('Custos:');
console.log(`  Matérias-primas: R$ ${resultadoBolo.costs.rawMaterials.toFixed(2)}`);
console.log(`  Energia: R$ ${resultadoBolo.costs.energy.toFixed(2)}`);
console.log(`  Mão de obra: R$ ${resultadoBolo.costs.labor.toFixed(2)}`);
console.log(`  Despesas fixas: R$ ${resultadoBolo.costs.fixedExpenses.toFixed(2)}`);
console.log(`  Despesas variáveis: R$ ${resultadoBolo.costs.variableExpenses.toFixed(2)}`);
console.log(`  TOTAL: R$ ${resultadoBolo.costs.total.toFixed(2)}`);

console.log('\nPreços:');
console.log(`  Preço mínimo (sem lucro): R$ ${resultadoBolo.prices.minimumSalePrice.toFixed(2)}`);
console.log(`  Preço ideal (com ${bolo.profitMargin}% lucro): R$ ${resultadoBolo.prices.idealSalePrice.toFixed(2)}`);
console.log(`  Lucro por unidade: R$ ${resultadoBolo.prices.profitValue.toFixed(2)}`);

console.log('\nComposição:');
console.log(`  Matérias-primas: ${resultadoBolo.breakdown.percentages.rawMaterialsPercent.toFixed(1)}%`);
console.log(`  Energia: ${resultadoBolo.breakdown.percentages.energyPercent.toFixed(1)}%`);
console.log(`  Mão de obra: ${resultadoBolo.breakdown.percentages.laborPercent.toFixed(1)}%`);
console.log(`  Despesas fixas: ${resultadoBolo.breakdown.percentages.fixedExpensesPercent.toFixed(1)}%`);
console.log(`  Despesas variáveis: ${resultadoBolo.breakdown.percentages.variableExpensesPercent.toFixed(1)}%`);
console.log(`  Lucro: ${resultadoBolo.breakdown.percentages.profitPercent.toFixed(1)}%`);

// Exemplo 2: Serviço de Design
console.log('\n\n=== Exemplo 2: Logo Design ===\n');

const logoDesign = {
  rawMaterials: [], // Sem matéria-prima
  productionTimeHours: 8,
  energyConsumptionKwh: 1.2,
  energyCostPerKwh: 0.85,
  laborCostPerHour: 80.00,
  expenses: [
    { name: 'Licença Adobe', cost: 20.00, type: 'fixed' },
    { name: 'Internet', cost: 5.00, type: 'fixed' }
  ],
  profitMargin: 40
};

const resultadoLogo = calculateProductPrice(logoDesign);

console.log('Custos:');
console.log(`  Matérias-primas: R$ ${resultadoLogo.costs.rawMaterials.toFixed(2)}`);
console.log(`  Energia: R$ ${resultadoLogo.costs.energy.toFixed(2)}`);
console.log(`  Mão de obra: R$ ${resultadoLogo.costs.labor.toFixed(2)}`);
console.log(`  Despesas fixas: R$ ${resultadoLogo.costs.fixedExpenses.toFixed(2)}`);
console.log(`  Despesas variáveis: R$ ${resultadoLogo.costs.variableExpenses.toFixed(2)}`);
console.log(`  TOTAL: R$ ${resultadoLogo.costs.total.toFixed(2)}`);

console.log('\nPreços:');
console.log(`  Preço mínimo (sem lucro): R$ ${resultadoLogo.prices.minimumSalePrice.toFixed(2)}`);
console.log(`  Preço ideal (com ${logoDesign.profitMargin}% lucro): R$ ${resultadoLogo.prices.idealSalePrice.toFixed(2)}`);
console.log(`  Lucro por unidade: R$ ${resultadoLogo.prices.profitValue.toFixed(2)}`);

console.log('\nComposição:');
console.log(`  Matérias-primas: ${resultadoLogo.breakdown.percentages.rawMaterialsPercent.toFixed(1)}%`);
console.log(`  Energia: ${resultadoLogo.breakdown.percentages.energyPercent.toFixed(1)}%`);
console.log(`  Mão de obra: ${resultadoLogo.breakdown.percentages.laborPercent.toFixed(1)}%`);
console.log(`  Despesas fixas: ${resultadoLogo.breakdown.percentages.fixedExpensesPercent.toFixed(1)}%`);
console.log(`  Despesas variáveis: ${resultadoLogo.breakdown.percentages.variableExpensesPercent.toFixed(1)}%`);
console.log(`  Lucro: ${resultadoLogo.breakdown.percentages.profitPercent.toFixed(1)}%`);

// Exemplo 3: Produto Artesanal
console.log('\n\n=== Exemplo 3: Vela Artesanal ===\n');

const vela = {
  rawMaterials: [
    { name: 'Cera de soja', cost: 12.00 },
    { name: 'Essência', cost: 4.00 },
    { name: 'Pavio', cost: 1.50 },
    { name: 'Pote de vidro', cost: 8.00 }
  ],
  productionTimeHours: 1.5,
  energyConsumptionKwh: 0.5,
  energyCostPerKwh: 0.85,
  laborCostPerHour: 20.00,
  expenses: [
    { name: 'Etiquetas', cost: 2.00, type: 'variable' },
    { name: 'Embalagem', cost: 3.00, type: 'variable' },
    { name: 'Marketing', cost: 5.00, type: 'fixed' }
  ],
  profitMargin: 50
};

const resultadoVela = calculateProductPrice(vela);

console.log('Custos:');
console.log(`  Matérias-primas: R$ ${resultadoVela.costs.rawMaterials.toFixed(2)}`);
console.log(`  Energia: R$ ${resultadoVela.costs.energy.toFixed(2)}`);
console.log(`  Mão de obra: R$ ${resultadoVela.costs.labor.toFixed(2)}`);
console.log(`  Despesas fixas: R$ ${resultadoVela.costs.fixedExpenses.toFixed(2)}`);
console.log(`  Despesas variáveis: R$ ${resultadoVela.costs.variableExpenses.toFixed(2)}`);
console.log(`  TOTAL: R$ ${resultadoVela.costs.total.toFixed(2)}`);

console.log('\nPreços:');
console.log(`  Preço mínimo (sem lucro): R$ ${resultadoVela.prices.minimumSalePrice.toFixed(2)}`);
console.log(`  Preço ideal (com ${vela.profitMargin}% lucro): R$ ${resultadoVela.prices.idealSalePrice.toFixed(2)}`);
console.log(`  Lucro por unidade: R$ ${resultadoVela.prices.profitValue.toFixed(2)}`);

console.log('\nComposição:');
console.log(`  Matérias-primas: ${resultadoVela.breakdown.percentages.rawMaterialsPercent.toFixed(1)}%`);
console.log(`  Energia: ${resultadoVela.breakdown.percentages.energyPercent.toFixed(1)}%`);
console.log(`  Mão de obra: ${resultadoVela.breakdown.percentages.laborPercent.toFixed(1)}%`);
console.log(`  Despesas fixas: ${resultadoVela.breakdown.percentages.fixedExpensesPercent.toFixed(1)}%`);
console.log(`  Despesas variáveis: ${resultadoVela.breakdown.percentages.variableExpensesPercent.toFixed(1)}%`);
console.log(`  Lucro: ${resultadoVela.breakdown.percentages.profitPercent.toFixed(1)}%`);
