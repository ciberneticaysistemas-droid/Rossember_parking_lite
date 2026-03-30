import React, { useState, useEffect } from 'react';
import { Camera, Search, X, CheckCircle, AlertCircle, Clock, MapPin, CreditCard, Banknote, Smartphone, Receipt, Printer, ArrowRight, HardHat } from 'lucide-react';
import { ParkingRecord, VehicleType, DocumentConfig, HardwareScannerConfig, KeyboardShortcutsConfig, DEFAULT_SHORTCUTS } from '../types';
import { QRScannerCamera } from '../components/QRScannerCamera';
import { BoothPaymentModal } from '../components/BoothPaymentModal';
import { InvoiceTicket } from '../components/InvoiceTicket';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

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
  externalScanData?: string | null;
  documentConfig?: DocumentConfig;
  hardwareScannerConfig?: HardwareScannerConfig;
  keyboardShortcuts?: KeyboardShortcutsConfig;
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
  printerConfig,
  externalScanData,
  documentConfig,
  hardwareScannerConfig,
  keyboardShortcuts
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [scanning, setScanning] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ParkingRecord | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Keyboard Shortcuts
  const shortcuts = keyboardShortcuts || DEFAULT_SHORTCUTS;
  useKeyboardShortcuts({
    [shortcuts.focusSearch]: () => searchInputRef.current?.focus(),
    [shortcuts.openScanner]: () => setScanning(true),
    [shortcuts.confirmPayment]: () => {
      if (selectedRecord && !showPaymentModal && !invoiceData) {
        setShowPaymentModal(true);
      }
    }
  });

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

  // Auto-focus on mount
  useEffect(() => {
    setTimeout(() => {
        searchInputRef.current?.focus();
    }, 300);
  }, []);

  // Handle External Scan (from physical hardware scanner)
  useEffect(() => {
    if (externalScanData) {
      handleQRResult(externalScanData);
    }
  }, [externalScanData]);

  const activeRecords = records.filter(r => r.status === 'ACTIVE');

  const handleQRResult = (rawData: string) => {
    setScanning(false);
    setErrorMsg(null);

    let data = rawData.trim();
    console.log('[Scanner] Raw Data:', data);

    // Heurística: corrige errores de traducción de teclado HID (español vs US)
    if (data.includes('Ñ') || data.includes('[') || data.includes(']') || data.includes("'")) {
      data = data.replace(/Ñ/g, ':').replace(/\[/g, '{').replace(/\]/g, '|').replace(/'/g, '-');
      console.log('[Scanner] Heuristic Fix applied:', data);
    }

    // ── 1. Formato barcode corto: PB1|{8 hex} ────────────────────────────────
    const barcodeMatch = data.match(/PB1[|\]]([a-f0-9]{8})/i);
    if (barcodeMatch) {
      const shortHex = barcodeMatch[1].toLowerCase();
      const found = activeRecords.find(r => r.id.replace(/-/g, '').startsWith(shortHex));
      if (found) {
        setSelectedRecord(found);
      } else {
        const completed = records.find(r => r.id.replace(/-/g, '').startsWith(shortHex) && r.status === 'COMPLETED');
        setErrorMsg(completed
          ? "🛑 ACCESO DENEGADO: Este tiquete YA FUE PROCESADO. El vehículo ya registró su salida."
          : "⚠️ Código de barras no reconocido o vehículo no activo."
        );
      }
      return;
    }

    // ── 2. Formato QR simplificado: PC1|UUID (o variantes PP1, PQ1) ──────────
    let recordId = '';
    const simplifiedMatch = data.match(/P[CPQ]1[|\]](.+)/i);
    if (simplifiedMatch) {
      recordId = simplifiedMatch[1].replace(/'/g, '-');
    } else {
      // ── 3. Fallback: JSON legacy (compatibilidad con tiquetes impresos antes) ─
      try {
        const idMatch = data.match(/"id":"([^"]+)"/) || data.match(/id":"([^"]+)"/) || data.match(/id:([^,}\s]+)/);
        if (idMatch) {
          recordId = idMatch[1].replace(/'/g, '-');
        } else if (data.includes('POCHI')) {
          const uuidFallback = data.match(/[a-f0-9]{8}[-'][a-f0-9]{4}[-'][a-f0-9]{4}[-'][a-f0-9]{4}[-'][a-f0-9]{12}/i);
          if (uuidFallback) recordId = uuidFallback[0].replace(/'/g, '-');
        } else {
          const parsed = JSON.parse(data);
          if ((parsed.v === 'POCHI-PARK-V1' || parsed.v === 'PC-PARK-V1') && parsed.id) {
            recordId = parsed.id;
          }
        }
      } catch {
        // ── 4. Último recurso: extraer cualquier UUID del string ──────────────
        const uuidMatch = data.match(/[a-f0-9]{8}[-'][a-f0-9]{4}[-'][a-f0-9]{4}[-'][a-f0-9]{4}[-'][a-f0-9]{12}/i);
        if (uuidMatch) recordId = uuidMatch[0].replace(/'/g, '-');
      }
    }

    if (recordId) {
      const record = activeRecords.find(r => r.id === recordId);
      if (record) {
        setSelectedRecord(record);
      } else {
        const completed = records.find(r => r.id === recordId && r.status === 'COMPLETED');
        setErrorMsg(completed
          ? "🛑 ACCESO DENEGADO: Este tiquete YA FUE PROCESADO. El vehículo ya registró su salida."
          : `⚠️ El vehículo con ID ${recordId.substring(0, 8)}... no se encuentra activo.`
        );
      }
    } else {
      // ── 5. Sin formato reconocido: intentar como placa ────────────────────
      const cleanPlate = data.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      const record = activeRecords.find(r => r.plate.toUpperCase() === cleanPlate);
      if (record) {
        setSelectedRecord(record);
      } else {
        setErrorMsg("⚠️ Código no reconocido o vehículo no encontrado.");
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
        leavesHelmet: selectedRecord.leavesHelmet,
        helmetLocation: selectedRecord.helmetLocation
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
    
    // Auto-focus search for next exit
    setTimeout(() => {
        searchInputRef.current?.focus();
    }, 500);
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

      {/* Invoice MODAL */}
      {invoiceData && (
        <InvoiceTicket
          record={invoiceData.record}
          cost={invoiceData.cost}
          subtotal={invoiceData.subtotal}
          ivaAmount={invoiceData.ivaAmount}
          ivaRate={invoiceData.ivaRate}
          paymentMethod={invoiceData.paymentMethod}
          cashGiven={invoiceData.cashGiven}
          change={invoiceData.change}
          onClose={() => setInvoiceData(null)}
          printerConfig={printerConfig}
          documentConfig={documentConfig}
          keyboardShortcuts={shortcuts}
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
            className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-3 transition-all shadow-lg active:scale-95 text-lg relative"
          >
            <Camera size={24} />
            {hardwareScannerConfig?.enabled ? 'LEER CÁMARA' : 'ESCANEAR QR'}
            <span className="absolute -top-1 -right-1 bg-gray-700 border border-gray-600 px-2 py-0.5 rounded text-[10px] text-white/70">
                {shortcuts.openScanner}
            </span>
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
                ref={searchInputRef}
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        handleSearch();
                        (e.target as HTMLInputElement).blur();
                    } else if (e.key === 'Escape') {
                        (e.target as HTMLInputElement).blur();
                    }
                }}
                placeholder="ABC123"
                className="w-full pl-12 pr-4 py-4 bg-[#FFF] border-2 border-orange-100 rounded-2xl focus:border-orange-500 outline-none font-bold text-xl tracking-widest text-gray-800 transition-all placeholder-orange-200"
              />
              <div className="absolute top-0 right-0 p-2">
                 <span className="text-[10px] px-2 py-0.5 rounded bg-orange-100 border border-orange-200 text-orange-600 font-black">
                     {shortcuts.focusSearch}
                 </span>
              </div>
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
                  {/* Helmet Info */}
                  <div className={`p-4 rounded-2xl border-2 transition-all ${selectedRecord.leavesHelmet ? 'bg-orange-50 border-orange-200 shadow-sm' : 'bg-slate-50 border-transparent opacity-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                        <HardHat size={16} className={selectedRecord.leavesHelmet ? 'text-orange-500' : 'text-slate-400'} /> 
                        Registro de Casco
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedRecord.leavesHelmet ? 'bg-orange-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500'}`}>
                        {selectedRecord.leavesHelmet ? 'SÍ TIENE CASCO' : 'SIN CASCO'}
                      </span>
                    </div>
                    {selectedRecord.leavesHelmet && (
                      <div className="space-y-4 pt-4 border-t border-orange-200/50">
                        <div className="bg-orange-600 p-5 rounded-2xl text-white shadow-xl shadow-orange-900/20 text-center animate-pulse border-2 border-white/20">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Entregar Casco del Lugar:</p>
                          <h4 className="text-4xl font-black italic tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis">
                            {selectedRecord.helmetLocation || 'SIN ASIGNAR'}
                          </h4>
                        </div>
                        {selectedRecord.helmetDescription && (
                          <div className="bg-orange-100/50 flex items-center gap-3 p-4 rounded-xl border border-orange-200">
                             <div className="bg-white p-2 rounded-lg shadow-sm">
                               <HardHat size={16} className="text-orange-600" />
                             </div>
                             <p className="text-xs text-orange-900 font-black italic leading-tight">
                               "{selectedRecord.helmetDescription}"
                             </p>
                          </div>
                        )}
                      </div>
                    )}
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
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 rounded-3xl text-2xl font-black flex items-center justify-center gap-4 transition-all shadow-xl shadow-orange-500/20 active:scale-95 relative group"
              >
                {isGracePeriod ? 'PROCESAR SALIDA (GRATIS)' : 'SIGUIENTE: COBRO EN CAJA'}
                <ArrowRight size={28} />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/20 border border-white/20 px-3 py-1 rounded-xl text-xs group-hover:scale-110 transition-transform">
                   {shortcuts.confirmPayment}
                </span>
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
