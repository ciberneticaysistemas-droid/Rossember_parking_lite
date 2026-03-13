import React, { useState, useEffect } from 'react';
import { Camera, Search, X, CheckCircle, AlertCircle, Clock, MapPin, CreditCard, Banknote, Smartphone, Receipt, Printer, ArrowRight } from 'lucide-react';
import { ParkingRecord, VehicleType } from '../types';
import { QRScannerCamera } from '../components/QRScannerCamera';
import { BoothPaymentModal } from '../components/BoothPaymentModal';
import { InvoiceTicket } from '../components/InvoiceTicket';

interface ExitViewProps {
  records: ParkingRecord[];
  onProcessExit: (recordId: string) => void;
  calculateCost: (entryTime: number, type: VehicleType, isDisabled?: boolean, requiresCharging?: boolean, plate?: string) => number;
  gracePeriod: number;
  onPayAtBooth: (recordId: string, cost: number, paymentMethod: string) => void;
  onRevertPayment?: (recordId: string) => void;
  rates: Record<string, number>;
  ivaEnabled: boolean;
  ivaRate: number;
  printerConfig?: { name: string; connected: boolean; autoprint?: boolean } | null;
}

export const ExitView: React.FC<ExitViewProps> = ({
  records,
  onProcessExit,
  calculateCost,
  gracePeriod,
  onPayAtBooth,
  onRevertPayment,
  rates,
  ivaEnabled,
  ivaRate,
  printerConfig
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [scanning, setScanning] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ParkingRecord | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Real-time clock Colombia
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-CO', {
        timeZone: 'America/Bogota',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }));
      setCurrentDate(now.toLocaleDateString('es-CO', {
        timeZone: 'America/Bogota',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: '2-digit',
      }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeRecords = records.filter(r => r.status === 'ACTIVE');

  const handleQRResult = (data: string) => {
    setScanning(false);
    setErrorMsg(null);
    try {
      const parsed = JSON.parse(data);
      if (parsed.v === 'POCHI-PARK-V1' && parsed.id) {
        const record = activeRecords.find(r => r.id === parsed.id);
        if (record) {
          setSelectedRecord(record);
        } else {
          // Check if it's already completed for security
          const completed = records.find(r => r.id === parsed.id && r.status === 'COMPLETED');
          if (completed) {
            setErrorMsg("🛑 ACCESO DENEGADO: Este tiquete YA FUE PROCESADO. El vehículo ya registró su salida.");
          } else {
            setErrorMsg("⚠️ El vehículo no se encuentra activo en el sistema.");
          }
        }
      } else {
        setErrorMsg("⚠️ Código QR no válido para este sistema.");
      }
    } catch (e) {
      // If it's not JSON, maybe it's just the plate?
      const record = activeRecords.find(r => r.plate.toUpperCase() === data.toUpperCase());
      if (record) {
        setSelectedRecord(record);
      } else {
        const completed = records.find(r => r.plate.toUpperCase() === data.toUpperCase() && r.status === 'COMPLETED');
        if (completed) {
          setErrorMsg("🛑 Este vehículo ya completó su estadía y salió del parqueadero.");
        } else {
          setErrorMsg("⚠️ Código QR desconocido o no válido.");
        }
      }
    }
  };

  const handleSearch = () => {
    setErrorMsg(null);
    const record = activeRecords.find(r => r.plate.toUpperCase() === searchValue.toUpperCase());
    if (record) {
      setSelectedRecord(record);
    } else {
      setErrorMsg("⚠️ No se encontró un vehículo activo con esa placa.");
    }
  };

  const currentCost = selectedRecord ? calculateCost(
    selectedRecord.entryTime,
    selectedRecord.vehicleType,
    selectedRecord.isDisabled,
    selectedRecord.requiresCharging,
    selectedRecord.plate
  ) : 0;

  const durationMs = selectedRecord ? Date.now() - selectedRecord.entryTime : 0;
  const minutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const durationStr = `${hours}h ${remainingMinutes}m`;

  const isGracePeriod = minutes <= gracePeriod;

  const handleProcessPayment = (recordId: string, finalCost: number, method: string, cashGiven?: number, change?: number) => {
    if (!selectedRecord) return;

    // Prepare Invoice Data for the Ticket
    const subtotal = ivaEnabled ? Math.round(finalCost / (1 + ivaRate / 100)) : finalCost;
    const ivaAmount = finalCost - subtotal;

    setInvoiceData({
      record: {
        id: selectedRecord.id,
        plate: selectedRecord.plate,
        ownerId: selectedRecord.ownerId,
        vehicleType: selectedRecord.vehicleType,
        entryTime: selectedRecord.entryTime,
        exitTime: Date.now(),
        vehicleState: selectedRecord.vehicleState,
        leavesHelmet: selectedRecord.leavesHelmet
      },
      cost: finalCost,
      subtotal,
      ivaAmount,
      ivaRate,
      paymentMethod: method,
      cashGiven,
      change
    });

    onPayAtBooth(recordId, finalCost, method);
    onProcessExit(recordId);
    setShowPaymentModal(false);
    setSelectedRecord(null);
    setSearchValue('');
  };

  return (
    <div className="min-h-screen bg-[#FFFBF7] pb-20">
      {/* QR Scanner MODAL */}
      {scanning && (
        <QRScannerCamera 
          onResult={handleQRResult}
          onClose={() => setScanning(false)}
        />
      )}

      {/* Payment MODAL */}
      {showPaymentModal && selectedRecord && (
        <BoothPaymentModal
          record={selectedRecord}
          cost={currentCost}
          duration={durationStr}
          onConfirm={handleProcessPayment}
          onClose={() => setShowPaymentModal(false)}
          ivaEnabled={ivaEnabled}
          ivaRate={ivaRate}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-gray-800 p-8 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-gray-800">Módulo de Salida</h1>
              <p className="text-orange-900/60 font-medium leading-tight">Escanee el tiquete QR para procesar el pago y la salida</p>
            </div>
            
            {/* Real-time clock Colombia */}
            <div className="hidden md:flex items-center gap-3 bg-white/20 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/10 text-gray-800">
              <Clock size={22} className="text-gray-800 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-orange-900/70 font-semibold leading-tight">Colombia · Hora Local</p>
                <p className="font-mono font-bold text-xl leading-tight">{currentTime}</p>
                <p className="text-xs text-orange-900/60 leading-tight capitalize">{currentDate}</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setScanning(true)}
            className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-3 transition-all shadow-lg active:scale-95 text-lg"
          >
            <Camera size={24} />
            ESCANEAR QR
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        {/* Search Bar - Fallback */}
        <div className="bg-white p-6 rounded-3xl shadow-premium border border-orange-100">
          <label className="block text-xs font-black text-orange-800 uppercase tracking-widest mb-3 opacity-70">O Búsqueda Manual por Placa</label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-300" size={20} />
              <input 
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="ABC123"
                className="w-full pl-12 pr-4 py-4 bg-[#FFF] border-2 border-orange-100 rounded-2xl focus:border-orange-500 outline-none font-bold text-xl tracking-widest text-gray-800 transition-all placeholder-orange-200"
              />
            </div>
            <button 
              onClick={handleSearch}
              className="bg-orange-600 text-white px-8 rounded-2xl font-bold hover:bg-orange-700 transition-colors shadow-md shadow-orange-200"
            >
              BUSCAR
            </button>
          </div>
          {errorMsg && (
            <div className="mt-4 flex items-center gap-2 text-red-500 font-bold text-sm bg-red-50 p-3 rounded-xl border border-red-100">
              <AlertCircle size={18} /> {errorMsg}
            </div>
          )}
        </div>

        {/* Selected Vehicle Info */}
        {selectedRecord ? (
          <div className="bg-white rounded-4xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in-up">
            <div className="bg-orange-600 p-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl">
                   <ArrowRight className="text-white" size={32} />
                </div>
                <div>
                  <p className="text-xs font-black text-white/70 uppercase tracking-widest">Vehículo Seleccionado</p>
                  <h2 className="text-4xl font-black tracking-widest font-mono">{selectedRecord.plate}</h2>
                </div>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="text-white/70 hover:text-white p-2">
                <X size={24} />
              </button>
            </div>

            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Details */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                    <span className="flex items-center gap-2 text-slate-500 font-bold text-sm"><Clock size={16} /> Duración</span>
                    <span className="text-slate-800 font-black text-lg">{durationStr}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                    <span className="text-slate-500 font-bold text-sm">Cédula Propietario</span>
                    <span className="text-slate-800 font-black text-lg">{selectedRecord.ownerId || 'N/A'}</span>
                  </div>
                </div>

                {/* Cost Panel */}
                <div className="bg-orange-500 rounded-3xl p-8 text-white flex flex-col justify-center items-center shadow-xl shadow-orange-200">
                  <p className="text-xs font-black text-white/70 uppercase tracking-widest mb-2">Total a Pagar</p>
                  <div className="text-5xl font-black mb-1">
                    ${currentCost.toLocaleString('es-CO')}
                  </div>
                  {isGracePeriod ? (
                    <div className="bg-white/20 text-white px-4 py-1.5 rounded-full text-xs font-black border border-white/30 flex items-center gap-2">
                      <CheckCircle size={14} /> TIEMPO DE GRACIA (SIN COSTO)
                    </div>
                  ) : (
                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Sujeto a cambios en caja</p>
                  )}
                </div>
              </div>

              {/* Action */}
              <button 
                onClick={() => isGracePeriod ? handleProcessPayment(selectedRecord.id, 0, 'GRACIA') : setShowPaymentModal(true)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 rounded-3xl text-2xl font-black flex items-center justify-center gap-4 transition-all shadow-xl shadow-orange-500/20 active:scale-95"
              >
                {isGracePeriod ? 'PROCESAR SALIDA (GRATIS)' : 'SIGUIENTE: COBRO EN CAJA'}
                <ArrowRight size={28} />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 opacity-60">
            <div className="bg-slate-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Camera size={48} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Esperando Escaneo</h3>
            <p className="text-slate-500 max-w-xs mx-auto text-sm">Utilice el botón de escaneo superior para detectar el tiquete QR del vehículo que desea retirar.</p>
          </div>
        )}
      </div>
    </div>
  );
};
