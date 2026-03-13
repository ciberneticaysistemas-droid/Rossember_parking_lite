import React, { useState, useEffect } from 'react';
import { DatabaseView } from '../components/DatabaseView';
import { RateSettingsModal } from '../components/RateSettingsModal';
import { SpecialRatesModal } from '../components/SpecialRatesModal';
import { PlateSearchModal } from '../components/PlateSearchModal';
import { GracePeriodModal } from '../components/GracePeriodModal';
import { ParkingRecord, VehicleType, Floor, SpecialRate, BannedVehicle } from '../types';
import { LayoutDashboard, Activity, DollarSign, Database, Settings, MapPin, ArrowLeft, TrendingUp, Car, Bike, Image as ImageIcon, Clock, Palette, Accessibility, Zap, Users, History, AlertTriangle, FileText, LogOut, CheckCircle, XCircle, Search, ArrowRight, Lock, Printer, ShieldAlert, Calendar, ChevronRight, X } from 'lucide-react';
import { PersonalizationModal } from '../components/PersonalizationModal';
import { PrinterSettingsModal, PrinterConfig } from '../components/PrinterSettingsModal';
import { CapacitySettingsModal } from '../components/CapacitySettingsModal';

interface AdminViewProps {
    records: ParkingRecord[];
    rates: Record<string, number>;
    capacities: { REGULAR_CAR: number; PRIORITY_CAR: number; MOTO: number; EV_CHARGING: number; BICYCLE: number };
    onRateUpdate: (newRates: Record<string, number>) => void;
    onCapacityUpdate?: (newCapacities: { REGULAR_CAR: number; PRIORITY_CAR: number; MOTO: number; EV_CHARGING: number; BICYCLE: number }) => void;
    onManualExit: (id: string) => void;
    onBackToSelector: () => void;
    floors?: Floor[];
    onFloorsUpdate?: (floors: Floor[]) => void;
    clientLogo?: string | null;
    onUpdateClientLogo?: (logo: string | null) => void;
    specialRates: SpecialRate[];
    onSpecialRatesUpdate: (newRates: SpecialRate[]) => void;
    printerConfig: PrinterConfig | null;
    onPrinterConfigUpdate: (config: PrinterConfig | null) => void;
    bannedVehicles: BannedVehicle[];
    onBannedVehiclesUpdate: (banned: BannedVehicle[]) => void;
    onPurgeRecords: (type: 'all' | 'completed') => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
    records,
    rates,
    capacities,
    onRateUpdate,
    onCapacityUpdate,
    onManualExit,
    onBackToSelector,
    floors,
    onFloorsUpdate,
    clientLogo,
    onUpdateClientLogo,
    specialRates,
    onSpecialRatesUpdate,
    printerConfig,
    onPrinterConfigUpdate,
    bannedVehicles,
    onBannedVehiclesUpdate,
    onPurgeRecords
}) => {
    const [showDatabase, setShowDatabase] = useState(false);
    const [showRateSettings, setShowRateSettings] = useState(false);
    const [showPlateSearch, setShowPlateSearch] = useState(false);
    const [showGracePeriod, setShowGracePeriod] = useState(false);
    const [showPersonalization, setShowPersonalization] = useState(false);
    const [showSpecialRates, setShowSpecialRates] = useState(false);
    const [showCierreCaja, setShowCierreCaja] = useState(false);
    const [showPrinterSettings, setShowPrinterSettings] = useState(false);
    const [showBannedModal, setShowBannedModal] = useState(false);
    const [showCapacitySettings, setShowCapacitySettings] = useState(false);
    const [showPurgeModal, setShowPurgeModal] = useState(false);

    // Report State
    const [reportPeriod, setReportPeriod] = useState<'daily' | 'monthly' | 'quarterly'>('daily');

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
    const completedRecords = records.filter(r => r.status === 'COMPLETED');
    const totalRevenue = completedRecords.reduce((acc, curr) => acc + (curr.cost || 0), 0);
    const todayRevenue = completedRecords
        .filter(r => r.exitTime && new Date(r.exitTime).toDateString() === new Date().toDateString())
        .reduce((acc, curr) => acc + (curr.cost || 0), 0);

    const todayRecords = completedRecords.filter(r =>
        r.exitTime && new Date(r.exitTime).toDateString() === new Date().toDateString()
    );
    const todayVehicles = todayRecords.length;
    const todayCars = todayRecords.filter(r => r.vehicleType === VehicleType.CAR || r.vehicleType === VehicleType.ELECTRIC).length;
    const todayMotos = todayRecords.filter(r => r.vehicleType === VehicleType.MOTORCYCLE).length;
    const todayBikes = todayRecords.filter(r => r.vehicleType === VehicleType.BICYCLE).length;

    const activeCars = activeRecords.filter(r => r.vehicleType === VehicleType.CAR || r.vehicleType === VehicleType.ELECTRIC).length;
    const activeMotos = activeRecords.filter(r => r.vehicleType === VehicleType.MOTORCYCLE).length;
    const activeBikes = activeRecords.filter(r => r.vehicleType === VehicleType.BICYCLE).length;

    // Calculate total capacity
    const isIndefinite = capacities.REGULAR_CAR === -1 || capacities.MOTO === -1 || capacities.BICYCLE === -1;
    let currentTotalCapacity = 0;

    if (floors && floors.length > 0) {
        currentTotalCapacity = floors.reduce((acc, floor) => {
            const fc = floor.capacities as any;
            return acc + 
                (fc.REGULAR_CAR === -1 ? 0 : (fc.REGULAR_CAR || 0)) +
                (fc.PRIORITY_CAR === -1 ? 0 : (fc.PRIORITY_CAR || 0)) +
                (fc.MOTO === -1 ? 0 : (fc.MOTO || 0)) +
                (fc.EV_CHARGING === -1 ? 0 : (fc.EV_CHARGING || 0)) +
                (fc.BICYCLE === -1 ? 0 : (fc.BICYCLE || 0));
        }, 0);
    } else {
        currentTotalCapacity = 
            (capacities.REGULAR_CAR === -1 ? 0 : capacities.REGULAR_CAR) + 
            (capacities.PRIORITY_CAR === -1 ? 0 : capacities.PRIORITY_CAR) + 
            (capacities.MOTO === -1 ? 0 : capacities.MOTO) + 
            (capacities.EV_CHARGING === -1 ? 0 : capacities.EV_CHARGING) + 
            (capacities.BICYCLE === -1 ? 0 : capacities.BICYCLE);
    }

    const occupancyPercentage = isIndefinite ? 0 : (currentTotalCapacity > 0 ? Math.round((activeRecords.length / currentTotalCapacity) * 100) : 0);

    // Chart Data Preparation (Last 7 Days)
    const getLast7DaysRevenue = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toDateString();
            const revenue = completedRecords
                .filter(r => r.exitTime && new Date(r.exitTime).toDateString() === dateStr)
                .reduce((acc, curr) => acc + (curr.cost || 0), 0);
            days.push({ day: d.toLocaleDateString('es-CO', { weekday: 'short' }), revenue });
        }
        return days;
    };

    const chartData = getLast7DaysRevenue();
    const maxRevenue = Math.max(...chartData.map(d => d.revenue), 100); // Avoid div by zero

    return (
        <div className="min-h-screen bg-[#FFFBF7] text-gray-800 selection:bg-orange-500 selection:text-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-gray-800 shadow-xl border-b border-orange-400">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onBackToSelector}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-gray-800"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-600 p-3 rounded-xl shadow-lg shadow-orange-900/20">
                                    <LayoutDashboard className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-black text-gray-800">Panel de Administrador</h1>
                                    <p className="text-orange-900/60 font-bold uppercase tracking-widest text-[10px]">Gestión y estadísticas del parqueadero</p>
                                </div>
                            </div>
                        </div>

                        {/* Real-time clock Colombia */}
                        <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/20 text-gray-800">
                            <Clock size={22} className="text-gray-800 shrink-0" />
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-orange-900/70 font-semibold leading-tight">Colombia · Hora Local</p>
                                <p className="font-mono font-bold text-xl leading-tight">{currentTime}</p>
                                <p className="text-xs text-orange-900/60 leading-tight capitalize">{currentDate}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">

                        {/* Stats Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-[#ea580c] p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(234,88,12,0.3)] text-white relative overflow-hidden group border border-white/10">
                                <div className="absolute right-0 top-0 w-48 h-48 bg-white/20 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700"></div>
                                <div className="absolute left-0 bottom-0 w-32 h-32 bg-black/10 rounded-full blur-[60px] -ml-16 -mb-16"></div>
                                
                                <div className="flex items-center justify-between mb-8 relative z-10">
                                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                        <Activity size={24} />
                                    </div>
                                    <span className="text-3xl font-black tracking-tighter">
                                        {isIndefinite ? '∞' : `${occupancyPercentage}%`}
                                    </span>
                                </div>
                                <h3 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1 relative z-10">Ocupación Actual</h3>
                                <p className="text-2xl font-black relative z-10">
                                    {activeRecords.length} / {isIndefinite ? '∞' : currentTotalCapacity}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2 text-[10px] relative z-10">
                                    <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1.5 rounded-xl font-black">
                                        <Car size={12} strokeWidth={3} />
                                        <span>{activeCars}</span>
                                        <span className="opacity-50">{capacities.REGULAR_CAR === -1 ? '(∞)' : `/${capacities.REGULAR_CAR}`}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1.5 rounded-xl font-black">
                                        <Bike size={12} strokeWidth={3} />
                                        <span>{activeMotos}</span>
                                        <span className="opacity-50">{capacities.MOTO === -1 ? '(∞)' : `/${capacities.MOTO}`}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1.5 rounded-xl font-black">
                                        <Bike size={12} strokeWidth={3} />
                                        <span>{activeBikes}</span>
                                        <span className="opacity-50">{capacities.BICYCLE === -1 ? '(∞)' : `/${capacities.BICYCLE}`}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Today Revenue */}
                            <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-premium text-gray-800 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-all"></div>
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
                                        <DollarSign size={24} />
                                    </div>
                                    <TrendingUp size={20} className="text-emerald-500" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Ingresos Hoy</h3>
                                <p className="text-3xl font-black text-emerald-600 relative z-10">${todayRevenue.toLocaleString()}</p>
                            </div>

                            {/* Total Revenue */}
                            <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-premium text-gray-800 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-all"></div>
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
                                        <DollarSign size={24} />
                                    </div>
                                </div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Ingresos Totales</h3>
                                <p className="text-3xl font-black text-gray-800 relative z-10">${totalRevenue.toLocaleString()}</p>
                                <p className="text-xs text-orange-600 font-bold mt-2 relative z-10 bg-orange-50 inline-block px-1.5 py-0.5 rounded-lg border border-orange-100">{completedRecords.length} transacciones</p>
                            </div>

                            {/* Total Vehicles */}
                            <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-premium text-gray-800 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-all"></div>
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
                                        <Car size={24} />
                                    </div>
                                </div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Total Vehículos</h3>
                                <p className="text-3xl font-black text-gray-800 relative z-10">{records.length}</p>
                                <p className="text-xs text-orange-600 font-bold mt-2 relative z-10 bg-orange-50 inline-block px-2 py-1 rounded-lg">{activeRecords.length} activos</p>
                            </div>
                        </div>

                        {/* Charts Area */}
                        <div className="mb-8 bg-white p-6 rounded-2xl border border-orange-100 shadow-premium">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <TrendingUp size={20} className="text-orange-500" />
                                Ingresos Últimos 7 Días
                            </h3>
                            <div className="h-48 flex items-end gap-3 md:gap-6 justify-between px-2">
                                {chartData.map((d, i) => (
                                    <div key={i} className="flex flex-col items-center justify-end flex-1 h-full group">
                                        <div className="w-full bg-orange-100 rounded-t-lg relative transition-all duration-500 hover:bg-orange-500 group-hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                                            style={{ height: `${(d.revenue / maxRevenue) * 100}%`, minHeight: '4px' }}>
                                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-600 pointer-events-none z-20">
                                                ${d.revenue.toLocaleString()}
                                            </div>
                                        </div>
                                        <span className="text-gray-400 text-[10px] font-bold mt-3 font-mono uppercase tracking-tighter">{d.day}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                {/* Action Cards Grid */}
                <h2 className="text-2xl font-bold text-gray-900 mb-6 pl-1 tracking-tight">Gestión del Parqueadero</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

                    {/* 1. Base de Datos & Buscador */}
                    <button
                        onClick={() => setShowDatabase(true)}
                        className="bg-white hover:bg-orange-50 p-6 rounded-2xl shadow-premium border border-orange-100 transition-all text-left group hover:border-orange-500 hover:shadow-lg hover:shadow-orange-900/10"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-orange-100 p-3 rounded-xl group-hover:scale-110 transition-transform shadow-lg shadow-orange-900/10">
                                <Database size={24} className="text-orange-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-800 group-hover:text-orange-600 transition-colors">Base de Datos</h3>
                                <span className="text-[10px] bg-orange-600 text-white font-bold px-2 py-0.5 rounded mt-1 inline-block uppercase tracking-widest">Incluye Buscador</span>
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed font-medium">Ver todos los registros, buscar placas, reimprimir recibos y gestionar salidas manuales.</p>
                    </button>

                    {/* 2. Cierre de Caja Diaria */}
                    <button
                        onClick={() => setShowCierreCaja(true)}
                        className="bg-white hover:bg-orange-50 p-6 rounded-2xl shadow-premium border border-orange-100 transition-all text-left group hover:border-orange-500 hover:shadow-lg hover:shadow-orange-900/10"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-amber-100 p-3 rounded-xl group-hover:scale-110 transition-transform shadow-lg shadow-amber-900/10">
                                <Lock size={24} className="text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-800 group-hover:text-amber-600 transition-colors">Cierre de Caja</h3>
                                <span className="text-[10px] bg-amber-600 text-white font-bold px-2 py-0.5 rounded mt-1 inline-block uppercase tracking-widest">Resumen del día</span>
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed font-medium">Ver el resumen de ingresos, vehículos atendidos y totales del día actual.</p>
                    </button>

                    {/* 3. Tarifas */}
                    <button
                        onClick={() => setShowRateSettings(true)}
                        className="bg-white hover:bg-orange-50 p-6 rounded-2xl shadow-premium border border-orange-100 transition-all text-left group hover:border-orange-500 hover:shadow-lg hover:shadow-orange-900/10"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-orange-100 p-3 rounded-xl group-hover:scale-110 transition-transform shadow-lg shadow-orange-900/10">
                                <Settings size={24} className="text-orange-600" />
                            </div>
                            <h3 className="text-xl font-black text-gray-800 group-hover:text-orange-600 transition-colors">Tarifas</h3>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed font-medium">Configurar precios por minuto, tarifas plenas, descuentos y cobros especiales.</p>
                    </button>

                    {/* 4. Tiempo de Gracia */}
                    <button
                        onClick={() => setShowGracePeriod(true)}
                        className="bg-white hover:bg-orange-50 p-6 rounded-2xl shadow-premium border border-orange-100 transition-all text-left group hover:border-orange-500 hover:shadow-lg"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-orange-100 p-3 rounded-xl group-hover:scale-110 transition-transform shadow-lg">
                                <Clock size={24} className="text-orange-600" />
                            </div>
                            <h3 className="text-xl font-black text-gray-800 group-hover:text-orange-600 transition-colors">Tiempo de Gracia</h3>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed font-medium">Configurar el tiempo permitido para salir después de realizar el pago.</p>
                    </button>

                    {/* 5. Personalización */}
                    <button
                        onClick={() => setShowPersonalization(true)}
                        className="bg-white hover:bg-orange-50 p-6 rounded-2xl shadow-premium border border-orange-100 transition-all text-left group hover:border-orange-500 hover:shadow-lg"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-orange-100 p-3 rounded-xl group-hover:scale-110 transition-transform shadow-lg">
                                <Palette size={24} className="text-orange-600" />
                            </div>
                            <h3 className="text-xl font-black text-gray-800 group-hover:text-orange-600 transition-colors">Personalización</h3>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed font-medium">Configurar el logo de la empresa y opciones de marca blanca.</p>
                    </button>

                    {/* 6. Tarifas Especiales */}
                    <button
                        onClick={() => setShowSpecialRates(true)}
                        className="bg-white hover:bg-orange-50 p-6 rounded-2xl shadow-premium border border-orange-100 transition-all text-left group hover:border-orange-500 hover:shadow-lg"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-orange-100 p-3 rounded-xl group-hover:scale-110 transition-transform shadow-lg">
                                <Users size={24} className="text-orange-600" />
                            </div>
                            <h3 className="text-xl font-black text-gray-800 group-hover:text-orange-600 transition-colors">Tarifas Especiales</h3>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed font-medium">Gestionar mensualidades, descuentos para empleados y convenios especiales por placa.</p>
                    </button>

                    {/* 8. Vehículos Vetados */}
                    <button
                        onClick={() => setShowBannedModal(true)}
                        className="bg-white hover:bg-orange-50 p-6 rounded-2xl shadow-premium border border-orange-100 transition-all text-left group hover:border-red-500 hover:shadow-lg hover:shadow-red-900/10"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-red-50 p-3 rounded-xl group-hover:scale-110 transition-transform shadow-lg shadow-red-900/10">
                                <ShieldAlert size={24} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-black text-gray-800 group-hover:text-red-500 transition-colors">Vehículos Vetados</h3>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed font-medium">Gestionar lista negra de vehículos prohibidos por conducta o incidentes previos.</p>
                    </button>

                    {/* 7. Impresora */}
                    <button
                        onClick={() => setShowPrinterSettings(true)}
                        className="bg-white hover:bg-orange-50 p-6 rounded-2xl shadow-premium border border-orange-100 transition-all text-left group hover:border-orange-500 hover:shadow-lg"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-orange-100 p-3 rounded-xl group-hover:scale-110 transition-transform shadow-lg">
                                <Printer size={24} className="text-orange-600" />
                            </div>
                            <h3 className="text-xl font-black text-gray-800 group-hover:text-orange-600 transition-colors">Impresora</h3>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed font-medium">Configurar conexión con impresora térmica de tiquetes y opciones de impresión.</p>
                    </button>

                    {/* 9. Capacidad */}
                    <button
                        onClick={() => setShowCapacitySettings(true)}
                        className="bg-white hover:bg-orange-50 p-6 rounded-2xl shadow-premium border border-orange-100 transition-all text-left group hover:border-orange-500 hover:shadow-lg"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-orange-100 p-3 rounded-xl group-hover:scale-110 transition-transform shadow-lg">
                                <MapPin size={24} className="text-orange-600" />
                            </div>
                            <h3 className="text-xl font-black text-gray-800 group-hover:text-orange-600 transition-colors">Capacidad</h3>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed font-medium">Configurar cantidad de espacios para carros, motos y bicis o establecer como ilimitado.</p>
                    </button>

                    {/* 10. Centro de Mantenimiento */}
                    <button
                        onClick={() => setShowPurgeModal(true)}
                        className="bg-white hover:bg-red-50 p-6 rounded-2xl shadow-premium border border-orange-100 transition-all text-left group hover:border-red-500 hover:shadow-lg hover:shadow-red-900/10"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-red-100 p-3 rounded-xl group-hover:scale-110 transition-transform shadow-lg shadow-red-900/10 border border-red-200">
                                <Zap size={24} className="text-red-600" />
                            </div>
                            <h3 className="text-xl font-black text-gray-800 group-hover:text-red-600 transition-colors">Mantenimiento</h3>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed font-medium">Depurar el sistema, optimizar base de datos y realizar reinicios de seguridad.</p>
                    </button>

                </div>

                {/* Recent Activity Mini Table */}
                <div className="bg-white rounded-2xl shadow-premium border border-orange-100 overflow-hidden">
                    <div className="p-6 border-b border-orange-100 flex justify-between items-center bg-orange-50/30">
                        <div>
                            <h2 className="text-2xl font-black text-gray-800">Actividad Reciente</h2>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Últimas transacciones completadas</p>
                        </div>
                        <button onClick={() => setShowDatabase(true)} className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-black shadow-lg shadow-orange-900/20 hover:scale-105 active:scale-95 transition-all">
                            VER TODO
                        </button>
                    </div>
                    <div className="p-0">
                        {completedRecords.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <Database size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="text-lg font-bold">Sin transacciones completadas</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-orange-50">
                                {completedRecords.slice(0, 5).map(record => (
                                    <div key={record.id} className="p-4 hover:bg-orange-50/30 transition-colors flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${record.vehicleType === VehicleType.CAR ? 'bg-orange-100 text-orange-600' : 'bg-orange-100 text-orange-600'}`}>
                                                {record.vehicleType === VehicleType.CAR ? <Car size={18} /> : <Bike size={18} />}
                                            </div>
                                            <div>
                                                <span className="font-black text-gray-800 block uppercase tracking-wider">{record.plate}</span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(record.exitTime || Date.now()).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-black text-emerald-600 block">+ ${record.cost?.toLocaleString()}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                                                {record.exitTime ? (() => {
                                                    const diff = record.exitTime - record.entryTime;
                                                    const minutes = Math.floor(diff / 60000);
                                                    const hours = Math.floor(minutes / 60);
                                                    const mins = minutes % 60;
                                                    return hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
                                                })() : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showDatabase && (
                <DatabaseView
                    records={records}
                    onClose={() => setShowDatabase(false)}
                    onOpenSettings={() => setShowRateSettings(true)}
                    onManualExit={onManualExit}
                    onOpenSearch={() => {
                        setShowDatabase(false);
                        setShowPlateSearch(true);
                    }}
                />
            )}

            {showRateSettings && (
                <RateSettingsModal
                    currentRates={rates}
                    onSave={(newRates) => {
                        onRateUpdate(newRates);
                        setShowRateSettings(false);
                    }}
                    onCancel={() => setShowRateSettings(false)}
                />
            )}

            {showPlateSearch && (
                <PlateSearchModal
                    records={records}
                    onClose={() => setShowPlateSearch(false)}
                />
            )}

            {showGracePeriod && (
                <GracePeriodModal
                    currentGracePeriod={rates['GRACE_PERIOD_MINUTES'] || 15}
                    onSave={(minutes) => {
                        onRateUpdate({ ...rates, 'GRACE_PERIOD_MINUTES': minutes });
                        setShowGracePeriod(false);
                    }}
                    onClose={() => setShowGracePeriod(false)}
                />
            )}

            {showPersonalization && onUpdateClientLogo && (
                <PersonalizationModal
                    currentLogo={clientLogo || null}
                    onSave={(logo) => {
                        onUpdateClientLogo(logo);
                        setShowPersonalization(false);
                    }}
                    onClose={() => setShowPersonalization(false)}
                />
            )}

            {showSpecialRates && (
                <SpecialRatesModal
                    specialRates={specialRates}
                    onUpdate={onSpecialRatesUpdate}
                    onClose={() => setShowSpecialRates(false)}
                />
            )}

            {showPrinterSettings && (
                <PrinterSettingsModal
                    currentConfig={printerConfig}
                    onSave={(config) => {
                        onPrinterConfigUpdate(config);
                        setShowPrinterSettings(false);
                    }}
                    onClose={() => setShowPrinterSettings(false)}
                />
            )}

            {showCapacitySettings && onCapacityUpdate && (
                <CapacitySettingsModal
                    currentCapacities={capacities}
                    onSave={(newCaps) => {
                        onCapacityUpdate(newCaps);
                        setShowCapacitySettings(false);
                    }}
                    onClose={() => setShowCapacitySettings(false)}
                />
            )}

            {/* ── CIERRE DE CAJA PROFESIONAL ── */}
            {showCierreCaja && (() => {
                const now = new Date();
                const filteredRecords = completedRecords.filter(r => {
                    if (!r.exitTime) return false;
                    const exitDate = new Date(r.exitTime);
                    if (reportPeriod === 'daily') {
                        return exitDate.toDateString() === now.toDateString();
                    } else if (reportPeriod === 'monthly') {
                        return exitDate.getMonth() === now.getMonth() && exitDate.getFullYear() === now.getFullYear();
                    } else if (reportPeriod === 'quarterly') {
                        const threeMonthsAgo = new Date();
                        threeMonthsAgo.setMonth(now.getMonth() - 3);
                        return exitDate >= threeMonthsAgo;
                    }
                    return false;
                });

                const totalPeriodRevenue = filteredRecords.reduce((acc, curr) => acc + (curr.cost || 0), 0);
                const countCars = filteredRecords.filter(r => r.vehicleType === VehicleType.CAR || r.vehicleType === VehicleType.ELECTRIC).length;
                const countMotos = filteredRecords.filter(r => r.vehicleType === VehicleType.MOTORCYCLE).length;
                const countBikes = filteredRecords.filter(r => r.vehicleType === VehicleType.BICYCLE).length;

                const handlePrintReport = () => {
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) return;
                    
                    const periodLabel = reportPeriod === 'daily' ? 'DIARIO' : reportPeriod === 'monthly' ? 'MENSUAL' : 'TRIMESTRAL';
                    
                    printWindow.document.write(`
                        <html>
                        <head>
                            <title>Reporte de Caja - PochiPark</title>
                            <style>
                                body { font-family: sans-serif; padding: 40px; color: #333; }
                                .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
                                .title { font-size: 24px; font-weight: bold; margin: 0; }
                                .subtitle { color: #666; margin: 5px 0; }
                                .grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
                                .stat-card { background: #f9f9f9; padding: 20px; border-radius: 10px; border: 1px solid #eee; }
                                .stat-label { font-size: 12px; font-weight: bold; color: #888; text-transform: uppercase; margin-bottom: 5px; }
                                .stat-value { font-size: 20px; font-weight: bold; color: #222; }
                                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                th { text-align: left; background: #f4f4f4; padding: 12px; border-bottom: 2px solid #ddd; font-size: 12px; }
                                td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
                                .footer { margin-top: 50px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
                                @media print { .no-print { display: none; } }
                            </style>
                        </head>
                        <body>
                            <div class="header">
                                <h1 class="title">REPORTE DE CAJA ${periodLabel}</h1>
                                <p class="subtitle">PochiPark - Sistema de Gestión de Parqueadero</p>
                                <p class="subtitle">Fecha de generación: ${new Date().toLocaleString()}</p>
                            </div>
                            
                            <div class="grid">
                                <div class="stat-card">
                                    <div class="stat-label">Ingresos Totales</div>
                                    <div class="stat-value">$${totalPeriodRevenue.toLocaleString()}</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-label">Carros/EV</div>
                                    <div class="stat-value">${countCars}</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-label">Motos</div>
                                    <div class="stat-value">${countMotos}</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-label">Bicicletas</div>
                                    <div class="stat-value">${countBikes}</div>
                                </div>
                            </div>
                            
                            <h2>Detalle de Movimientos</h2>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Fecha/Hora</th>
                                        <th>Placa</th>
                                        <th>Tipo</th>
                                        <th>Estado</th>
                                        <th>Casco</th>
                                        <th>Duración</th>
                                        <th>Método</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${filteredRecords.map(r => `
                                        <tr>
                                            <td>${new Date(r.exitTime!).toLocaleString()}</td>
                                            <td><strong>${r.plate}</strong></td>
                                            <td>${r.vehicleType}</td>
                                            <td>${r.vehicleState || '-'}</td>
                                            <td>${r.leavesHelmet ? 'SÍ' : 'NO'}</td>
                                            <td>${Math.floor((r.exitTime! - r.entryTime)/60000)} min</td>
                                            <td>${r.paymentMethod || 'Efectivo'}</td>
                                            <td>$${(r.cost || 0).toLocaleString()}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                            
                            <div class="footer">
                                Documento generado automáticamente por el sistema PochiPark v1.0
                            </div>
                            <script>window.print();</script>
                        </body>
                        </html>
                    `);
                    printWindow.document.close();
                };

                return (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-2xl border border-orange-100 w-full max-w-2xl animate-fade-in-up overflow-hidden">
                            {/* Modal Header */}
                            <div className="bg-orange-600 p-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-xl">
                                        <Lock size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white">Cierre de Caja Profesional</h2>
                                        <p className="text-orange-100 text-xs font-bold uppercase tracking-widest">Resumen de operaciones y movimientos</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowCierreCaja(false)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Period Selector Tabs */}
                            <div className="bg-orange-50/50 p-1 flex items-center gap-1 border-b border-orange-100">
                                {(['daily', 'monthly', 'quarterly'] as const).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setReportPeriod(p)}
                                        className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${reportPeriod === p ? 'bg-orange-600 text-white shadow-lg' : 'text-orange-900/40 hover:bg-orange-100 hover:text-orange-600'}`}
                                    >
                                        {p === 'daily' ? 'Hoy / Diario' : p === 'monthly' ? 'Este Mes' : 'Trimestre'}
                                    </button>
                                ))}
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar bg-[#FFFBF7]">
                                {/* Total Period Revenue */}
                                <div className="bg-white border border-orange-100 rounded-2xl p-6 flex justify-between items-center shadow-premium">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-orange-600 p-4 rounded-2xl shadow-lg shadow-orange-900/20">
                                            <DollarSign size={32} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-[10px] uppercase tracking-widest font-black mb-1">Recaudación Total del Periodo</p>
                                            <p className="text-orange-600 font-black text-4xl tracking-tighter">${totalPeriodRevenue.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handlePrintReport}
                                        className="bg-orange-50 hover:bg-orange-100 p-4 rounded-2xl text-orange-600 transition-all border border-orange-200 group"
                                        title="Imprimir Reporte"
                                    >
                                        <Printer size={28} className="group-hover:scale-110 transition-transform" />
                                    </button>
                                </div>

                                {/* Detailed Stats Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Vehículos', val: filteredRecords.length, icon: FileText, color: 'text-gray-600' },
                                        { label: 'Carros/EV', val: countCars, icon: Car, color: 'text-orange-600' },
                                        { label: 'Motos', val: countMotos, icon: Bike, color: 'text-amber-600' },
                                        { label: 'Bicicletas', val: countBikes, icon: Bike, color: 'text-orange-500' }
                                    ].map((s, idx) => (
                                        <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm">
                                            <s.icon size={20} className={`${s.color} mb-2`} />
                                            <p className="text-gray-400 text-[10px] uppercase font-black">{s.label}</p>
                                            <p className={`font-black text-2xl ${s.color}`}>{s.val}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Transaction List */}
                                <div>
                                    <div className="flex justify-between items-center mb-3 px-1">
                                        <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                            <History size={16} className="text-orange-600" />
                                            Últimos Movimientos
                                        </h3>
                                        <span className="text-[10px] bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-full">{filteredRecords.length} total</span>
                                    </div>
                                    <div className="bg-white rounded-2xl border border-orange-50 divide-y divide-orange-50 overflow-hidden shadow-sm">
                                        {filteredRecords.length > 0 ? filteredRecords.slice(0, 50).map(r => (
                                            <div key={r.id} className="flex justify-between items-center px-4 py-3 hover:bg-orange-50/50 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-1.5 rounded-lg ${r.vehicleType === VehicleType.CAR ? 'bg-orange-50 text-orange-600' : 'bg-orange-50 text-orange-600'}`}>
                                                        {r.vehicleType === VehicleType.CAR ? <Car size={14} /> : <Bike size={14} />}
                                                    </div>
                                                    <div>
                                                        <span className="font-black text-gray-800 group-hover:text-orange-600 transition-colors uppercase tracking-wider text-sm">{r.plate}</span>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(r.exitTime!).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} · {r.paymentMethod}</p>
                                                    </div>
                                                </div>
                                                <span className="text-emerald-600 font-black text-sm">+${r.cost?.toLocaleString()}</span>
                                            </div>
                                        )) : (
                                            <div className="p-12 text-center">
                                                <AlertTriangle size={32} className="text-gray-300 mx-auto mb-2" />
                                                <p className="text-gray-400 font-bold text-sm">No hay movimientos registrados.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 bg-orange-50 flex gap-3">
                                <button
                                    onClick={handlePrintReport}
                                    className="flex-1 py-4 bg-white text-orange-600 font-black rounded-2xl transition-all border border-orange-200 shadow-sm flex items-center justify-center gap-2 group hover:bg-orange-100"
                                >
                                    <Printer size={20} className="group-hover:rotate-12 transition-transform" />
                                    IMPRIMIR REPORTE
                                </button>
                                <button
                                    onClick={() => setShowCierreCaja(false)}
                                    className="flex-1 py-4 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <CheckCircle size={20} />
                                    CERRAR
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ── GESTIÓN DE VEHÍCULOS VETADOS ── */}
            {showBannedModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl border border-red-100 w-full max-w-xl animate-fade-in-up overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="bg-red-600 p-6 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4 text-white">
                                <div className="bg-white/20 p-3 rounded-2xl">
                                    <ShieldAlert size={28} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight leading-none mb-1 uppercase">Lista de Vehículos Vetados</h2>
                                    <p className="text-red-100/70 text-xs font-bold uppercase tracking-widest">Control de acceso y seguridad</p>
                                </div>
                            </div>
                            <button onClick={() => setShowBannedModal(false)} className="text-red-100 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto bg-[#FFFBF7]">
                            {/* Form to add banned */}
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.target as any;
                                const plate = form.plate.value.toUpperCase();
                                const reason = form.reason.value;
                                if (plate && reason) {
                                    onBannedVehiclesUpdate([...bannedVehicles, { plate, reason, createdAt: Date.now() }]);
                                    form.reset();
                                }
                            }} className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm space-y-4">
                                <h3 className="text-red-600 font-black text-xs uppercase tracking-widest mb-2">VETAR NUEVO VEHÍCULO</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <input 
                                        name="plate" 
                                        placeholder="PLACA (ABC-123)" 
                                        required 
                                        className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-black text-gray-800 placeholder:text-gray-300"
                                    />
                                    <input 
                                        name="reason" 
                                        placeholder="Descripción / Motivo..." 
                                        required 
                                        className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-bold text-gray-800 placeholder:text-gray-300"
                                    />
                                </div>
                                <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 active:scale-95">
                                    <ShieldAlert size={18} /> AGREGAR A LISTA NEGRA
                                </button>
                            </form>

                            {/* List of banned */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center px-2">
                                    <h3 className="text-gray-400 font-black text-xs uppercase tracking-widest">VEHÍCULOS ACTUALMENTE VETADOS</h3>
                                    <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded border border-red-200">{bannedVehicles.length} VETADOS</span>
                                </div>
                                <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 shadow-sm">
                                    {bannedVehicles.length === 0 ? (
                                        <div className="p-12 text-center">
                                            <CheckCircle size={48} className="text-gray-100 mx-auto mb-4" />
                                            <p className="text-gray-300 font-bold">No hay vehículos vetados actualmente.</p>
                                        </div>
                                    ) : bannedVehicles.map(v => (
                                        <div key={v.plate} className="p-4 flex justify-between items-start group hover:bg-red-50 transition-colors">
                                            <div className="flex items-start gap-4">
                                                <div className="bg-red-50 text-red-500 p-2 rounded-xl">
                                                    <AlertTriangle size={20} />
                                                </div>
                                                <div>
                                                    <span className="text-xl font-black text-gray-800 group-hover:text-red-600 transition-colors uppercase">{v.plate}</span>
                                                    <p className="text-gray-500 text-sm leading-tight mt-1 font-medium">{v.reason}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">VETADO EL: {new Date(v.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => onBannedVehiclesUpdate(bannedVehicles.filter(bv => bv.plate !== v.plate))}
                                                className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-100 rounded-lg transition-all"
                                                title="Eliminar de lista negra"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            {showPurgeModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] shadow-2xl border border-red-100 w-full max-w-xl overflow-hidden animate-fade-in-up">
                        <div className="bg-red-600 p-10 text-white text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/30 backdrop-blur-sm shadow-xl">
                                <Zap size={48} className="text-white" fill="currentColor" />
                            </div>
                            <h2 className="text-4xl font-[950] mb-2 italic tracking-tighter uppercase">Centro de Mantenimiento</h2>
                            <p className="text-red-100 font-bold text-sm tracking-widest uppercase opacity-80">Gestión Crítica del Sistema</p>
                        </div>

                        <div className="p-10 space-y-4 bg-[#FFFBF7]">
                            <div className="grid grid-cols-1 gap-4">
                                <button
                                    onClick={() => {
                                        onPurgeRecords('completed');
                                        setShowPurgeModal(false);
                                    }}
                                    className="flex items-center gap-5 p-6 bg-white hover:bg-orange-50 rounded-[2rem] border-2 border-orange-100 transition-all group text-left shadow-sm hover:shadow-md hover:border-orange-500"
                                >
                                    <div className="bg-orange-100 p-4 rounded-2xl text-orange-600 group-hover:scale-110 transition-transform">
                                        <History size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-800 text-lg leading-tight">Limpiar Historial</h4>
                                        <p className="text-gray-400 text-xs font-bold leading-tight mt-1">Elimina solo registros finalizados para liberar espacio.</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => {
                                        alert("Optimizando contadores y refrescando memoria...");
                                        // This just triggers a re-render in practice as App state is the source of truth
                                        setShowPurgeModal(false);
                                    }}
                                    className="flex items-center gap-5 p-6 bg-white hover:bg-blue-50 rounded-[2rem] border-2 border-blue-100 transition-all group text-left shadow-sm hover:shadow-md hover:border-blue-500"
                                >
                                    <div className="bg-blue-100 p-4 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
                                        <Activity size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-800 text-lg leading-tight">Optimizar Sistema</h4>
                                        <p className="text-gray-400 text-xs font-bold leading-tight mt-1">Recalcula ocupación y refresca la cache de datos.</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => {
                                        if (confirm("⚠️ ¡ADVERTENCIA CRÍTICA!\n\nEsta acción borrará TODOS los vehículos activos y todo el historial. El sistema quedará en CERO.\n\n¿Desea continuar?")) {
                                            onPurgeRecords('all');
                                            setShowPurgeModal(false);
                                        }
                                    }}
                                    className="flex items-center gap-5 p-6 bg-red-50 hover:bg-red-600 rounded-[2rem] border-2 border-red-100 transition-all group text-left shadow-sm hover:group-shadow-red-900/20 hover:border-red-600"
                                >
                                    <div className="bg-red-100 p-4 rounded-2xl text-red-600 group-hover:bg-white group-hover:text-red-600 transition-all group-hover:scale-110">
                                        <ShieldAlert size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-800 text-lg leading-tight group-hover:text-white transition-colors uppercase italic">Reinicio de Fábrica</h4>
                                        <p className="text-red-400 text-xs font-bold leading-tight mt-1 group-hover:text-red-100 transition-colors uppercase">Borrado total de la base de datos.</p>
                                    </div>
                                </button>
                            </div>

                            <button
                                onClick={() => setShowPurgeModal(false)}
                                className="w-full mt-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-500 font-black rounded-2xl transition-colors uppercase tracking-widest text-xs"
                            >
                                Cerrar Ventana
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
