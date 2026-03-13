import React, { useState } from 'react';
import { X, CreditCard, ShieldCheck, Loader2, Building2, Accessibility, MapPin, Banknote, Landmark, CheckCircle } from 'lucide-react';

import { ParkingRecord, VehicleType } from '../types';

interface PaymentModalProps {
  plate: string;
  vehicleType: VehicleType;
  duration: string;
  cost: number;
  originalCost?: number;
  isDisabled?: boolean;
  records?: ParkingRecord[];
  onConfirm: (paymentMethod: string, email: string) => void;
  onCancel: () => void;
}

const BANKS = [
  "Nequi",
  "Bancolombia",
  "Davivienda",
  "Banco de Bogotá",
  "BBVA Colombia",
  "Daviplata",
  "Scotiabank Colpatria"
];

type PaymentMethodType = 'CASH' | 'CARD' | 'TRANSFER' | null;

export const PaymentModal: React.FC<PaymentModalProps> = ({
  plate,
  vehicleType,
  duration,
  cost,
  originalCost,
  isDisabled,
  records,
  onConfirm,
  onCancel
}) => {
  const [step, setStep] = useState<'METHOD_SELECT' | 'FORM' | 'PROCESSING' | 'SUCCESS'>('METHOD_SELECT');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>(null);
  const [selectedBank, setSelectedBank] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleMethodSelect = (method: PaymentMethodType) => {
    setSelectedMethod(method);
    setStep('FORM');
    setError('');
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations based on method
    if (selectedMethod === 'TRANSFER' && !selectedBank) {
      setError('Por favor selecciona un banco o billetera');
      return;
    }

    if (selectedMethod !== 'CASH' && !email) {
      setError('Por favor ingresa un correo electrónico para el recibo');
      return;
    }

    setStep('PROCESSING');

    // Simulate API/Processing delay
    const delay = selectedMethod === 'CASH' ? 1000 : 2500;

    setTimeout(() => {
      setStep('SUCCESS');

      let finalMethodStr = 'Efectivo';
      if (selectedMethod === 'CARD') finalMethodStr = 'Tarjeta Crédito/Débito';
      if (selectedMethod === 'TRANSFER') finalMethodStr = `Transferencia - ${selectedBank}`;

      // Delay before closing modal after success
      setTimeout(() => {
        onConfirm(finalMethodStr, email || 'efectivo@local.com');
      }, 1500);
    }, delay);
  };

  // Render header logic based on step/method
  const renderHeader = () => {
    let bgColor = "bg-slate-900";
    let title = "Opciones de Pago";
    let Icon = ShieldCheck;

    if (selectedMethod === 'CASH') {
      bgColor = "bg-emerald-600";
      title = "Pago en Efectivo";
      Icon = Banknote;
    } else if (selectedMethod === 'CARD') {
      bgColor = "bg-indigo-600";
      title = "Pago con Tarjeta";
      Icon = CreditCard;
    } else if (selectedMethod === 'TRANSFER') {
      bgColor = "bg-[#0033A0]"; // PSE blue
      title = "Transferencia / PSE";
      Icon = Landmark;
    }

    return (
      <div className={`${bgColor} p-6 text-white relative overflow-hidden transition-colors duration-300`}>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Icon size={100} />
        </div>
        <button onClick={onCancel} className="absolute top-4 right-4 hover:bg-white/20 p-1 rounded-full transition-colors z-10">
          <X size={20} />
        </button>

        {selectedMethod === 'TRANSFER' && (
          <div className="flex items-center gap-2 mb-1 relative z-10">
            <div className="bg-white text-[#0033A0] font-bold px-2 py-0.5 rounded-sm text-xs tracking-widest border-2 border-white">PSE</div>
            <span className="text-xs font-light opacity-80">Pagos Seguros en Línea</span>
          </div>
        )}

        <h2 className="text-2xl font-bold relative z-10">{title}</h2>
        <div className="flex items-center gap-2 mt-1 text-white/80 text-sm relative z-10">
          <span>Ref: {plate} - {vehicleType}</span>
          {isDisabled && (
            <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-xs text-white">
              <Accessibility size={10} /> Prioridad
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderSummaryCard = () => (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center relative overflow-hidden mb-5">
      {isDisabled && (
        <div className="absolute top-2 right-2 text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
          50% DCTO
        </div>
      )}
      <div>
        <p className="text-xs text-gray-500 uppercase font-semibold">Total a Pagar</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-gray-900">${cost.toLocaleString()}</p>
          {originalCost && originalCost > cost && (
            <p className="text-sm text-gray-400 line-through">${originalCost.toLocaleString()}</p>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-500">Tiempo</p>
        <p className="font-medium text-gray-700">{duration}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all">
        {renderHeader()}

        {/* STEP 1: SELECT PAYMENT METHOD */}
        {step === 'METHOD_SELECT' && (
          <div className="p-6">
            {renderSummaryCard()}

            <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Seleccionar Método de Pago</h3>

            <div className="space-y-3">
              <button
                onClick={() => handleMethodSelect('CASH')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group"
              >
                <div className="bg-gray-100 group-hover:bg-emerald-100 p-3 rounded-lg text-gray-600 group-hover:text-emerald-600 transition-colors">
                  <Banknote size={24} />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Efectivo / Metálico</p>
                  <p className="text-xs text-gray-500">Pago presencial en caja</p>
                </div>
              </button>

              <button
                onClick={() => handleMethodSelect('CARD')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
              >
                <div className="bg-gray-100 group-hover:bg-indigo-100 p-3 rounded-lg text-gray-600 group-hover:text-indigo-600 transition-colors">
                  <CreditCard size={24} />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Tarjeta Débito/Crédito</p>
                  <p className="text-xs text-gray-500">Uso de datáfono físico</p>
                </div>
              </button>

              <button
                onClick={() => handleMethodSelect('TRANSFER')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-[#0033A0] hover:bg-blue-50 transition-all text-left group"
              >
                <div className="bg-gray-100 group-hover:bg-blue-100 p-3 rounded-lg text-gray-600 group-hover:text-[#0033A0] transition-colors">
                  <Landmark size={24} />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Transferencia o PSE</p>
                  <p className="text-xs text-gray-500">Nequi, Daviplata, Bancolombia, etc.</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: FILL DETAILS & CONFIRM */}
        {step === 'FORM' && (
          <form onSubmit={handlePay} className="p-6">
            <button
              type="button"
              onClick={() => setStep('METHOD_SELECT')}
              className="text-sm text-gray-500 hover:text-gray-800 mb-4 flex items-center gap-1 font-medium"
            >
              ← Cambiar método de pago
            </button>

            {renderSummaryCard()}

            {/* Fields based on method */}
            <div className="space-y-4 mb-6">

              {selectedMethod === 'TRANSFER' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banco / Billetera</label>
                  <div className="relative">
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0033A0] focus:border-[#0033A0] outline-none appearance-none bg-white transition-all text-gray-900"
                    >
                      <option value="">Selecciona tu banco o billetera...</option>
                      {BANKS.map(bank => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                    <Building2 className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={20} />
                  </div>
                </div>
              )}

              {(selectedMethod === 'TRANSFER' || selectedMethod === 'CARD') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico para el recibo</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder-gray-500 cursor-pointer"
                  />
                </div>
              )}

              {selectedMethod === 'CASH' && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex gap-3 text-sm">
                  <Banknote className="shrink-0 mt-0.5" size={20} />
                  <p>Confirme en caja que ha recibido el dinero en efectivo (`${cost.toLocaleString()}`) antes de procesar la salida. El recibo se imprimirá automáticamente.</p>
                </div>
              )}

              {error && <p className="text-red-500 text-sm text-center font-semibold bg-red-50 p-2 rounded">{error}</p>}
            </div>

            <button
              type="submit"
              className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${selectedMethod === 'CASH' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30' :
                  selectedMethod === 'CARD' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30' :
                    'bg-[#FF004E] hover:bg-[#D90042] shadow-pink-500/30'
                }`}
            >
              {selectedMethod === 'CASH' ? <><CheckCircle size={20} /> Confirmar Recepción de Efectivo</> :
                selectedMethod === 'CARD' ? <><CreditCard size={20} /> Confirmar Transacción en Datáfono</> :
                  <><Landmark size={20} /> Procesar Transferencia</>}
            </button>

            {selectedMethod !== 'CASH' && (
              <div className="text-center mt-4 text-xs text-gray-400 flex items-center justify-center gap-1">
                <ShieldCheck size={14} /> Pagos procesados y registrados de forma segura
              </div>
            )}
          </form>
        )}

        {/* STEP 3: PROCESSING OVERLAY */}
        {step === 'PROCESSING' && (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
              <div className="bg-blue-50 p-4 rounded-full relative z-10">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Procesando Pago</h3>
            <p className="text-gray-500 text-sm">Por favor espera, registrando transacción en el sistema...</p>
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 'SUCCESS' && (
          <div className="p-12 flex flex-col items-center justify-center text-center bg-emerald-50 h-full">
            <div className="bg-white p-4 rounded-full shadow-lg mb-6 animate-bounce">
              <ShieldCheck className="w-12 h-12 text-emerald-500" />
            </div>
            <h3 className="text-3xl font-bold text-emerald-800 mb-2">¡Pago Confirmado!</h3>
            <p className="text-emerald-600 font-medium">La salida y el pago han sido registrados.</p>
            <p className="text-xs text-gray-400 mt-4">Generando recibo y redirigiendo...</p>
          </div>
        )}
      </div>
    </div>
  );
};