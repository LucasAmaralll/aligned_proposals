import React, { useEffect, useState } from 'react';
import Button from './Button';
import Input from './Input';

const emptyFabric = () => ({ name: '', meters: '', pricePerMeter: '', wastePercent: '10' });
const emptyTrim = () => ({ name: '', quantity: '', unitCost: '' });

const toForm = (data) => {
  if (!data) {
    return {
      name: '',
      description: '',
      fabrics: [emptyFabric()],
      trims: [emptyTrim()],
      sewingMinutes: '',
      laborCostPerHour: '',
      finishingCost: '',
      overheadPercent: '12',
      profitMargin: '40',
      retailMargin: '80',
    };
  }

  const materials = Array.isArray(data.rawMaterials) ? data.rawMaterials : [];
  const fabrics = materials.filter((item) => item.kind === 'fabric');
  const trims = materials.filter((item) => item.kind === 'trim');
  const legacy = materials.filter((item) => !item.kind);
  const expenses = Array.isArray(data.expenses) ? data.expenses : [];

  return {
    name: data.name || '',
    description: data.description || '',
    fabrics: fabrics.length ? fabrics : [emptyFabric()],
    trims: [
      ...trims,
      ...legacy.map((item) => ({ name: item.name, quantity: 1, unitCost: item.cost })),
      ...(trims.length || legacy.length ? [] : [emptyTrim()]),
    ],
    sewingMinutes: data.productionTimeHours
      ? String(Math.round(parseFloat(data.productionTimeHours) * 60))
      : '',
    laborCostPerHour: data.laborCostPerHour || '',
    finishingCost: expenses.find((item) => item.type === 'variable')?.cost || '',
    overheadPercent: expenses.find((item) => item.type === 'overhead')?.percent || '12',
    profitMargin: data.profitMargin || '40',
    retailMargin: expenses.find((item) => item.type === 'retail')?.percent || '80',
  };
};

const toPayload = (form) => {
  const rawMaterials = [
    ...form.fabrics
      .filter((item) => item.name || item.meters || item.pricePerMeter)
      .map((item) => ({ ...item, kind: 'fabric' })),
    ...form.trims
      .filter((item) => item.name || item.quantity || item.unitCost)
      .map((item) => ({ ...item, kind: 'trim' })),
  ];

  return {
    name: form.name,
    description: form.description,
    rawMaterials,
    productionTimeHours: (parseFloat(form.sewingMinutes || 0) / 60).toFixed(4),
    laborCostPerHour: form.laborCostPerHour || 0,
    profitMargin: form.profitMargin || 0,
    energyConsumptionKwh: 0,
    energyCostPerKwh: 0,
    expenses: [
      { name: 'Acabamento', type: 'variable', cost: form.finishingCost || 0 },
      { name: 'Custos da fábrica', type: 'overhead', percent: form.overheadPercent || 0 },
      { name: 'Margem da loja', type: 'retail', percent: form.retailMargin || 0 },
    ],
  };
};

