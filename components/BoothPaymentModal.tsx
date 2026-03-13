import React, { useState } from 'react';
import { X, DollarSign, CreditCard, Smartphone, Banknote, CheckCircle, Calculator, Receipt } from 'lucide-react';
import { ParkingRecord, VehicleType } from '../types';

interface BoothPaymentModalProps {
  record: ParkingRecord;
  cost: number; // This is the final total from App.tsx (already includes IVA if enabled)
  duration: string;
  onConfirm: (recordId: string, finalCost: number, paymentMethod: string, cashGiven?: number, change?: number) => void;
  onClose: () => void;
  ivaEnabled: boolean;
  ivaRate: number;
}

type PayMethod = 'EFECTIVO' | 'TARJETA' | 'NEQUI';

export const BoothPaymentModal: React.FC<BoothPaymentModalProps> = ({
  record,
  cost,
  duration,
  onConfirm,
  onClose,
  ivaEnabled,
  ivaRate
}) => {
  const [method, setMethod] = useState<PayMethod>('EFECTIVO');
  const [cashGiven, setCashGiven] = useState('');

  // Recalculate subtotal for display if IVA is enabled
  const subtotal = ivaEnabled ? Math.round(cost / (1 + ivaRate / 100)) : cost;
  const ivaAmount = cost - subtotal;
  
  const cashGivenNum = parseFloat(cashGiven.replace(/\./g, '').replace(',', '.')) || 0;
  const change = cashGivenNum - cost;
  const hasEnoughCash = cashGivenNum >= cost;

  const formatCOP = (val: number) =>
    val.toLocaleString('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    }).replace('COP', '$');

  const handleConfirm = () => {
    if (method === 'EFECTIVO' && !hasEnoughCash) return;
    const methodLabel = method === 'EFECTIVO'
      ? 'Efectivo'
      : method === 'TARJETA' ? 'Tarjeta' : 'Nequi';
      
    onConfirm(
      record.id, 
      cost, 
      methodLabel, 
      method === 'EFECTIVO' ? cashGivenNum : undefined, 
      method === 'EFECTIVO' ? change : undefined
    );
  };

  const quickAmounts = [5000, 10000, 20000, 50000, 100000].filter(a => a >= cost).slice(0, 4);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase opacity-80 tracking-widest mb-1">Cobro en Taquilla</p>
              <h2 className="text-3xl font-black tracking-wider font-mono">{record.plate}</h2>
              <p className="text-emerald-100 text-sm mt-1">{record.vehicleType} · {duration}</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-xl transition-colors">
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">

          {/* Cost Summary */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-bold text-gray-800">{formatCOP(subtotal)}</span>
            </div>
            
            {ivaEnabled && (
              <div className="flex justify-between text-sm text-amber-600 font-semibold">
                <span>IVA ({ivaRate}%)</span>
                <span>+{formatCOP(ivaAmount)}</span>
              </div>
            )}

            <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
              <span className="font-bold text-gray-700 flex items-center gap-1"><Receipt size={16} /> TOTAL A PAGAR</span>
              <span className="text-2xl font-black text-emerald-600">{formatCOP(cost)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Método de Pago</p>
            <div className="grid grid-cols-3 gap-3">
              {([
                { id: 'EFECTIVO', label: 'Efectivo', icon: Banknote, color: 'emerald' },
                { id: 'TARJETA', label: 'Tarjeta', icon: CreditCard, color: 'blue' },
                { id: 'NEQUI', label: 'Nequi', icon: Smartphone, color: 'purple' },
              ] as { id: PayMethod; label: string; icon: React.ElementType; color: string }[]).map(({ id, label, icon: Icon, color }) => (
                <button
                  key={id}
                  onClick={() => setMethod(id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all font-bold text-sm ${method === id
                    ? `border-${color}-500 bg-${color}-50 text-${color}-700`
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                >
                  <Icon size={24} className={method === id ? `text-${color}-600` : 'text-gray-400'} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Efectivo Section */}
          {method === 'EFECTIVO' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                  Con cuánto paga el cliente
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
                  <input
                    type="number"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    placeholder="0"
                    className="w-full pl-9 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-2xl font-bold text-gray-900 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick Amounts */}
              {quickAmounts.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {quickAmounts.map(amt => (
                    <button
                      key={amt}
                      onClick={() => setCashGiven(String(amt))}
                      className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-colors"
                    >
                      ${amt.toLocaleString('es-CO')}
                    </button>
                  ))}
                </div>
              )}

              {/* Change Calculation */}
              {cashGivenNum > 0 && (
                <div className={`rounded-xl p-4 ${hasEnoughCash ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`font-bold text-sm ${hasEnoughCash ? 'text-emerald-700' : 'text-red-700'}`}>
                      {hasEnoughCash ? '💵 Vueltas a dar:' : '⚠️ Falta:'}
                    </span>
                    <span className={`text-2xl font-black ${hasEnoughCash ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCOP(Math.abs(change))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Non-cash instruction */}
          {method !== 'EFECTIVO' && (
            <div className={`rounded-xl p-4 text-sm font-semibold text-center ${method === 'TARJETA' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>
              {method === 'TARJETA'
                ? '💳 El operario gestiona el cobro con la terminal de tarjeta. Confirmar cuando el pago sea exitoso.'
                : '📱 El operario gestiona la transferencia Nequi. Confirmar cuando el pago sea recibido.'}
            </div>
          )}

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            disabled={method === 'EFECTIVO' && !hasEnoughCash}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-200 text-lg active:scale-[0.98]"
          >
            <CheckCircle size={22} />
            Confirmar Pago · {formatCOP(cost)}
          </button>
        </div>
      </div>
    </div>
  );
};
