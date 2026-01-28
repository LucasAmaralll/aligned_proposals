import React, { useState } from 'react';
import { InformationCircleIcon, CalculatorIcon } from '@heroicons/react/24/outline';
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
        {/* Informações */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <InformationCircleIcon className="h-5 w-5 text-blue-400 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Como usar:</h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                <ul className="list-disc list-inside space-y-1">
                  <li>Informe a quantidade e preço da compra original</li>
                  <li>Informe a quantidade que você realmente usou</li>
                  <li>A calculadora mostrará o custo proporcional</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Exemplo */}
        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Exemplo:</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Comprei <strong>1kg</strong> de PLA por <strong>R$ 98,00</strong>, mas usei apenas <strong>128g</strong>.
            <br />Quanto custou a quantidade que usei? = <strong>R$ 12,54</strong>
          </p>
        </div>

        {/* Formulário */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Dados da Compra</h3>
          <div className="grid grid-cols-3 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Unidade
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Quantidade Usada</h3>
          <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Unidade
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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

        {/* Resultado */}
        {calculatedCost && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-700 rounded-lg">
            <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-3">Resultado:</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700 dark:text-green-400">Quantidade usada:</span>
                <span className="text-sm font-semibold text-green-900 dark:text-green-200">
                  {purchaseData.usedQuantity} {purchaseData.usedUnit} de {purchaseData.purchaseQuantity} {purchaseData.purchaseUnit}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-green-200 dark:border-green-700">
                <span className="text-sm text-green-700 dark:text-green-400">Custo Total:</span>
                <span className="text-xl font-bold text-green-900 dark:text-green-100">
                  R$ {calculatedCost}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="primary"
            onClick={handleCalculate}
            disabled={!purchaseData.purchaseQuantity || !purchaseData.purchasePrice || !purchaseData.usedQuantity}
          >
            Calcular
          </Button>
          
          {calculatedCost && (
            <Button variant="success" onClick={handleUseValue}>
              Usar no Formulário
            </Button>
          )}
          
          <Button variant="secondary" onClick={handleClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default MaterialCalculator;