const money = (value) =>
  Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const Bar = ({ label, percent, color }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-sm text-gray-700 dark:text-gray-300 w-32 shrink-0">{label}</span>
    <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(percent || 0, 100)}%` }} />
    </div>
    <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
      {(percent || 0).toFixed(0)}%
    </span>
  </div>
);

const PricingCalculator = ({ onCalculate, initialData = null, onSave }) => {
  const [form, setForm] = useState(() => toForm(initialData));
  const [calculation, setCalculation] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (initialData) setForm(toForm(initialData));
  }, [initialData]);

  const setField = (field) => (e) => setForm((current) => ({ ...current, [field]: e.target.value }));

  const updateList = (key, index, field, value) => {
    setForm((current) => ({
      ...current,
      [key]: current[key].map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const addRow = (key, factory) => {
    setForm((current) => ({ ...current, [key]: [...current[key], factory()] }));
  };

  const removeRow = (key, index) => {
    setForm((current) => ({
      ...current,
      [key]: current[key].length === 1 ? current[key] : current[key].filter((_, i) => i !== index),
    }));
  };

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      const result = await onCalculate(toPayload(form));
      setCalculation(result);
    } catch (error) {
      console.error('Erro ao calcular:', error);
      alert('Erro ao calcular o preço');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSave = async () => {
    if (onSave) {
      await onSave(toPayload(form), calculation);
    }
  };

  return (
    <div className="space-y-6">
      <div className="surface p-6 space-y-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">A peça</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Custo de uma unidade, do tecido até o preço sugerido na loja.
          </p>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <Input
              label="Nome da peça *"
              value={form.name}
              onChange={setField('name')}
              placeholder="Ex: Vestido midi linho"
            />
            <Input
              label="Referência / descrição"
              value={form.description}
              onChange={setField('description')}
              placeholder="Ex: REF 014 · verão"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tecido</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Metros por peça, preço do metro e quebra de corte.</p>
            </div>
            <Button type="button" variant="secondary" onClick={() => addRow('fabrics', emptyFabric)}>
              + tecido
            </Button>
          </div>
          {form.fabrics.map((item, index) => (
            <div key={index} className="grid md:grid-cols-12 gap-3 mb-3">
              <div className="md:col-span-4">
                <Input
                  label={index === 0 ? 'Tecido' : ''}
                  value={item.name}
                  onChange={(e) => updateList('fabrics', index, 'name', e.target.value)}
                  placeholder="Linho, malha, forro..."
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label={index === 0 ? 'Metros' : ''}
                  type="number"
                  step="0.01"
                  value={item.meters}
                  onChange={(e) => updateList('fabrics', index, 'meters', e.target.value)}
                />
              </div>
              <div className="md:col-span-3">
                <Input
                  label={index === 0 ? 'R$ / metro' : ''}
                  type="number"
                  step="0.01"
                  value={item.pricePerMeter}
                  onChange={(e) => updateList('fabrics', index, 'pricePerMeter', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label={index === 0 ? 'Quebra %' : ''}
                  type="number"
                  step="0.1"
                  value={item.wastePercent}
                  onChange={(e) => updateList('fabrics', index, 'wastePercent', e.target.value)}
                />
              </div>
              <div className={`${index === 0 ? 'md:mt-8' : ''} md:col-span-1`}>
                <button
                  type="button"
                  onClick={() => removeRow('fabrics', index)}
                  className="text-sm text-red-600 dark:text-red-400 py-2"
                >
                  Tirar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Aviamentos</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Zíper, botão, linha, etiqueta, elástico...</p>
            </div>
            <Button type="button" variant="secondary" onClick={() => addRow('trims', emptyTrim)}>
              + aviamento
            </Button>
          </div>
          {form.trims.map((item, index) => (
            <div key={index} className="grid md:grid-cols-12 gap-3 mb-3">
              <div className="md:col-span-5">
                <Input
                  label={index === 0 ? 'Item' : ''}
                  value={item.name}
                  onChange={(e) => updateList('trims', index, 'name', e.target.value)}
                  placeholder="Zíper invisível 40cm"
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label={index === 0 ? 'Qtd' : ''}
                  type="number"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => updateList('trims', index, 'quantity', e.target.value)}
                />
              </div>
              <div className="md:col-span-4">
                <Input
                  label={index === 0 ? 'R$ unitário' : ''}
                  type="number"
                  step="0.01"
                  value={item.unitCost}
                  onChange={(e) => updateList('trims', index, 'unitCost', e.target.value)}
                />
              </div>
              <div className={`${index === 0 ? 'md:mt-8' : ''} md:col-span-1`}>
                <button
                  type="button"
                  onClick={() => removeRow('trims', index)}
                  className="text-sm text-red-600 dark:text-red-400 py-2"
                >
                  Tirar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Mão de obra</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Tempo de costura da peça e valor da hora (costureira ou facção).
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <Input
              label="Minutos de costura"
              type="number"
              step="1"
              value={form.sewingMinutes}
              onChange={setField('sewingMinutes')}
              placeholder="45"
            />
            <Input
              label="Valor da hora (R$)"
              type="number"
              step="0.01"
              value={form.laborCostPerHour}
              onChange={setField('laborCostPerHour')}
              placeholder="25,00"
            />
            <Input
              label="Acabamento / peça (R$)"
              type="number"
              step="0.01"
              value={form.finishingCost}
              onChange={setField('finishingCost')}
              placeholder="Passadoria, revisão..."
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Margens</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Custos da fábrica entram como % sobre o custo direto. Depois a margem da fábrica e a da loja.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <Input
              label="Custos da fábrica (%)"
              type="number"
              step="0.1"
              value={form.overheadPercent}
              onChange={setField('overheadPercent')}
            />
            <Input
              label="Margem fábrica (%)"
              type="number"
              step="0.1"
              value={form.profitMargin}
              onChange={setField('profitMargin')}
            />
            <Input
              label="Margem da loja (%)"
              type="number"
              step="0.1"
              value={form.retailMargin}
              onChange={setField('retailMargin')}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" onClick={handleCalculate} disabled={isCalculating || !form.name}>
            {isCalculating ? 'Calculando...' : 'Calcular peça'}
          </Button>
          {calculation && onSave && (
            <Button type="button" variant="success" onClick={handleSave}>
              Salvar ficha
            </Button>
          )}
        </div>
      </div>

      {calculation && (
        <div className="surface p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ficha de custo</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="rounded-xl bg-gray-50 dark:bg-zinc-800 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Tecido</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{money(calculation.costs.fabric ?? calculation.costs.rawMaterials)}</p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-zinc-800 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Aviamentos</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{money(calculation.costs.trims || 0)}</p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-zinc-800 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Mão de obra</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{money(calculation.costs.labor)}</p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-zinc-800 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Acabamento</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{money(calculation.costs.finishing ?? calculation.costs.variableExpenses)}</p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-zinc-800 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Custos da fábrica</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{money(calculation.costs.overhead ?? calculation.costs.fixedExpenses)}</p>
            </div>
            <div className="rounded-xl bg-gray-900 dark:bg-white p-4">
              <p className="text-xs uppercase tracking-wider text-gray-300 dark:text-zinc-500">Custo da peça</p>
              <p className="text-lg font-semibold text-white dark:text-zinc-950">{money(calculation.costs.total)}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-gray-200 dark:border-zinc-700 p-5">
              <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Custo (piso)</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                {money(calculation.prices.minimumSalePrice)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Abaixo disso a peça sai no prejuízo.</p>
            </div>
            <div className="rounded-2xl border border-gray-900 dark:border-white p-5">
              <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Preço fábrica</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                {money(calculation.prices.factoryPrice ?? calculation.prices.idealSalePrice)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Lucro {money(calculation.prices.profitValue)}
              </p>
            </div>
            <div className="rounded-2xl bg-gray-900 dark:bg-white p-5">
              <p className="text-xs uppercase tracking-wider text-gray-300 dark:text-zinc-500">Preço sugerido na loja</p>
              <p className="text-2xl font-semibold text-white dark:text-zinc-950 mt-1">
                {money(calculation.prices.retailPrice ?? calculation.prices.idealSalePrice)}
              </p>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Margem da loja em cima do preço fábrica.</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Composição do preço fábrica
            </h3>
            <Bar label="Tecido" percent={calculation.breakdown.percentages.fabricPercent ?? calculation.breakdown.percentages.rawMaterialsPercent} color="bg-gray-800 dark:bg-zinc-200" />
            <Bar label="Aviamentos" percent={calculation.breakdown.percentages.trimsPercent || 0} color="bg-gray-500" />
            <Bar label="Mão de obra" percent={calculation.breakdown.percentages.laborPercent} color="bg-gray-400" />
            <Bar label="Acabamento" percent={calculation.breakdown.percentages.finishingPercent ?? calculation.breakdown.percentages.variableExpensesPercent} color="bg-gray-300" />
            <Bar label="Fábrica" percent={calculation.breakdown.percentages.overheadPercent ?? calculation.breakdown.percentages.fixedExpensesPercent} color="bg-zinc-400" />
            <Bar label="Lucro" percent={calculation.breakdown.percentages.profitPercent} color="bg-emerald-500" />
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingCalculator;
