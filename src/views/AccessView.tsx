import React, { useState, useEffect } from 'react';
import { EntryView } from './EntryView';
import { ExitView } from './ExitView';
import { ParkingRecord, VehicleType, SpecialRate, Floor, DocumentConfig, KeyboardShortcutsConfig, DEFAULT_SHORTCUTS } from '../types';
import { ArrowLeft, LogIn, LogOut, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface AccessViewProps {
  records: ParkingRecord[];
  capacities: { REGULAR_CAR: number; PRIORITY_CAR: number; MOTO: number; EV_CHARGING: number; BICYCLE: number };
  onProcessEntry: (
    plate: string,
    vehicleType: VehicleType,
    ownerId: string,
    isAccessibility: boolean,
    requiresCharging?: boolean,
    vehicleState?: 'BUENO' | 'REGULAR' | 'MALO',
    vehicleComment?: string,
    leavesHelmet?: boolean,
    helmetDescription?: string
  ) => { record: ParkingRecord | null, error?: string };
  onBackToSelector: () => void;
  onCancelEntry: (recordId: string) => void;
  clientLogo: string | null;
  specialRates: SpecialRate[];
  floors: Floor[];
  onProcessExit: (plate: string) => void;
  calculateCost: (entryTime: number, type: VehicleType, isDisabled?: boolean, requiresCharging?: boolean, plate?: string) => { cost: number, originalCost?: number, minutes: number, exitTime: number, specialRateLabel?: string, specialRate?: SpecialRate };
  gracePeriod: number;
  onRevertPayment: (recordId: string) => void;
  onPayAtBooth: (recordId: string, cost: number, paymentMethod: string) => void;
  rates: Record<string, number>;
  printerConfig?: any; // Simplified for now
  hardwareScannerConfig: any;
  ivaEnabled: boolean;
  ivaRate: number;
  documentConfig?: DocumentConfig;
  keyboardShortcuts?: KeyboardShortcutsConfig;
}

export const AccessView: React.FC<AccessViewProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'ENTRY' | 'EXIT'>('ENTRY');
  const [externalScanData, setExternalScanData] = useState<string | null>(null);
  const navigate = useNavigate();

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
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Global Hardware Scanner Listener
  useEffect(() => {
    if (!props.hardwareScannerConfig?.enabled || !props.hardwareScannerConfig?.captureGlobally) return;

    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          // If we are strictly capturing globally, we might want to prevent default 
          // but that's risky if the user IS manually typing.
      }

      const currentTime = Date.now();
      
      if (currentTime - lastKeyTime > 200) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === props.hardwareScannerConfig.suffix || e.key === 'Enter') {
        if (buffer.length > 2) { 
          console.log('[Hardware Scanner] Scanned:', buffer);
          setExternalScanData(buffer);
          setActiveTab('EXIT'); 
          
          setTimeout(() => setExternalScanData(null), 100);
        }
        buffer = '';
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [props.hardwareScannerConfig, activeTab]);

  // Keyboard Shortcuts for Tabs
  const shortcuts = props.keyboardShortcuts || DEFAULT_SHORTCUTS;
  useKeyboardShortcuts({
    [shortcuts.switchToEntry]: () => setActiveTab('ENTRY'),
    [shortcuts.switchToExit]: () => setActiveTab('EXIT'),
  });

  return (
    <div className="min-h-screen bg-[#FFFBF7] flex flex-col font-sans">
      {/* Header unificado para Acceso */}
      <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-gray-800 shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => navigate('/')}
              className="p-3 hover:bg-white/20 rounded-xl transition-all group shrink-0 active:scale-95"
              title="Volver al Menú Principal"
            >
              <ArrowLeft className="text-gray-800 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="h-10 w-px bg-white/20 hidden md:block"></div>
            {props.clientLogo && (
              <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-md shadow-sm hidden sm:block">
                <img src={props.clientLogo} alt="Client Logo" className="h-10 object-contain max-w-[120px]" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-800 flex items-center gap-2">ParkingCore</h1>
              <p className="text-orange-100/90 text-[10px] sm:text-xs font-semibold uppercase tracking-widest hidden sm:block">Módulo de Acceso</p>
            </div>
          </div>

          {/* Clock Colombia - center */}
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-gray-800 hidden sm:flex">
            <Clock size={18} className="text-gray-800 shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold leading-tight text-orange-900/70">{currentDate}</p>
              <p className="font-mono font-bold text-base leading-tight">{currentTime}</p>
            </div>
          </div>

          <div className="flex bg-white/10 p-1 rounded-xl w-full sm:w-auto overflow-hidden">
            <button
              onClick={() => setActiveTab('ENTRY')}
              className={`flex-1 sm:px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all font-bold group relative ${activeTab === 'ENTRY' ? 'bg-white text-orange-600 shadow-md' : 'text-orange-50 hover:bg-white/10'}`}
            >
              <LogIn size={18} />
              <span>ENTRADA</span>
              <span className={`absolute -top-1 -right-1 text-[8px] px-1 rounded border ${activeTab === 'ENTRY' ? 'bg-orange-100 border-orange-200 text-orange-500' : 'bg-orange-800/40 border-orange-400 text-orange-200'} font-black`}>
                {shortcuts.switchToEntry}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('EXIT')}
              className={`flex-1 sm:px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all font-bold group relative ${activeTab === 'EXIT' ? 'bg-white text-orange-600 shadow-md' : 'text-orange-50 hover:bg-white/10'}`}
            >
              <LogOut size={18} />
              <span>SALIDA</span>
              <span className={`absolute -top-1 -right-1 text-[8px] px-1 rounded border ${activeTab === 'EXIT' ? 'bg-orange-100 border-orange-200 text-orange-500' : 'bg-orange-800/40 border-orange-400 text-orange-200'} font-black`}>
                {shortcuts.switchToExit}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Renderizamos el componente correspondiente */}
      <main className="flex-1 overflow-auto relative">
        {activeTab === 'ENTRY' ? (
          <div className="absolute inset-0 overflow-auto entry-wrapper">
             <EntryView
                 {...props}
                 onBackToSelector={() => navigate('/')}
                 documentConfig={props.documentConfig}
                 keyboardShortcuts={props.keyboardShortcuts}
             />
          </div>
        ) : (
          <div className="absolute inset-0 overflow-auto exit-wrapper">
             <ExitView
                records={props.records}
                onProcessExit={props.onProcessExit}
                calculateCost={(entryTime, type, isDisabled, requiresCharging, plate) => {
                  const res = props.calculateCost(entryTime, type, isDisabled, requiresCharging, plate);
                  return typeof res === 'number' ? res : res.cost;
                }}
                gracePeriod={props.gracePeriod}
                onPayAtBooth={props.onPayAtBooth}
                rates={props.rates}
                ivaEnabled={props.ivaEnabled}
                ivaRate={props.ivaRate}
                printerConfig={props.printerConfig}
                hardwareScannerConfig={props.hardwareScannerConfig}
                documentConfig={props.documentConfig}
                externalScanData={externalScanData}
                keyboardShortcuts={props.keyboardShortcuts}

             />
          </div>
        )}
      </main>

      {/* Para ocultar los headers internos de Entry/Exit, podemos usar un bloque style inyectado temporalmente */}
      <style>{`
        .entry-wrapper header { display: none !important; }
        .exit-wrapper header { display: none !important; }
        .entry-wrapper > div { min-h-[calc(100vh-80px)] !important; }
        .exit-wrapper > div { min-h-[calc(100vh-80px)] !important; }
      `}</style>
    </div>
  );
};
