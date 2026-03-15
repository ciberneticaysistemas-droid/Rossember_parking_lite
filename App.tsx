import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { DeviceSelector } from './components/DeviceSelector';
import { EntryView } from './views/EntryView';
import { ExitView } from './views/ExitView';
import { AdminView } from './views/AdminView';
import { AdminLogin } from './views/AdminLogin';
import { HomeMenu } from './views/HomeMenu';
import { AccessView } from './views/AccessView';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ParkingRecord, VehicleType, Floor, SpecialRate, SpecialRateType, BannedVehicle, HardwareScannerConfig, DocumentConfig, KeyboardShortcutsConfig, DEFAULT_SHORTCUTS, LicenseConfig } from './types';
import { LockScreen } from './components/LockScreen';
import { DevConfigModal } from './components/DevConfigModal';
import { ShieldAlert, Key } from 'lucide-react';

// Default Capacity Configuration
const DEFAULT_CAPACITIES = {
  REGULAR_CAR: 10,
  PRIORITY_CAR: 5,
  MOTO: 5,
  EV_CHARGING: 5,
  BICYCLE: 10
};

const DEFAULT_PREFIXES = {
  REGULAR_CAR: 'C',
  PRIORITY_CAR: 'P',
  MOTO: 'M',
  EV_CHARGING: 'E',
  BICYCLE: 'B'
};

const DEFAULT_FLOORS: Floor[] = [
  {
    id: 'floor-1',
    name: 'Piso 1',
    capacities: DEFAULT_CAPACITIES,
    prefixes: DEFAULT_PREFIXES
  }
];

const DEFAULT_RATES = {
  [VehicleType.CAR]: 85,
  [VehicleType.MOTORCYCLE]: 55,
  [VehicleType.BICYCLE]: 30,
  [VehicleType.ELECTRIC]: 100,
  [VehicleType.UNKNOWN]: 85,
  'CAR_FULL': 35000,
  'MOTO_FULL': 18000,
  'BICYCLE_FULL': 8000,
  'EV_CHARGING_RATE': 120,
  'DISABILITY_DISCOUNT_PERCENT': 50,
  'GRACE_PERIOD_MINUTES': 15,
  'IVA_ENABLED': 0, // 0 = disabled, 1 = enabled
  'IVA_RATE': 19
};

// Admin credentials - leídas desde variables de entorno (.env)
// En GitHub Pages, configura estos valores como GitHub Secrets en el workflow de Actions
const ADMIN_CREDENTIALS = {
  username: import.meta.env.VITE_ADMIN_USERNAME || 'admin',
  password: import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'
};

