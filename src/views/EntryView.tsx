import React, { useState, useEffect } from 'react';
import { VehicleCard } from '../components/VehicleCard';
import { ParkingTicketQR } from '../components/ParkingTicketQR';

import { ParkingRecord, VehicleType, SpecialRate, SpecialRateType, Floor, DocumentConfig, KeyboardShortcutsConfig, DEFAULT_SHORTCUTS } from '../types';

import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { Car, Bike, LogIn, Activity, AlertCircle, User, Keyboard, Accessibility, Zap, MapPin, ArrowLeft, CheckCircle, ShieldAlert, Calendar, Clock, Star, MessageSquare, HardHat } from 'lucide-react';
import { PrinterConfig } from '../components/PrinterSettingsModal';


interface EntryViewProps {
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
        helmetDescription?: string,
        helmetLocation?: string
    ) => { record: ParkingRecord | null, error?: string };
    onBackToSelector: () => void;
    onCancelEntry: (recordId: string) => void;
    clientLogo?: string | null;
    specialRates: SpecialRate[];
    floors?: Floor[];
    printerConfig?: PrinterConfig | null;
    documentConfig?: DocumentConfig;
    keyboardShortcuts?: KeyboardShortcutsConfig;
}

export const EntryView: React.FC<EntryViewProps> = ({
    records,
    capacities,

    onProcessEntry,
    onBackToSelector,
    onCancelEntry,
    clientLogo,
    specialRates,
    floors,
    printerConfig,
    documentConfig,
    keyboardShortcuts
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [ownerIdInput, setOwnerIdInput] = useState('');
    const [isAccessibilityMode, setIsAccessibilityMode] = useState(false);
    const [requiresCharging, setRequiresCharging] = useState(false);
    const [manualPlate, setManualPlate] = useState('');
    const [manualType, setManualType] = useState<VehicleType>(VehicleType.CAR);
    const [isSpecialPlate, setIsSpecialPlate] = useState(false);

    // Vehicle state & helmet state
    const [vehicleState, setVehicleState] = useState<'BUENO' | 'REGULAR' | 'MALO'>('BUENO');
    const [vehicleComment, setVehicleComment] = useState('');
    const [leavesHelmet, setLeavesHelmet] = useState(false);
    const [helmetDescription, setHelmetDescription] = useState('');
    const [helmetLocation, setHelmetLocation] = useState('');

    // Next available helmet slot suggestion (Espacio 1, 2, 3...)
    const nextHelmetSlot = React.useMemo(() => {
        const activeHelmetLocations = records
            .filter(r => r.status === 'ACTIVE' && r.helmetLocation)
            .map(r => r.helmetLocation!);
        
        const spaces = activeHelmetLocations
            .map(loc => {
                const match = loc.match(/Espacio\s+(\d+)/i);
                return match ? parseInt(match[1]) : null;
            })
            .filter((n): n is number => n !== null);
        
        const maxSpace = spaces.length > 0 ? Math.max(...spaces) : 0;
        return `Espacio ${maxSpace + 1}`;
    }, [records]);

    useEffect(() => {
        if (leavesHelmet && !helmetLocation) {
            setHelmetLocation(nextHelmetSlot);
        } else if (!leavesHelmet) {
            setHelmetLocation('');
        }
    }, [leavesHelmet, nextHelmetSlot]);

    // Auto-detect vehicle type from plate pattern (Colombian format)
    useEffect(() => {
        const plate = manualPlate.toUpperCase();
        if (plate.length >= 6) {
            const isMotoPattern = /^[A-Z]{3}[0-9]{2}[A-Z]$/.test(plate);
            const isCarPattern = /^[A-Z]{3}[0-9]{3}$/.test(plate);
            
            if (isMotoPattern && manualType !== VehicleType.MOTORCYCLE) {
                setManualType(VehicleType.MOTORCYCLE);
            } else if (isCarPattern && manualType !== VehicleType.CAR) {
                setManualType(VehicleType.CAR);
            }
        }
    }, [manualPlate, manualType]);

    // Auto-focus on mount
    useEffect(() => {
        setTimeout(() => {
            plateInputRef.current?.focus();
        }, 300);
    }, []);



    // Real-time clock Colombia
    const [currentTime, setCurrentTime] = useState('');
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const colombiaTime = now.toLocaleString('es-CO', {
                timeZone: 'America/Bogota',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            });
            setCurrentTime(colombiaTime);
        };
        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, []);

    const plateInputRef = React.useRef<HTMLInputElement>(null);
    const helmetDescriptionRef = React.useRef<HTMLInputElement>(null);

    // Keyboard Shortcuts
    const shortcuts = keyboardShortcuts || DEFAULT_SHORTCUTS;
    useKeyboardShortcuts({
      [shortcuts.registerEntry]: () => handleManualSubmit(),
      [shortcuts.focusPlateInput]: () => plateInputRef.current?.focus(),
      [shortcuts.toggleCar]: () => setManualType(VehicleType.CAR),
      [shortcuts.toggleMoto]: () => setManualType(VehicleType.MOTORCYCLE),
      [shortcuts.toggleBike]: () => setManualType(VehicleType.BICYCLE),
      [shortcuts.toggleAccessibility]: () => setIsAccessibilityMode(prev => !prev),
      'Alt+H': () => {
        if (manualType === VehicleType.MOTORCYCLE) {
          setLeavesHelmet(true);
          setTimeout(() => helmetDescriptionRef.current?.focus(), 100);
        }
      },
    });

    // QR Ticket State
    const [showTicket, setShowTicket] = useState(false);
    const [ticketData, setTicketData] = useState<{
        recordId: string;
        plate: string;
        ownerId: string;
        vehicleType: VehicleType;
        entryTime: number;
        helmetLocation?: string;
    } | null>(null);

    // Real-time special rate banner while typing plate
    const plateSpecialRateInfo = React.useMemo(() => {
        const plate = manualPlate.trim().toUpperCase();
        if (plate.length < 5) return null;
        const rate = specialRates.find(r => r.plate === plate && r.isActive);
        if (!rate) return null;
        const isExpired = rate.expirationDate && rate.expirationDate < Date.now();
        return { rate, isExpired: !!isExpired };
    }, [manualPlate, specialRates]);

    // Feedback State
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [lastProcessed, setLastProcessed] = useState<{
        plate: string;
        ownerId: string;
        vehicleType: VehicleType;
        img: string;
        timestamp: number;
        isDisabled?: boolean;
        spotNumber?: string;
        floorName?: string;
        requiresCharging?: boolean;
        recordId?: string;
        specialRate?: SpecialRate;
        vehicleState?: 'BUENO' | 'REGULAR' | 'MALO';
        leavesHelmet?: boolean;
        helmetLocation?: string;
    } | null>(null);

    const activeRecords = records.filter(r => r.status === 'ACTIVE');
    const activeBikes = activeRecords.filter(r => r.vehicleType === VehicleType.BICYCLE).length;

    // Capacity checks
    const isIndefinite = capacities.REGULAR_CAR === -1 || capacities.MOTO === -1 || capacities.BICYCLE === -1;
    let totalCap = 0;
    if (floors && floors.length > 0) {
        totalCap = floors.reduce((acc, floor) => {
            const fc = floor.capacities as any;
            return acc + 
                (fc.REGULAR_CAR === -1 ? 0 : (fc.REGULAR_CAR || 0)) +
                (fc.PRIORITY_CAR === -1 ? 0 : (fc.PRIORITY_CAR || 0)) +
                (fc.MOTO === -1 ? 0 : (fc.MOTO || 0)) +
                (fc.EV_CHARGING === -1 ? 0 : (fc.EV_CHARGING || 0)) +
                (fc.BICYCLE === -1 ? 0 : (fc.BICYCLE || 0));
        }, 0);
    } else {
        totalCap = 
            (capacities.REGULAR_CAR === -1 ? 0 : capacities.REGULAR_CAR) + 
            (capacities.PRIORITY_CAR === -1 ? 0 : capacities.PRIORITY_CAR) + 
            (capacities.MOTO === -1 ? 0 : capacities.MOTO) + 
            (capacities.EV_CHARGING === -1 ? 0 : capacities.EV_CHARGING) + 
            (capacities.BICYCLE === -1 ? 0 : capacities.BICYCLE);
    }

    const handleManualSubmit = () => {
        setErrorMsg(null);
        setLastProcessed(null);

        if (!manualPlate.trim()) {
            setErrorMsg("⚠️ Por favor escribe la placa.");
            return;
        }


        // Validate Plate
        const validatePlate = (plate: string, type: VehicleType): boolean => {
            if (isSpecialPlate) return true;
            if (type === VehicleType.CAR || type === VehicleType.ELECTRIC) {
                return /^[A-Z]{3}[0-9]{3}$/.test(plate);
            }
            if (type === VehicleType.MOTORCYCLE) {
                return /^[A-Z]{3}[0-9]{2}[A-Z]$/.test(plate);
            }
            if (type === VehicleType.BICYCLE) {
                return true; // Bicis pueden tener código alfanumérico libre
            }
            return true;
        };

        if (!validatePlate(manualPlate, manualType) && !isSpecialPlate) {
            setErrorMsg("⚠️ Placa no válida. Formato incorrecto.");

            return;
        }

        setIsProcessing(true);
        setTimeout(() => {
            const finalType = (requiresCharging && manualType === VehicleType.CAR) ? VehicleType.ELECTRIC : manualType;

            if (manualType === VehicleType.MOTORCYCLE && false /* leavesHelmet disable */) {
                // ...
            }

            const specialRate = specialRates.find(r => r.plate === manualPlate.toUpperCase() && r.isActive);
            const { record: resultRecord, error: processError } = onProcessEntry(
                manualPlate.toUpperCase(),
                finalType,
                ownerIdInput.trim(),
                isAccessibilityMode,
                requiresCharging,
                vehicleState,
                vehicleComment.trim(),
                manualType === VehicleType.MOTORCYCLE ? leavesHelmet : false,
                manualType === VehicleType.MOTORCYCLE ? helmetDescription.trim() : '',
                manualType === VehicleType.MOTORCYCLE ? helmetLocation.trim() : ''
            );

            if (resultRecord) {
                if (specialRate) {
                    const isExpired = specialRate.expirationDate && specialRate.expirationDate < Date.now();
                    if (isExpired) {
                        setErrorMsg(`⚠️ La mensualidad para la placa ${manualPlate.toUpperCase()} ha VENCIDO. Se le cobrará tarifa normal.`);
                    }
                }

                setLastProcessed({
                    plate: manualPlate.toUpperCase(),
                    ownerId: ownerIdInput.trim(),
                    vehicleType: finalType,
                    img: '',
                    timestamp: Date.now(),
                    isDisabled: isAccessibilityMode,
                    requiresCharging: requiresCharging,
                    recordId: resultRecord.id,
                    specialRate: specialRate || undefined,
                    vehicleState: vehicleState,
                    leavesHelmet: manualType === VehicleType.MOTORCYCLE ? leavesHelmet : undefined,
                    helmetLocation: manualType === VehicleType.MOTORCYCLE ? helmetLocation : undefined
                });

                // Show QR ticket
                setTicketData({
                    recordId: resultRecord.id,
                    plate: manualPlate.toUpperCase(),
                    ownerId: ownerIdInput.trim(),
                    vehicleType: finalType,
                    entryTime: resultRecord.entryTime,
                    helmetLocation: manualType === VehicleType.MOTORCYCLE ? helmetLocation.trim() : ''
                });
                setShowTicket(true);

                // Reset
                setManualPlate('');
                setOwnerIdInput('');
                setIsAccessibilityMode(false);
                setRequiresCharging(false);
                setVehicleState('BUENO');
                setVehicleComment('');
                setLeavesHelmet(false);
                setHelmetDescription('');
                setHelmetLocation('');
                
                // Auto-focus plate for next entry
                setTimeout(() => {
                    plateInputRef.current?.focus();
                }, 500);
            } else {
                setErrorMsg(processError || "⚠️ No hay plazas disponibles o el vehículo ya está registrado.");

            }
            setIsProcessing(false);
        }, 500);
    };

    const vehicleTypeOptions: { type: VehicleType; label: string; icon: React.ReactNode; color: string }[] = [
        { type: VehicleType.CAR, label: 'Carro', icon: <Car size={28} />, color: 'orange' },
        { type: VehicleType.MOTORCYCLE, label: 'Moto', icon: <Bike size={28} />, color: 'orange' },
        { type: VehicleType.BICYCLE, label: 'Bicicleta', icon: <Bike size={28} />, color: 'orange' },
    ];

    const stateColors = {
        BUENO: { active: 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200', inactive: 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300 hover:bg-emerald-50' },
        REGULAR: { active: 'bg-yellow-500 border-yellow-500 text-white shadow-md shadow-yellow-200', inactive: 'bg-white border-gray-200 text-gray-600 hover:border-yellow-300 hover:bg-yellow-50' },
        MALO: { active: 'bg-red-600 border-red-600 text-white shadow-md shadow-red-200', inactive: 'bg-white border-gray-200 text-gray-600 hover:border-red-300 hover:bg-red-50' },
    };

    return (
        <div className="min-h-screen bg-[#FFFBF7] pb-8">
            {/* QR Ticket Modal */}
            {showTicket && ticketData && (
                <ParkingTicketQR
                    recordId={ticketData.recordId}
                    plate={ticketData.plate}
                    ownerId={ticketData.ownerId}
                    vehicleType={ticketData.vehicleType}
                    entryTime={ticketData.entryTime}
                    helmetLocation={ticketData.helmetLocation}
                    onClose={() => setShowTicket(false)}
                    printerConfig={printerConfig}
                    documentConfig={documentConfig}
                    keyboardShortcuts={shortcuts}
                    spotNumber=""  /* Not used anymore */
                />

            )}

            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-gray-800 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className={`flex items-center justify-center transition-all ${clientLogo ? 'bg-white/10 p-1 rounded-lg backdrop-blur-md border border-white/20 shadow-lg' : 'bg-white/20 p-3 rounded-xl'}`}>
                                    {clientLogo ? (
                                        <img src={clientLogo} alt="Logo" className="h-14 w-auto object-contain filter drop-shadow-sm" />
                                    ) : (
                                        <LogIn className="w-8 h-8" />
                                    )}
                                </div>
                                <button
                                    onClick={onBackToSelector}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors group"
                                    title="Volver"
                                >
                                    <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                                </button>
                            </div>
                            <div className="h-10 w-px bg-white/20 hidden md:block"></div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-800">Estación de Entrada</h1>
                                <p className="text-orange-900/60 text-sm font-medium opacity-90">Registro de vehículos · Factura QR automática</p>
                            </div>
                        </div>
                            <div className="bg-white/20 backdrop-blur-sm px-4 py-3 rounded-xl flex items-center gap-2 min-w-[130px] text-gray-800">
                                <Clock size={18} className="shrink-0 text-gray-800" />
                                <div>
                                    <p className="text-[10px] opacity-80 uppercase tracking-widest font-semibold leading-tight text-orange-900/70">Colombia</p>
                                    <p className="text-base font-bold leading-tight font-mono">{currentTime}</p>
                                </div>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl text-gray-800">
                                <div className="flex items-center gap-2 mb-1">
                                    <Activity size={18} className="text-gray-800" />
                                    <span className="text-sm font-semibold">Ocupación Actual</span>
                                </div>
                                <p className="text-3xl font-bold">
                                    {activeRecords.length} / {isIndefinite ? '∞' : totalCap}
                                </p>
                            </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                <div className="grid lg:grid-cols-12 gap-8">

                    {/* Left: Entry Form */}
                    <section className="lg:col-span-7 space-y-6">
                        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-premium border border-blue-100">

                            {/* Owner ID Input - OBLIGATORIO */}
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Número de Cédula del Propietario
                                    <span className="ml-2 text-xs font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
                                        Opcional
                                    </span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User size={20} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={ownerIdInput}
                                        onChange={(e) => setOwnerIdInput(e.target.value)}
                                        placeholder="Ingrese el número de cédula"
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none text-lg transition-all text-gray-900 placeholder-gray-400 cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Toggles Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {/* Accessibility Toggle */}
                                <button
                                    onClick={() => setIsAccessibilityMode(!isAccessibilityMode)}
                                    className={`flex items-center justify-center gap-2 px-4 py-4 rounded-xl text-sm font-bold transition-all border-2 relative ${isAccessibilityMode
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <Accessibility size={20} />
                                    {isAccessibilityMode ? 'Prioridad ACTIVA' : 'Prioridad'}
                                    <span className={`absolute -top-1 -right-1 text-[8px] px-1 rounded border ${isAccessibilityMode ? 'bg-blue-100 border-blue-200 text-blue-500' : 'bg-gray-100 border-gray-200 text-gray-400'} font-black uppercase`}>
                                        {shortcuts.toggleAccessibility}
                                    </span>
                                </button>

                                {/* EV Charging Toggle */}
                                <button
                                    onClick={() => setRequiresCharging(!requiresCharging)}
                                    className={`flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-xl text-sm font-bold transition-all border-2 ${requiresCharging
                                        ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-200'
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Zap size={20} />
                                        <span>{requiresCharging ? 'Carga EV ACTIVA' : 'Puesto de carga'}</span>
                                    </div>
                                    <span className="text-[10px] opacity-80 font-normal leading-tight">(Reserva con empresa autorizada)</span>
                                </button>
                            </div>

                            {/* Manual Input Form */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border-2 border-dashed border-blue-300 flex flex-col justify-center gap-6">
                                <div className="text-center mb-2">
                                    <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                                        <Keyboard size={32} className="text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800">Registro de Placa</h3>
                                    <p className="text-sm text-gray-500">Ingrese la placa del vehículo manualmente</p>
                                </div>

                                {/* Vehicle Type Selector - 3 options */}
                                <div className="grid grid-cols-3 gap-3">
                                    {vehicleTypeOptions.map(opt => (
                                        <button
                                            key={opt.type}
                                            type="button"
                                            onClick={() => setManualType(opt.type)}
                                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all relative ${manualType === opt.type
                                                ? `bg-${opt.color}-600 border-${opt.color}-600 text-white shadow-lg`
                                                : `bg-white border-gray-300 text-gray-600 hover:border-${opt.color}-300`
                                                }`}
                                            style={manualType === opt.type ? {
                                                backgroundColor: opt.color === 'green' ? '#16a34a' : opt.color === 'orange' ? '#ea580c' : '#2563eb',
                                                borderColor: opt.color === 'green' ? '#16a34a' : opt.color === 'orange' ? '#ea580c' : '#2563eb',
                                                color: 'white'
                                            } : {}}
                                        >
                                            {opt.icon}
                                            <span className="text-sm font-bold mt-1">{opt.label}</span>
                                            <span className={`absolute -top-1 -right-1 text-[8px] px-1 rounded border ${manualType === opt.type ? 'bg-orange-100 border-orange-200 text-orange-500' : 'bg-gray-100 border-gray-200 text-gray-400'} font-black uppercase whitespace-nowrap`}>
                                                {opt.type === VehicleType.CAR ? shortcuts.toggleCar : opt.type === VehicleType.MOTORCYCLE ? shortcuts.toggleMoto : shortcuts.toggleBike}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                <div className="relative">
                                    <label className="block text-sm font-bold text-gray-700 uppercase mb-2 ml-1">Número de Placa / Código</label>
                                    <input
                                        ref={plateInputRef}
                                        type="text"
                                        value={manualPlate}
                                        onChange={(e) => setManualPlate(e.target.value.toUpperCase())}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleManualSubmit();
                                                (e.target as HTMLInputElement).blur();
                                            } else if (e.key === 'Escape') {
                                                (e.target as HTMLInputElement).blur();
                                            }
                                        }}
                                        placeholder={manualType === VehicleType.BICYCLE ? 'BICI-001 o libre' : 'AAA123'}
                                        maxLength={10}
                                        className="w-full text-center text-4xl font-mono font-bold uppercase py-5 bg-white border-2 border-blue-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder-gray-300 cursor-pointer"
                                    />
                                    <div className="absolute top-0 right-0 p-2">
                                         <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 border border-blue-200 text-blue-600 font-black">
                                             {shortcuts.focusPlateInput}
                                         </span>
                                    </div>
                                </div>



                                <div className="flex justify-center">
                                    <button
                                        onClick={() => setIsSpecialPlate(!isSpecialPlate)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border ${isSpecialPlate
                                            ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                            : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                                            }`}
                                    >
                                        <ShieldAlert size={16} />
                                        {isSpecialPlate ? 'Excepción Activada' : 'Placa Especial / Excepción'}
                                    </button>
                                </div>

                                {/* Vehicle State Section */}
                                <div className="space-y-4 pt-4 border-t border-blue-200">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
                                            <Activity size={18} className="text-blue-500" />
                                            Estado del Vehículo
                                        </label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {(['BUENO', 'REGULAR', 'MALO'] as const).map((state) => (
                                                <button
                                                    key={state}
                                                    type="button"
                                                    onClick={() => setVehicleState(state)}
                                                    className={`py-3 px-4 rounded-xl font-bold border-2 transition-all ${
                                                        vehicleState === state ? stateColors[state].active : stateColors[state].inactive
                                                    }`}
                                                >
                                                    {state}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 uppercase mb-2 flex items-center gap-2">
                                            <MessageSquare size={18} className="text-blue-500" />
                                            Observaciones (Opcional)
                                        </label>
                                        <input
                                            type="text"
                                            value={vehicleComment}
                                            onChange={(e) => setVehicleComment(e.target.value)}
                                            onKeyDown={(e) => (e.key === 'Escape' || e.key === 'Enter') && (e.target as HTMLInputElement).blur()}
                                            placeholder="Ej: Rayón en puerta derecha"
                                            className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-gray-800"
                                        />
                                    </div>

                                    {manualType === VehicleType.MOTORCYCLE && (
                                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-orange-600 p-2 rounded-lg">
                                                      <HardHat size={20} className="text-white" />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-800">¿Deja Casco?</span>
                                                        <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded border bg-orange-100 border-orange-200 text-orange-600 font-black">Alt+H</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setLeavesHelmet(!leavesHelmet)}
                                                    className={`w-14 h-8 rounded-full relative transition-all ${leavesHelmet ? 'bg-orange-600' : 'bg-gray-300'}`}
                                                >
                                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${leavesHelmet ? 'left-7' : 'left-1'}`}></div>
                                                </button>
                                            </div>
                                            {leavesHelmet && (
                                                <>
                                                    <input
                                                        ref={helmetDescriptionRef}
                                                        type="text"
                                                        value={helmetDescription}
                                                        onChange={(e) => setHelmetDescription(e.target.value)}
                                                        onKeyDown={(e) => (e.key === 'Escape' || e.key === 'Enter') && (e.target as HTMLInputElement).blur()}
                                                        placeholder="Descripción del casco (color, marca...)"
                                                        className="w-full px-4 py-3 bg-white border-2 border-orange-200 rounded-xl focus:border-orange-500 outline-none transition-all text-gray-800"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={helmetLocation}
                                                        onChange={(e) => setHelmetLocation(e.target.value)}
                                                        onKeyDown={(e) => (e.key === 'Escape' || e.key === 'Enter') && (e.target as HTMLInputElement).blur()}
                                                        placeholder="Ej: Espacio 1 (Lugar o Número)"
                                                        className="w-full px-4 py-3 bg-white border-2 border-orange-200 rounded-xl focus:border-orange-500 outline-none transition-all text-gray-800 font-bold"
                                                    />
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Real-time special rate banner */}
                                {plateSpecialRateInfo && (
                                    <div className={`rounded-xl p-3 flex items-start gap-3 border-2 ${
                                        plateSpecialRateInfo.isExpired
                                            ? 'bg-red-50 border-red-300 text-red-700'
                                            : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                    }`}>
                                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                        <div>
                                            {plateSpecialRateInfo.isExpired ? (
                                                <>
                                                    <p className="font-bold text-sm">⚠️ Mensualidad VENCIDA</p>
                                                    <p className="text-xs opacity-80">
                                                        Venció el {new Date(plateSpecialRateInfo.rate.expirationDate!).toLocaleDateString('es-CO')}. Se cobrará tarifa normal.
                                                    </p>
                                                </>
                                            ) : plateSpecialRateInfo.rate.type === 'Mensualidad' ? (
                                                <>
                                                    <p className="font-bold text-sm">✅ Mensualidad Activa</p>
                                                    <p className="text-xs opacity-80">
                                                        ${plateSpecialRateInfo.rate.value.toLocaleString()} · {plateSpecialRateInfo.rate.description || 'Sin descripción'}
                                                        {plateSpecialRateInfo.rate.expirationDate && (
                                                            <> · Vence: {new Date(plateSpecialRateInfo.rate.expirationDate).toLocaleDateString('es-CO')}</>
                                                        )}
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="font-bold text-sm">✅ Tarifa Especial: {plateSpecialRateInfo.rate.type}</p>
                                                    <p className="text-xs opacity-80">Descuento: {plateSpecialRateInfo.rate.value}%</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleManualSubmit}
                                    disabled={isProcessing}
                                    className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all shadow-lg active:scale-95 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 shadow-orange-500/20 relative group"
                                >
                                    {isProcessing ? 'Procesando...' : '✅ Registrar Ingreso'}
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 px-2 py-1 rounded text-xs border border-white/20 group-hover:scale-110 transition-transform">
                                        {shortcuts.registerEntry}
                                    </span>
                                </button>
                            </div>

                            {/* Error Message */}
                            {errorMsg && (
                                <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-2xl p-5 flex items-start gap-3 text-red-700 shadow-md">
                                    <AlertCircle size={24} className="mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-bold text-base">Error de Proceso</p>
                                        <p className="text-sm opacity-90">{errorMsg}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Right: Success Feedback */}
                    <section className="lg:col-span-5 flex flex-col gap-6">
                        {/* Success Feedback */}
                        {lastProcessed && !errorMsg && (
                            <div className="rounded-2xl p-6 border-2 shadow-lg animate-fade-in-up bg-orange-50 border-orange-200 sticky top-8">
                                <div className="flex flex-col gap-4">
                                    <div className="w-full h-24 rounded-xl bg-orange-100 shrink-0 border-2 border-orange-300 shadow-md flex items-center justify-center">
                                        <div className="text-orange-400">
                                            {lastProcessed.vehicleType === VehicleType.CAR || lastProcessed.vehicleType === VehicleType.ELECTRIC
                                                ? <Car size={48} />
                                                : <Bike size={48} />}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold uppercase tracking-wider mb-2 text-orange-600 flex items-center gap-2">
                                            <CheckCircle size={18} /> Entrada Registrada Exitosamente
                                        </p>
                                        <h3 className="text-5xl font-black text-gray-900 tracking-tight mb-4">{lastProcessed.plate}</h3>

                                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700 mb-6">
                                            <span className="bg-white px-3 py-1 rounded-lg border border-orange-200 font-semibold">
                                                {lastProcessed.vehicleType}
                                            </span>
                                            {lastProcessed.ownerId && (
                                                <span className="bg-white px-3 py-1 rounded-lg border border-orange-200 flex items-center gap-1">
                                                    <User size={12} /> C.C. {lastProcessed.ownerId}
                                                </span>
                                            )}

                                            {lastProcessed.specialRate && (
                                                <div className="w-full mt-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-col gap-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{lastProcessed.specialRate.type}</span>
                                                        <span className="text-xs font-bold text-indigo-700">
                                                            {lastProcessed.specialRate.type === SpecialRateType.MONTHLY
                                                                ? `$${lastProcessed.specialRate.value.toLocaleString()}`
                                                                : `-${lastProcessed.specialRate.value}%`}
                                                        </span>
                                                    </div>
                                                    {lastProcessed.specialRate.expirationDate && (
                                                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                                            <Calendar size={12} className="text-indigo-400" />
                                                            Vence: {new Date(lastProcessed.specialRate.expirationDate).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {lastProcessed.vehicleState && (
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                                    lastProcessed.vehicleState === 'BUENO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                    lastProcessed.vehicleState === 'REGULAR' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                    'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                    Estado: {lastProcessed.vehicleState}
                                                </span>
                                            )}
                                            {lastProcessed.leavesHelmet && (
                                                <div className="flex flex-col gap-1 w-full">
                                                    <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200 flex items-center gap-1 w-fit">
                                                        <HardHat size={12} /> CON CASCO
                                                    </span>
                                                    {lastProcessed.helmetLocation && (
                                                        <span className="text-orange-900 font-black text-sm bg-orange-200/50 px-3 py-1 rounded-xl border border-orange-300 w-fit">
                                                            📍 UBICACIÓN: {lastProcessed.helmetLocation}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className={`p-5 rounded-2xl flex items-center gap-4 ${lastProcessed.requiresCharging
                                            ? 'bg-green-600 text-white shadow-lg shadow-green-200'
                                            : lastProcessed.vehicleType === VehicleType.MOTORCYCLE
                                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                                                : lastProcessed.vehicleType === VehicleType.BICYCLE
                                                    ? 'bg-green-500 text-white shadow-lg shadow-green-200'
                                                    : 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                            }`}>
                                            <CheckCircle size={32} className="shrink-0" />
                                            <div className="leading-tight">
                                                <p className="text-xs opacity-80 uppercase tracking-widest font-semibold mb-1">Registro Exitoso</p>
                                                <p className="font-bold text-xl leading-tight">
                                                    Vehículo en Parqueadero
                                                </p>
                                            </div>
                                        </div>

                                        {/* Re-show ticket button */}
                                        {ticketData && (
                                            <button
                                                onClick={() => setShowTicket(true)}
                                                className="mt-3 w-full py-2 bg-orange-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors"
                                            >
                                                🖨️ Ver / Reimprimir Tiquete QR
                                            </button>
                                        )}

                                        {/* Cancel Registration Button */}
                                        <button
                                            onClick={() => {
                                                if (lastProcessed.recordId) {
                                                    onCancelEntry(lastProcessed.recordId);
                                                    setManualPlate(lastProcessed.plate);
                                                    setManualType(lastProcessed.vehicleType);
                                                    setLastProcessed(null);
                                                    setErrorMsg(null);
                                                    setTicketData(null);
                                                }
                                            }}
                                            className="mt-3 w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                        >
                                            <AlertCircle size={16} />
                                            CANCELAR REGISTRO
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}


                    </section>
                </div>
            </div>

        </div>
    );
};
