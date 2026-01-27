import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import EnergyCalculator from '../components/EnergyCalculator';
import MaterialCalculator from '../components/MaterialCalculator';

const PricingCalculator = ({ onCalculate, initialData = null, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rawMaterials: [{ name: '', cost: '' }],
    productionTimeHours: '',
    energyConsumptionKwh: '',
    energyCostPerKwh: '',
    laborCostPerHour: '',
    expenses: [{ name: '', cost: '', type: 'fixed' }],
    profitMargin: '',
  });

  const [calculation, setCalculation] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showMaterialCalculator, setShowMaterialCalculator] = useState(false);
  const [currentMaterialIndex, setCurrentMaterialIndex] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        rawMaterials: initialData.rawMaterials || [{ name: '', cost: '' }],
        productionTimeHours: initialData.productionTimeHours || '',
        energyConsumptionKwh: initialData.energyConsumptionKwh || '',
        energyCostPerKwh: initialData.energyCostPerKwh || '',
        laborCostPerHour: initialData.laborCostPerHour || '',
        expenses: initialData.expenses || [{ name: '', cost: '', type: 'fixed' }],
        profitMargin: initialData.profitMargin || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRawMaterialChange = (index, field, value) => {
    const updated = [...formData.rawMaterials];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, rawMaterials: updated }));
  };

  const addRawMaterial = () => {
    setFormData((prev) => ({
      ...prev,
      rawMaterials: [...prev.rawMaterials, { name: '', cost: '' }],
    }));
  };

  const removeRawMaterial = (index) => {
    const updated = formData.rawMaterials.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, rawMaterials: updated }));
  };

  const handleExpenseChange = (index, field, value) => {
    const updated = [...formData.expenses];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, expenses: updated }));
  };

  const addExpense = () => {
    setFormData((prev) => ({
      ...prev,
      expenses: [...prev.expenses, { name: '', cost: '', type: 'fixed' }],
    }));
  };

  const removeExpense = (index) => {
    const updated = formData.expenses.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, expenses: updated }));
  };

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      const result = await onCalculate(formData);
      setCalculation(result);
    } catch (error) {
      console.error('Erro ao calcular:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSave = async () => {
    if (onSave) {
      await onSave(formData, calculation);
    }
  };

  const handleEnergyCalculation = (energyData) => {
    setFormData(prev => ({
      ...prev,
      energyConsumptionKwh: energyData.energyConsumptionKwh,
      energyCostPerKwh: energyData.energyCostPerKwh,
    }));
  };

  const handleMaterialCalculation = (calculatedCost) => {
    if (currentMaterialIndex !== null) {
      const updated = [...formData.rawMaterials];
      updated[currentMaterialIndex].cost = calculatedCost.toFixed(2);
      setFormData((prev) => ({ ...prev, rawMaterials: updated }));
    }
  };

  const openMaterialCalculator = (index) => {
    setCurrentMaterialIndex(index);
    setShowMaterialCalculator(true);
  };

  return (
    <div className="space-y-6">
      {/* Formulário */}
      <Card>
        <h2 className="text-2xl font-bold mb-6">Dados do Produto/Serviço</h2>

        {/* Nome e Descrição */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input
            label="Nome do Produto/Serviço *"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ex: Bolo de Chocolate"
          />
          <Input
            label="Descrição"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Descrição opcional"
          />
        </div>

        {/* Matérias-primas */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Matérias-Primas</h3>
          {formData.rawMaterials.map((material, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
              <Input
                label={index === 0 ? 'Nome' : ''}
                value={material.name}
                onChange={(e) => handleRawMaterialChange(index, 'name', e.target.value)}
                placeholder="Ex: Farinha de trigo"
              />
              <Input
                label={index === 0 ? 'Custo (R$)' : ''}
                type="number"
                step="0.01"
                value={material.cost}
                onChange={(e) => handleRawMaterialChange(index, 'cost', e.target.value)}
                placeholder="0.00"
              />
              <div className={index === 0 ? 'mt-8' : ''}>
                <Button
                  variant="secondary"
                  onClick={() => openMaterialCalculator(index)}
                  className="w-full"
                >
                  🧮 Calcular
                </Button>
              </div>
              <div className={index === 0 ? 'mt-8' : ''}>
                <Button
                  variant="danger"
                  onClick={() => removeRawMaterial(index)}
                  disabled={formData.rawMaterials.length === 1}
                >
                  Remover
                </Button>
              </div>
            </div>
          ))}
          <Button variant="secondary" onClick={addRawMaterial}>
            + Adicionar Matéria-Prima
          </Button>
        </div>

        {/* Tempo e Energia */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Tempo de Produção e Energia</h3>
            <EnergyCalculator onCalculate={handleEnergyCalculation} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Tempo de Produção (horas)"
              name="productionTimeHours"
              type="number"
              step="0.01"
              value={formData.productionTimeHours}
              onChange={handleChange}
              placeholder="0.00"
            />
            <Input
              label="Consumo de Energia (kWh)"
              name="energyConsumptionKwh"
              type="number"
              step="0.001"
              value={formData.energyConsumptionKwh}
              onChange={handleChange}
              placeholder="0.000"
            />
            <Input
              label="Custo por kWh (R$)"
              name="energyCostPerKwh"
              type="number"
              step="0.01"
              value={formData.energyCostPerKwh}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Mão de obra */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input
            label="Custo de Mão de Obra por Hora (R$)"
            name="laborCostPerHour"
            type="number"
            step="0.01"
            value={formData.laborCostPerHour}
            onChange={handleChange}
            placeholder="0.00"
          />
          <Input
            label="Margem de Lucro (%)"
            name="profitMargin"
            type="number"
            step="0.01"
            value={formData.profitMargin}
            onChange={handleChange}
            placeholder="0.00"
          />
        </div>

        {/* Despesas */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Despesas Fixas e Variáveis</h3>
          {formData.expenses.map((expense, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
              <Input
                label={index === 0 ? 'Nome' : ''}
                value={expense.name}
                onChange={(e) => handleExpenseChange(index, 'name', e.target.value)}
                placeholder="Ex: Aluguel"
              />
              <Input
                label={index === 0 ? 'Custo (R$)' : ''}
                type="number"
                step="0.01"
                value={expense.cost}
                onChange={(e) => handleExpenseChange(index, 'cost', e.target.value)}
                placeholder="0.00"
              />
              <div>
                {index === 0 && <label className="block text-sm font-medium mb-2">Tipo</label>}
                <select
                  value={expense.type}
                  onChange={(e) => handleExpenseChange(index, 'type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="fixed">Fixa</option>
                  <option value="variable">Variável</option>
                </select>
              </div>
              <div className={index === 0 ? 'mt-8' : ''}>
                <Button
                  variant="danger"
                  onClick={() => removeExpense(index)}
                  disabled={formData.expenses.length === 1}
                >
                  Remover
                </Button>
              </div>
            </div>
          ))}
          <Button variant="secondary" onClick={addExpense}>
            + Adicionar Despesa
          </Button>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-4">
          <Button onClick={handleCalculate} disabled={isCalculating || !formData.name}>
            {isCalculating ? 'Calculando...' : 'Calcular Preço'}
          </Button>
          {calculation && onSave && (
            <Button variant="success" onClick={handleSave}>
              Salvar Produto
            </Button>
          )}
        </div>
      </Card>

      {/* Resultado do Cálculo */}
      {calculation && (
        <Card>
          <h2 className="text-2xl font-bold mb-6">Resultado da Precificação</h2>

          {/* Resumo dos Custos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">Matérias-Primas</p>
              <p className="text-xl font-bold">R$ {calculation.costs.rawMaterials.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">Energia Elétrica</p>
              <p className="text-xl font-bold">R$ {calculation.costs.energy.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">Mão de Obra</p>
              <p className="text-xl font-bold">R$ {calculation.costs.labor.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">Despesas Fixas</p>
              <p className="text-xl font-bold">R$ {calculation.costs.fixedExpenses.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">Despesas Variáveis</p>
              <p className="text-xl font-bold">R$ {calculation.costs.variableExpenses.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-blue-100 rounded-lg">
              <p className="text-sm text-blue-600 font-semibold">Custo Total</p>
              <p className="text-xl font-bold text-blue-700">R$ {calculation.costs.total.toFixed(2)}</p>
            </div>
          </div>

          {/* Preços */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-6 bg-yellow-100 rounded-lg border-2 border-yellow-400">
              <p className="text-sm text-yellow-700 font-semibold">Preço Mínimo (Sem Lucro)</p>
              <p className="text-2xl font-bold text-yellow-900">R$ {calculation.prices.minimumSalePrice.toFixed(2)}</p>
            </div>
            <div className="p-6 bg-green-100 rounded-lg border-2 border-green-400">
              <p className="text-sm text-green-700 font-semibold">Preço Ideal (Com Lucro)</p>
              <p className="text-2xl font-bold text-green-900">R$ {calculation.prices.idealSalePrice.toFixed(2)}</p>
            </div>
            <div className="p-6 bg-purple-100 rounded-lg border-2 border-purple-400">
              <p className="text-sm text-purple-700 font-semibold">Lucro por Unidade</p>
              <p className="text-2xl font-bold text-purple-900">R$ {calculation.prices.profitValue.toFixed(2)}</p>
            </div>
          </div>

          {/* Composição Percentual */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Composição do Preço</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Matérias-Primas</span>
                <div className="flex items-center gap-2">
                  <div className="w-48 bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-500 h-4 rounded-full"
                      style={{ width: `${calculation.breakdown.percentages.rawMaterialsPercent}%` }}
                    ></div>
                  </div>
                  <span className="font-semibold">{calculation.breakdown.percentages.rawMaterialsPercent.toFixed(1)}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Energia</span>
                <div className="flex items-center gap-2">
                  <div className="w-48 bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-yellow-500 h-4 rounded-full"
                      style={{ width: `${calculation.breakdown.percentages.energyPercent}%` }}
                    ></div>
                  </div>
                  <span className="font-semibold">{calculation.breakdown.percentages.energyPercent.toFixed(1)}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Mão de Obra</span>
                <div className="flex items-center gap-2">
                  <div className="w-48 bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-green-500 h-4 rounded-full"
                      style={{ width: `${calculation.breakdown.percentages.laborPercent}%` }}
                    ></div>
                  </div>
                  <span className="font-semibold">{calculation.breakdown.percentages.laborPercent.toFixed(1)}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Despesas Fixas</span>
                <div className="flex items-center gap-2">
                  <div className="w-48 bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-red-500 h-4 rounded-full"
                      style={{ width: `${calculation.breakdown.percentages.fixedExpensesPercent}%` }}
                    ></div>
                  </div>
                  <span className="font-semibold">{calculation.breakdown.percentages.fixedExpensesPercent.toFixed(1)}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Despesas Variáveis</span>
                <div className="flex items-center gap-2">
                  <div className="w-48 bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-orange-500 h-4 rounded-full"
                      style={{ width: `${calculation.breakdown.percentages.variableExpensesPercent}%` }}
                    ></div>
                  </div>
                  <span className="font-semibold">{calculation.breakdown.percentages.variableExpensesPercent.toFixed(1)}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Lucro</span>
                <div className="flex items-center gap-2">
                  <div className="w-48 bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-purple-500 h-4 rounded-full"
                      style={{ width: `${calculation.breakdown.percentages.profitPercent}%` }}
                    ></div>
                  </div>
                  <span className="font-semibold">{calculation.breakdown.percentages.profitPercent.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Modal Calculadora de Material */}
      <MaterialCalculator
        isOpen={showMaterialCalculator}
        onClose={() => setShowMaterialCalculator(false)}
        onCalculate={handleMaterialCalculation}
      />
    </div>
  );
};

export default PricingCalculator;
