import React, { useState } from 'react';
import { CalculatorIcon } from '@heroicons/react/24/outline';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';

const EnergyCalculator = ({ onCalculate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    potenciaWatts: '',
    tempoHoras: '',
    tarifaKwh: '',
  });
  const [resultado, setResultado] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calcular = () => {
    const potencia = parseFloat(formData.potenciaWatts) || 0;
    const tempo = parseFloat(formData.tempoHoras) || 0;
    const tarifa = parseFloat(formData.tarifaKwh) || 0;

    // Converte Watts para kW e multiplica pelo tempo
    const consumoKwh = (potencia / 1000) * tempo;
    const custoTotal = consumoKwh * tarifa;

    setResultado({
      consumoKwh: consumoKwh.toFixed(3),
      custoTotal: custoTotal.toFixed(2),
    });

    // Se foi passada uma função de callback, chama com os valores calculados
    if (onCalculate) {
      onCalculate({
        energyConsumptionKwh: consumoKwh,
        energyCostPerKwh: tarifa,
      });
    }
  };

  const usarResultado = () => {
    if (resultado && onCalculate) {
      onCalculate({
        energyConsumptionKwh: parseFloat(resultado.consumoKwh),
        energyCostPerKwh: parseFloat(formData.tarifaKwh),
      });
      setIsOpen(false);
    }
  };

  const resetar = () => {
    setFormData({
      potenciaWatts: '',
      tempoHoras: '',
      tarifaKwh: '',
    });
    setResultado(null);
  };

  return (
    <>
      {/* Botão para abrir a calculadora */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        <CalculatorIcon className="w-5 h-5" />
        Calcular consumo de energia
      </button>

      {/* Modal da calculadora */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Calculadora de Energia Elétrica"
      >
        <div className="space-y-4">
          {/* Informações */}
          <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <CalculatorIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Como usar:</h3>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Informe a potência do equipamento em Watts (ex: 1000W)</li>
                    <li>Informe quanto tempo o equipamento fica ligado em horas</li>
                    <li>Informe o valor do kWh da sua conta de luz (ex: R$ 0,85)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Exemplos de potência */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Exemplos de potência:</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
              <div>• Forno elétrico: 1500W</div>
              <div>• Computador: 300W</div>
              <div>• Lâmpada LED: 10W</div>
              <div>• Ferro de passar: 1000W</div>
              <div>• Ar condicionado: 1200W</div>
              <div>• Geladeira: 150W</div>
            </div>
          </div>

          {/* Formulário */}
          <div className="space-y-4">
            <Input
              label="Potência do Equipamento (Watts)"
              name="potenciaWatts"
              type="number"
              value={formData.potenciaWatts}
              onChange={handleChange}
              placeholder="Ex: 1000"
              min="0"
            />

            <Input
              label="Tempo de Uso (horas)"
              name="tempoHoras"
              type="number"
              step="0.1"
              value={formData.tempoHoras}
              onChange={handleChange}
              placeholder="Ex: 2.5"
              min="0"
            />

            <Input
              label="Tarifa por kWh (R$)"
              name="tarifaKwh"
              type="number"
              step="0.01"
              value={formData.tarifaKwh}
              onChange={handleChange}
              placeholder="Ex: 0.85"
              min="0"
            />
          </div>

          {/* Resultado */}
          {resultado && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-700 rounded-lg">
              <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-3">Resultado:</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700 dark:text-green-400">Consumo:</span>
                  <span className="text-lg font-bold text-green-900 dark:text-green-100">
                    {resultado.consumoKwh} kWh
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-green-200 dark:border-green-700">
                  <span className="text-sm text-green-700 dark:text-green-400">Custo Total:</span>
                  <span className="text-xl font-bold text-green-900 dark:text-green-100">
                    R$ {resultado.custoTotal}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="primary"
              onClick={calcular}
              disabled={!formData.potenciaWatts || !formData.tempoHoras || !formData.tarifaKwh}
            >
              Calcular
            </Button>
            
            {resultado && onCalculate && (
              <Button variant="success" onClick={usarResultado}>
                Usar no Formulário
              </Button>
            )}
            
            <Button variant="secondary" onClick={resetar}>
              Limpar
            </Button>
            
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default EnergyCalculator;