const AppContent: React.FC = () => {
  const navigate = useNavigate();

  // Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('adminAuth') === 'true';
  });

  // Core State
  const [records, setRecords] = useState<ParkingRecord[]>(() => {
    const saved = localStorage.getItem('parkingRecords');
    return saved ? JSON.parse(saved) : [];
  });

  const [rates, setRates] = useState<Record<string, number>>(() => {
    const savedRates = localStorage.getItem('parkingRates');
    return savedRates ? JSON.parse(savedRates) : DEFAULT_RATES;
  });

  const [floors, setFloors] = useState<Floor[]>(() => {
    const savedFloors = localStorage.getItem('parkingFloors');
    if (savedFloors) return JSON.parse(savedFloors);

    const savedCapacities = localStorage.getItem('parkingCapacities');
    if (savedCapacities) {
      return [{
        id: 'floor-1',
        name: 'Piso 1',
        capacities: { ...DEFAULT_CAPACITIES, ...JSON.parse(savedCapacities) },
        prefixes: DEFAULT_PREFIXES
      }];
    }

    return DEFAULT_FLOORS;
  });

  const [specialRates, setSpecialRates] = useState<SpecialRate[]>(() => {
    const saved = localStorage.getItem('specialRates');
    return saved ? JSON.parse(saved) : [];
  });

  const [bannedVehicles, setBannedVehicles] = useState<BannedVehicle[]>(() => {
    const saved = localStorage.getItem('bannedVehicles');
    return saved ? JSON.parse(saved) : [];
  });


  // Client Customization State
  const [clientLogo, setClientLogo] = useState<string | null>(() => {
    return localStorage.getItem('clientLogo');
  });

  const [printerConfig, setPrinterConfig] = useState<any>(() => {
    const saved = localStorage.getItem('printerConfig');
    return saved ? JSON.parse(saved) : null;
  });

  const [hardwareScannerConfig, setHardwareScannerConfig] = useState<HardwareScannerConfig>(() => {
    const saved = localStorage.getItem('hardwareScannerConfig') || localStorage.getItem('qrReaderConfig');
    return saved ? JSON.parse(saved) : { enabled: false, prefix: '', suffix: 'Enter', captureGlobally: true };
  });

  const [documentConfig, setDocumentConfig] = useState<DocumentConfig>(() => {
    const saved = localStorage.getItem('documentConfig');
    return saved ? JSON.parse(saved) : {
      businessName: 'Rossember Parking',
      nit: '900.123.456-7',
      address: 'Calle Ficticia 123, Bogotá',
      phone: '300 123 4567',
      legalInfo: 'SISTEMA INTEGRAL DE GESTIÓN DE PARQUEADERO',
      ticketFooter: 'Conserve este tiquete. Se requiere para registrar la salida.',
      invoiceFooter: 'Gracias por su visita. Este documento es equivalente a factura.',
      showWatermark: true
    };
  });

  const [keyboardShortcuts, setKeyboardShortcuts] = useState<KeyboardShortcutsConfig>(() => {
    const saved = localStorage.getItem('keyboardShortcuts');
    return saved ? { ...DEFAULT_SHORTCUTS, ...JSON.parse(saved) } : DEFAULT_SHORTCUTS;
  });

  const [licenseConfig, setLicenseConfig] = useState<LicenseConfig>(() => {
    const saved = localStorage.getItem('licenseConfig');
    return saved ? JSON.parse(saved) : { isActive: false, expirationDate: null, unlockPassword: '12345' };
  });

  const [isLocked, setIsLocked] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);
  const [showDevPwdPrompt, setShowDevPwdPrompt] = useState(false);
  const [devPwd, setDevPwd] = useState('');

  // Derived Total Capacities
  const totalCapacities = floors.reduce((acc, floor) => {
    const floorCaps = floor.capacities as any;
    return {
      REGULAR_CAR: (acc.REGULAR_CAR === -1 || floorCaps.REGULAR_CAR === -1) ? -1 : acc.REGULAR_CAR + (floorCaps.REGULAR_CAR || 0),
      PRIORITY_CAR: (acc.PRIORITY_CAR === -1 || floorCaps.PRIORITY_CAR === -1) ? -1 : acc.PRIORITY_CAR + (floorCaps.PRIORITY_CAR || 0),
      MOTO: (acc.MOTO === -1 || floorCaps.MOTO === -1) ? -1 : acc.MOTO + (floorCaps.MOTO || 0),
      EV_CHARGING: (acc.EV_CHARGING === -1 || floorCaps.EV_CHARGING === -1) ? -1 : acc.EV_CHARGING + (floorCaps.EV_CHARGING || 0),
      BICYCLE: (acc.BICYCLE === -1 || floorCaps.BICYCLE === -1) ? -1 : acc.BICYCLE + (floorCaps.BICYCLE || 0)
    };
  }, { REGULAR_CAR: 0, PRIORITY_CAR: 0, MOTO: 0, EV_CHARGING: 0, BICYCLE: 0 });

  // Persist data
  useEffect(() => {
    localStorage.setItem('parkingRecords', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('parkingRates', JSON.stringify(rates));
  }, [rates]);

  useEffect(() => {
    localStorage.setItem('parkingFloors', JSON.stringify(floors));
  }, [floors]);


  useEffect(() => {
    localStorage.setItem('specialRates', JSON.stringify(specialRates));
  }, [specialRates]);

  useEffect(() => {
    localStorage.setItem('bannedVehicles', JSON.stringify(bannedVehicles));
  }, [bannedVehicles]);

  useEffect(() => {
    if (clientLogo) {
      localStorage.setItem('clientLogo', clientLogo);
    } else {
      localStorage.removeItem('clientLogo');
    }
  }, [clientLogo]);

  useEffect(() => {
    if (printerConfig) {
      localStorage.setItem('printerConfig', JSON.stringify(printerConfig));
    } else {
      localStorage.removeItem('printerConfig');
    }
  }, [printerConfig]);

  useEffect(() => {
    localStorage.setItem('hardwareScannerConfig', JSON.stringify(hardwareScannerConfig));
  }, [hardwareScannerConfig]);

  useEffect(() => {
    localStorage.setItem('documentConfig', JSON.stringify(documentConfig));
  }, [documentConfig]);

  useEffect(() => {
    localStorage.setItem('keyboardShortcuts', JSON.stringify(keyboardShortcuts));
  }, [keyboardShortcuts]);

  useEffect(() => {
    localStorage.setItem('licenseConfig', JSON.stringify(licenseConfig));
    // Check if we should be locked initially or whenever config changes
    if (licenseConfig.isActive && licenseConfig.expirationDate && Date.now() > licenseConfig.expirationDate) {
      // Look if someone already unlocked it in this session (temporary)
      const sessionUnlocked = sessionStorage.getItem('softwareUnlocked') === 'true';
      if (!sessionUnlocked) {
        setIsLocked(true);
      }
    } else {
      setIsLocked(false);
    }
  }, [licenseConfig]);

  // Periodic check for the "time bomb"
  useEffect(() => {
    if (!licenseConfig.isActive || !licenseConfig.expirationDate || isLocked) return;

    const interval = setInterval(() => {
      if (Date.now() > (licenseConfig.expirationDate || 0)) {
        setIsLocked(true);
        clearInterval(interval);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [licenseConfig, isLocked]);

  // Helper Functions
  const getAvailableSpot = (type: VehicleType, isPriority: boolean, requiresCharging: boolean = false): { spot: string, floorId: string } | null => {
    const activeRecords = records.filter(r => r.status === 'ACTIVE');
    const usedSpots = new Set(activeRecords.map(r => r.spotNumber));

    console.log(`[getAvailableSpot] Buscando para: ${type}, Prioridad: ${isPriority}, Carga: ${requiresCharging}`);
    console.log(`[getAvailableSpot] Puestos ocupados actualmente:`, Array.from(usedSpots));

    for (const floor of floors) {
      const isLegacyFloor = floor.id === 'floor-1';
      const prefixSuffix = isLegacyFloor ? '' : `${floor.name.replace(/\s/g, '')}-`;
      const floorPrefixes = floor.prefixes || DEFAULT_PREFIXES;
      const floorCaps = floor.capacities || DEFAULT_CAPACITIES;

      console.log(`[getAvailableSpot] Revisando ${floor.name} (${floor.id}). Prefijo: ${prefixSuffix}. Caps:`, floorCaps);

      if (requiresCharging) {
        if (floorCaps.EV_CHARGING === -1) return { spot: `AUTO-EV-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, floorId: floor.id };
        for (let i = 1; i <= floorCaps.EV_CHARGING; i++) {
          const spot = `${prefixSuffix}${floorPrefixes.EV_CHARGING}-${i.toString().padStart(3, '0')}`;
          if (!usedSpots.has(spot)) return { spot, floorId: floor.id };
        }
      } else if (type === VehicleType.BICYCLE) {
        const bicyCap = (floorCaps as any).BICYCLE ?? 0;
        if (bicyCap === -1) return { spot: `AUTO-B-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, floorId: floor.id };
        for (let i = 1; i <= bicyCap; i++) {
          const spot = `${prefixSuffix}${((floorPrefixes as any).BICYCLE || 'B')}-${i.toString().padStart(3, '0')}`;
          if (!usedSpots.has(spot)) return { spot, floorId: floor.id };
        }
      } else if (type === VehicleType.MOTORCYCLE) {
        if (floorCaps.MOTO === -1) return { spot: `AUTO-M-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, floorId: floor.id };
        for (let i = 1; i <= floorCaps.MOTO; i++) {
          const spot = `${prefixSuffix}${floorPrefixes.MOTO}-${i.toString().padStart(3, '0')}`;
          if (!usedSpots.has(spot)) return { spot, floorId: floor.id };
        }
      } else {
        if (isPriority) {
          if (floorCaps.PRIORITY_CAR === -1) return { spot: `AUTO-P-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, floorId: floor.id };
          for (let i = 1; i <= floorCaps.PRIORITY_CAR; i++) {
            const spot = `${prefixSuffix}${floorPrefixes.PRIORITY_CAR}-${i.toString().padStart(3, '0')}`;
            if (!usedSpots.has(spot)) return { spot, floorId: floor.id };
          }
        }

        if (floorCaps.REGULAR_CAR === -1) return { spot: `AUTO-C-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, floorId: floor.id };
        for (let i = 1; i <= floorCaps.REGULAR_CAR; i++) {
          const spot = `${prefixSuffix}${floorPrefixes.REGULAR_CAR}-${i.toString().padStart(3, '0')}`;
          if (!usedSpots.has(spot)) return { spot, floorId: floor.id };
        }
      }
    }
    console.warn(`[getAvailableSpot] NO SE ENCONTRÓ PUESTO DISPONIBLE`);
    return null;
  };

  const calculateCost = (entryTime: number, type: VehicleType, isDisabled?: boolean, requiresCharging?: boolean, plate?: string) => {
    const exitTime = Date.now();
    const minutes = Math.ceil((exitTime - entryTime) / 60000);

    let minuteRate = requiresCharging ? rates['EV_CHARGING_RATE'] : (rates[type] || rates[VehicleType.CAR]);
    const fullRateKey = type === VehicleType.MOTORCYCLE ? 'MOTO_FULL' : type === VehicleType.BICYCLE ? 'BICYCLE_FULL' : 'CAR_FULL';
    const fullRateCap = rates[fullRateKey] || 999999;

    const minutesInDay = 1440;
    const fullDays = Math.floor(minutes / minutesInDay);
    const remainingMinutes = minutes % minutesInDay;

    let calculatedCost = fullDays * fullRateCap;
    
    if (remainingMinutes > 0 || fullDays === 0) {
      // Valor proporcional del tiempo restante, mínimo el valor de 1 minuto si no hay días completos
      const proportionCost = Math.max(remainingMinutes * minuteRate, fullDays === 0 ? minuteRate : 0);
      calculatedCost += Math.min(proportionCost, fullRateCap);
    }

    let totalCost = calculatedCost;
    const originalCost = totalCost;

    if (isDisabled) {
      const discountPercent = rates['DISABILITY_DISCOUNT_PERCENT'] || 50;
      totalCost = Math.ceil(totalCost * (1 - discountPercent / 100));
    }

    // Apply special rates (overrides/stacks with disability)
    let specialRateLabel: string | undefined;
    const specialRate = plate ? specialRates.find(r => r.plate === plate && r.isActive) : null;

    if (specialRate) {
      const isExpired = specialRate.expirationDate && specialRate.expirationDate < Date.now();

      if (!isExpired) {
        if (specialRate.type === SpecialRateType.MONTHLY) {
          totalCost = 0;
          specialRateLabel = 'Mensualidad Activa';
        } else {
          const discountPercent = specialRate.value;
          totalCost = Math.ceil(totalCost * (1 - discountPercent / 100));
          specialRateLabel = `${specialRate.type}: ${discountPercent}%`;
        }
      } else {
        // Expired - record the label but don't apply the cost benefit? 
        // User said: "informar en el panel de entrada que no la tiene y que tiene que renovar, dado el caso de que la mensualidad expire se le cobrara normal"
        // So here we should probably NOT set specialRateLabel to 'Active' but maybe just return undefined for the label so it functions as normal.
        // Actually, returning it as undefined is safer for cost calculation.
      }
    }

    // IVA Calculation
    const ivaEnabled = rates['IVA_ENABLED'] === 1;
    const ivaRate = rates['IVA_RATE'] || 19;
    const ivaAmount = ivaEnabled ? Math.round(totalCost * ivaRate / 100) : 0;
    const finalTotal = totalCost + ivaAmount;

    return {
      subtotal: totalCost,
      iva: ivaAmount,
      cost: finalTotal,
      originalCost: (isDisabled || specialRate) ? originalCost : undefined,
      minutes,
      exitTime,
      specialRateLabel,
      specialRate: specialRate || undefined,
      ivaRate: ivaEnabled ? ivaRate : 0
    };
  };

  // Handlers
  const handleProcessEntry = (
    plate: string,
    vehicleType: VehicleType,
    ownerId: string,
    isAccessibility: boolean,
    requiresCharging: boolean = false,
    vehicleState?: 'BUENO' | 'REGULAR' | 'MALO',
    vehicleComment?: string,
    leavesHelmet?: boolean,
    helmetDescription?: string
  ): { record: ParkingRecord | null, error?: string } => {
    const existing = records.find(r => r.plate === plate && r.status === 'ACTIVE');
    if (existing) {
      return { record: null, error: `El vehículo con placa ${plate} ya se encuentra activo en el parqueadero.` };
    }

    const banned = bannedVehicles.find(v => v.plate.toUpperCase() === plate.toUpperCase());
    if (banned) {
      return { record: null, error: `ACCESO DENEGADO: Este vehículo está VETADO. Razón: ${banned.reason}` };
    }


    const assignment = getAvailableSpot(vehicleType, isAccessibility, requiresCharging);
    if (!assignment) {
      return { record: null, error: `No hay plazas disponibles para ${vehicleType}${requiresCharging ? ' con carga' : ''}.` };
    }

    const newRecord: ParkingRecord = {
      id: crypto.randomUUID(),
      plate: plate,
      ownerId: ownerId,
      vehicleType: vehicleType,
      floorId: assignment.floorId,
      entryTime: Date.now(),
      status: 'ACTIVE',
      isDisabled: isAccessibility,
      spotNumber: assignment.spot,
      requiresCharging: requiresCharging,
      vehicleState: vehicleState,
      vehicleComment: vehicleComment,
      leavesHelmet: leavesHelmet,
      helmetDescription: helmetDescription,
    };

    setRecords(prev => [newRecord, ...prev]);
    return { record: newRecord };
  };

  const handleCancelEntry = (recordId: string) => {
    setRecords(prev => prev.filter(r => r.id !== recordId));
  };

  const handleProcessPayment = (recordId: string, paymentMethod: string, email: string) => {
    setRecords(prev => prev.map(r => {
      if (r.id === recordId) {
        const { cost } = calculateCost(r.entryTime, r.vehicleType, r.isDisabled, r.requiresCharging);
        return {
          ...r,
          status: 'COMPLETED' as const,
          paymentStatus: 'PAID',
          paymentMethod: paymentMethod,
          cost: cost,
          exitTime: Date.now()
        };
      }
      return r;
    }));
  };

  // Pago en taquilla: registra costo, método de pago y marca como PAID
  const handlePayAtBooth = (recordId: string, cost: number, paymentMethod: string) => {
    setRecords(prev => prev.map(r => {
      if (r.id === recordId) {
        return {
          ...r,
          status: 'COMPLETED' as const,
          paymentStatus: 'PAID' as const,
          paymentMethod: paymentMethod,
          cost: cost,
          exitTime: Date.now()
        };
      }
      return r;
    }));
  };

  const handleRevertPayment = (recordId: string) => {
    setRecords(prev => prev.map(r => {
      if (r.id === recordId) {
        return {
          ...r,
          paymentStatus: 'PENDING',
          paymentMethod: undefined,
          exitTime: undefined
        };
      }
      return r;
    }));
  };

  const handleProcessExit = (recordId: string) => {
    setRecords(prev => prev.map(r => {
      if (r.id === recordId && r.status === 'ACTIVE') {
        return {
          ...r,
          exitTime: Date.now(),
          status: 'COMPLETED'
        };
      }
      return r;
    }));
  };

  const handleRateUpdate = (newRates: Record<string, number>) => {
    setRates(newRates);
  };

  const handleFloorsUpdate = (newFloors: Floor[]) => {
    setFloors(newFloors);
  };

  const handleCapacityUpdate = (newCapacities: any) => {
    setFloors(prev => prev.map((f, i) => i === 0 ? { ...f, capacities: { ...f.capacities, ...newCapacities } } : f));
  };

  const handleManualExit = (id: string) => {
    const record = records.find(r => r.id === id);
    if (record && record.status === 'ACTIVE') {
      const { cost, exitTime } = calculateCost(record.entryTime, record.vehicleType, record.isDisabled);
      setRecords(prev => prev.map(r => {
        if (r.id === id) {
          return {
            ...r,
            exitTime: exitTime,
            status: 'COMPLETED',
            cost: cost,
            paymentStatus: 'PAID',
            paymentMethod: 'Manual - Admin'
          };
        }
        return r;
      }));
    }
  };

  const handleAdminLogin = (username: string, password: string): boolean => {
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
      return true;
    }
    return false;
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('adminAuth');
    navigate('/');
  };

  const handleClientLogoUpdate = (logo: string | null) => {
    setClientLogo(logo);
  };

  const handleSpecialRatesUpdate = (newRates: SpecialRate[]) => {
    setSpecialRates(newRates);
  };

  const handlePurgeRecords = (type: 'all' | 'completed') => {
    if (type === 'all') {
      setRecords([]);
    } else {
      setRecords(prev => prev.filter(r => r.status === 'ACTIVE'));
    }
  };

  const handleDevLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (devPwd === "AlejandroJuanCristopher") {
      setShowDevPwdPrompt(false);
      setShowDevModal(true);
      setDevPwd('');
    } else {
      alert("Clave de desarrollador incorrecta");
      setDevPwd('');
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Time Lock Screen */}
      {isLocked && (
        <LockScreen 
          config={licenseConfig} 
          onUnlock={() => {
            setIsLocked(false);
            // Al desbloquear con la clave del cliente, desactivamos el bloqueo automático
            // para que no se vuelva a bloquear por la fecha vieja.
            setLicenseConfig(prev => ({ ...prev, isActive: false }));
            sessionStorage.setItem('softwareUnlocked', 'true');
          }} 
        />
      )}

      {/* Dev Password Prompt */}
      {showDevPwdPrompt && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <form onSubmit={handleDevLogin} className="bg-slate-900 border border-slate-700 p-8 rounded-[2rem] shadow-2xl w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="text-blue-400" size={32} />
            </div>
            <h3 className="text-white font-black uppercase tracking-widest mb-4">Acceso Desarrollador</h3>
            <input 
              type="password"
              placeholder="Ingrese Clave Maestra"
              value={devPwd}
              onChange={e => setDevPwd(e.target.value)}
              autoFocus
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white text-center mb-4 focus:border-blue-500 outline-none"
            />
            <div className="flex gap-2">
               <button type="button" onClick={() => setShowDevPwdPrompt(false)} className="flex-1 py-3 text-slate-400 font-bold">Cancelar</button>
               <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors">Entrar</button>
            </div>
          </form>
        </div>
      )}

      {/* Dev Config Modal */}
      {showDevModal && (
        <DevConfigModal 
          currentConfig={licenseConfig}
          onSave={setLicenseConfig}
          onClose={() => setShowDevModal(false)}
        />
      )}

      {/* Floating Dev Button (Near corner, subtle) */}
      <button 
        onClick={() => setShowDevPwdPrompt(true)}
        className="fixed bottom-4 right-4 w-8 h-8 bg-slate-800/20 hover:bg-slate-800/80 text-slate-500/50 hover:text-white rounded-lg flex items-center justify-center transition-all z-[90] backdrop-blur-sm border border-white/5"
        title="Configuración Desarrollador"
      >
        <ShieldAlert size={14} />
      </button>

      <Routes>
      {/* Menu Principal */}
      <Route path="/" element={<HomeMenu clientLogo={clientLogo} />} />

      <Route path="/acceso" element={
        <AccessView
          records={records}
          capacities={totalCapacities}
          onProcessEntry={handleProcessEntry}
          onBackToSelector={() => navigate('/')}
          onCancelEntry={handleCancelEntry}
          clientLogo={clientLogo}
          specialRates={specialRates}
          floors={floors}
          onProcessExit={handleProcessExit}
          calculateCost={calculateCost}
          gracePeriod={rates['GRACE_PERIOD_MINUTES'] || 15}
          onRevertPayment={handleRevertPayment}
          onPayAtBooth={handlePayAtBooth}
          rates={rates}
          printerConfig={printerConfig}
          hardwareScannerConfig={hardwareScannerConfig}
          ivaEnabled={rates['IVA_ENABLED'] === 1}
          ivaRate={rates['IVA_RATE'] || 19}
          documentConfig={documentConfig}
          keyboardShortcuts={keyboardShortcuts}
        />
      } />

      <Route path="/admin" element={
        isAdminAuthenticated ? (
          <Navigate to="/admin/dashboard" replace />
        ) : (
          <AdminLogin onLogin={handleAdminLogin} />
        )
      } />

      {/* Protected Admin Dashboard Route */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute isAuthenticated={isAdminAuthenticated}>
          <AdminView
            records={records}
            rates={rates}
            capacities={totalCapacities}
            floors={floors}
            onRateUpdate={handleRateUpdate}
            onCapacityUpdate={handleCapacityUpdate}
            onManualExit={handleManualExit}
            onBackToSelector={handleAdminLogout}
            clientLogo={clientLogo}
            onUpdateClientLogo={handleClientLogoUpdate}
            specialRates={specialRates}
            onSpecialRatesUpdate={handleSpecialRatesUpdate}
            printerConfig={printerConfig}
            onPrinterConfigUpdate={setPrinterConfig}
            bannedVehicles={bannedVehicles}
            onBannedVehiclesUpdate={setBannedVehicles}
            onPurgeRecords={handlePurgeRecords}
            hardwareScannerConfig={hardwareScannerConfig}
            onHardwareScannerConfigUpdate={setHardwareScannerConfig}
            documentConfig={documentConfig}
            onDocumentConfigUpdate={setDocumentConfig}
            keyboardShortcuts={keyboardShortcuts}
            onKeyboardShortcutsUpdate={setKeyboardShortcuts}
          />

        </ProtectedRoute>
      } />

      {/* Hidden Device Selector Route (for internal use) */}
      <Route path="/selector" element={
        <DeviceSelector
          onSelectDevice={(device) => {
            if (device === 'ENTRY') navigate('/entrada');
            else if (device === 'EXIT') navigate('/salida');
          }}
        />
      } />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    // HashRouter es necesario para GitHub Pages (rutas como /#/admin funcionan sin servidor)
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;