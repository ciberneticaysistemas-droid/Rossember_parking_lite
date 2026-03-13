import React, { useState } from 'react';
import { X, Save, DollarSign, Settings, Car, Bike, Zap, Accessibility } from 'lucide-react';
import { VehicleType } from '../types';

interface RateSettingsModalProps {
  currentRates: Record<string, number>;
  onSave: (newRates: Record<string, number>) => void;
  onCancel: () => void;
}

export const RateSettingsModal: React.FC<RateSettingsModalProps> = ({
  currentRates,
  onSave,
  onCancel
}) => {
  const [carRate, setCarRate] = useState(currentRates[VehicleType.CAR]?.toString() || '0');
  const [motoRate, setMotoRate] = useState(currentRates[VehicleType.MOTORCYCLE]?.toString() || '0');
  const [bicycleRate, setBicycleRate] = useState(currentRates[VehicleType.BICYCLE]?.toString() || '0');

  const [carFullRate, setCarFullRate] = useState(currentRates['CAR_FULL']?.toString() || '0');
  const [motoFullRate, setMotoFullRate] = useState(currentRates['MOTO_FULL']?.toString() || '0');
  const [bicycleFullRate, setBicycleFullRate] = useState(currentRates['BICYCLE_FULL']?.toString() || '0');

  const [evRate, setEvRate] = useState(currentRates['EV_CHARGING_RATE']?.toString() || '0');
  const [disabilityDiscount, setDisabilityDiscount] = useState(currentRates['DISABILITY_DISCOUNT_PERCENT']?.toString() || '50');
  
  const [ivaEnabled, setIvaEnabled] = useState(currentRates['IVA_ENABLED'] === 1);
  const [ivaRate, setIvaRate] = useState(currentRates['IVA_RATE']?.toString() || '19');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      [VehicleType.CAR]: parseInt(carRate) || 0,
      [VehicleType.MOTORCYCLE]: parseInt(motoRate) || 0,
      [VehicleType.BICYCLE]: parseInt(bicycleRate) || 0,
      [VehicleType.UNKNOWN]: parseInt(carRate) || 0,
      'CAR_FULL': parseInt(carFullRate) || 0,
      'MOTO_FULL': parseInt(motoFullRate) || 0,
      'BICYCLE_FULL': parseInt(bicycleFullRate) || 0,
      'EV_CHARGING_RATE': parseInt(evRate) || 0,
      'DISABILITY_DISCOUNT_PERCENT': parseInt(disabilityDiscount) || 0,
      'IVA_ENABLED': ivaEnabled ? 1 : 0,
      'IVA_RATE': parseInt(ivaRate) || 0
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">

        <div className="bg-slate-800 p-4 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <h3 className="font-bold">Configuración de Tarifas</h3>
          </div>
          <button onClick={onCancel} className="hover:bg-slate-700 p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">

          <div className="grid md:grid-cols-2 gap-6">

            {/* CARROS */}
            <div className="space-y-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 text-blue-700 font-bold mb-2 border-b border-blue-200 pb-2">
                <Car size={18} /> Automóviles
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Valor Minuto</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign size={14} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={carRate}
                    onChange={(e) => setCarRate(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Tarifa Plena / Día</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign size={14} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={carFullRate}
                    onChange={(e) => setCarFullRate(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* MOTOS */}
            <div className="space-y-4 bg-orange-50 p-4 rounded-xl border border-orange-100">
              <div className="flex items-center gap-2 text-orange-700 font-bold mb-2 border-b border-orange-200 pb-2">
                <Bike size={18} /> Motocicletas
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Valor Minuto</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign size={14} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={motoRate}
                    onChange={(e) => setMotoRate(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Tarifa Plena / Día</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign size={14} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={motoFullRate}
                    onChange={(e) => setMotoFullRate(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* BICICLETAS */}
            <div className="space-y-4 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-700 font-bold mb-2 border-b border-emerald-200 pb-2">
                <Bike size={18} /> Bicicletas
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Valor Minuto</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign size={14} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={bicycleRate}
                    onChange={(e) => setBicycleRate(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Tarifa Plena / Día</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign size={14} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={bicycleFullRate}
                    onChange={(e) => setBicycleFullRate(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* EXTAS (EV + Discapacidad) */}
            <div className="space-y-4 bg-green-50 p-4 rounded-xl border border-green-100 md:col-span-2 grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 text-green-700 font-bold mb-2 border-b border-green-200 pb-2">
                  <Zap size={18} /> Carga Eléctrica
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Valor Minuto (Carga Incluida)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign size={14} className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={evRate}
                      onChange={(e) => setEvRate(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-purple-700 font-bold mb-2 border-b border-purple-200 pb-2">
                  <Accessibility size={18} /> Descuento Accesibilidad
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Porcentaje de Descuento (%)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-bold">
                      %
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={disabilityDiscount}
                      onChange={(e) => setDisabilityDiscount(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* IVA CONFIGURATION */}
            <div className="space-y-4 bg-orange-50 p-4 rounded-xl border border-orange-200 md:col-span-2">
              <div className="flex items-center justify-between border-b border-orange-200 pb-2">
                <div className="flex items-center gap-2 text-orange-700 font-bold">
                  <DollarSign size={18} /> Configuración de IVA
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={ivaEnabled} 
                    onChange={(e) => setIvaEnabled(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  <span className="ml-3 text-sm font-bold text-orange-700">{ivaEnabled ? 'ACTIVO' : 'INACTIVO'}</span>
                </label>
              </div>

              {ivaEnabled && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Porcentaje de IVA (%)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-bold">
                      %
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={ivaRate}
                      onChange={(e) => setIvaRate(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 font-mono font-bold"
                    />
                  </div>
                  <p className="text-[10px] text-orange-600 mt-2 font-medium italic">
                    * El IVA se sumará automáticamente al valor calculado del parqueadero.
                  </p>
                </div>
              )}
            </div>

          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={18} /> Guardar Cambios
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};