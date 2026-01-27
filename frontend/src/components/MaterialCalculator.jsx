import React, { useState } from 'react';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';

function MaterialCalculator({ isOpen, onClose, onCalculate }) {
  const [purchaseData, setPurchaseData] = useState({
    purchaseQuantity: '',
    purchaseUnit: 'kg',
    purchasePrice: '',
    usedQuantity: '',
    usedUnit: 'g'
  });

  const [calculatedCost, setCalculatedCost] = useState(null);

  const unitConversions = {
    'kg': 1000,
    'g': 1,
    'L': 1000,
    'ml': 1,
    'm': 100,
    'cm': 1,
    'unidade': 1
  };

  const handleCalculate = () => {
    const { purchaseQuantity, purchaseUnit, purchasePrice, usedQuantity, usedUnit } = purchaseData;

    if (!purchaseQuantity || !purchasePrice || !usedQuantity) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    // Converter tudo para a menor unidade
    const purchaseInBaseUnit = parseFloat(purchaseQuantity) * unitConversions[purchaseUnit];
    const usedInBaseUnit = parseFloat(usedQuantity) * unitConversions[usedUnit];

    // Calcular o custo proporcional
    const costPerBaseUnit = parseFloat(purchasePrice) / purchaseInBaseUnit;
    const totalCost = costPerBaseUnit * usedInBaseUnit;

    setCalculatedCost(totalCost.toFixed(2));
  };

  const handleUseValue = () => {
    if (calculatedCost) {
      onCalculate(parseFloat(calculatedCost));
      handleClose();
    }
  };

  const handleClose = () => {
    setPurchaseData({
      purchaseQuantity: '',
      purchaseUnit: 'kg',
      purchasePrice: '',
      usedQuantity: '',
      usedUnit: 'g'
    });
    setCalculatedCost(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Calculadora de Matéria-Prima">
      <div className="space-y-4">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
          <p className="text-sm text-blue-800">
            <strong>Exemplo:</strong> Comprei 1kg de PLA por R$ 98,00, mas usei apenas 128g.
            <br />Quanto custou a quantidade que usei?
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Dados da Compra</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <Input
                label="Quantidade"
                type="number"
                step="0.01"
                value={purchaseData.purchaseQuantity}
                onChange={(e) => setPurchaseData({ ...purchaseData, purchaseQuantity: e.target.value })}
                placeholder="1"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidade
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={purchaseData.purchaseUnit}
                onChange={(e) => setPurchaseData({ ...purchaseData, purchaseUnit: e.target.value })}
              >
                <option value="kg">kg (quilograma)</option>
                <option value="g">g (grama)</option>
                <option value="L">L (litro)</option>
                <option value="ml">ml (mililitro)</option>
                <option value="m">m (metro)</option>
                <option value="cm">cm (centímetro)</option>
                <option value="unidade">unidade</option>
              </select>
            </div>
            <div className="col-span-1">
              <Input
                label="Preço Total (R$)"
                type="number"
                step="0.01"
                value={purchaseData.purchasePrice}
                onChange={(e) => setPurchaseData({ ...purchaseData, purchasePrice: e.target.value })}
                placeholder="98.00"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Quantidade Usada</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-1">
              <Input
                label="Quantidade"
                type="number"
                step="0.01"
                value={purchaseData.usedQuantity}
                onChange={(e) => setPurchaseData({ ...purchaseData, usedQuantity: e.target.value })}
                placeholder="128"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidade
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={purchaseData.usedUnit}
                onChange={(e) => setPurchaseData({ ...purchaseData, usedUnit: e.target.value })}
              >
                <option value="kg">kg (quilograma)</option>
                <option value="g">g (grama)</option>
                <option value="L">L (litro)</option>
                <option value="ml">ml (mililitro)</option>
                <option value="m">m (metro)</option>
                <option value="cm">cm (centímetro)</option>
                <option value="unidade">unidade</option>
              </select>
            </div>
          </div>
        </div>

        <Button
          onClick={handleCalculate}
          className="w-full"
          variant="secondary"
        >
          Calcular Custo
        </Button>

        {calculatedCost && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-sm text-gray-700 mb-1">
              Custo da quantidade usada:
            </p>
            <p className="text-2xl font-bold text-green-700">
              R$ {calculatedCost}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              {purchaseData.usedQuantity} {purchaseData.usedUnit} de {purchaseData.purchaseQuantity} {purchaseData.purchaseUnit}
            </p>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button
            onClick={handleClose}
            variant="outline"
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUseValue}
            className="flex-1"
            disabled={!calculatedCost}
          >
            Usar Valor Calculado
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default MaterialCalculator;
