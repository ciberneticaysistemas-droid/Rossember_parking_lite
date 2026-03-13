import React, { useState } from 'react';
import { X, Save, Car, Bike, Zap, Infinity as InfinityIcon } from 'lucide-react';
import { VehicleType } from '../types';

interface CapacitySettingsModalProps {
    currentCapacities: { REGULAR_CAR: number; PRIORITY_CAR: number; MOTO: number; EV_CHARGING: number; BICYCLE: number };
    onSave: (newCapacities: { REGULAR_CAR: number; PRIORITY_CAR: number; MOTO: number; EV_CHARGING: number; BICYCLE: number }) => void;
    onClose: () => void;
}

export const CapacitySettingsModal: React.FC<CapacitySettingsModalProps> = ({ currentCapacities, onSave, onClose }) => {
    const [capacities, setCapacities] = useState({ ...currentCapacities });

    const handleToggleIndefinite = (key: keyof typeof capacities) => {
        setCapacities(prev => ({
            ...prev,
            [key]: prev[key] === -1 ? (key === 'MOTO' ? 5 : 10) : -1
        }));
    };

    const handleInputChange = (key: keyof typeof capacities, value: string) => {
        const num = parseInt(value);
        setCapacities(prev => ({
            ...prev,
            [key]: isNaN(num) ? 0 : num
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-orange-100 w-full max-w-lg animate-fade-in-up overflow-hidden">
                <div className="bg-orange-600 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <Save size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white">Configuración de Capacidad</h2>
                            <p className="text-orange-100 text-xs font-bold uppercase tracking-widest">Define los espacios disponibles</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 space-y-6 bg-[#FFFBF7]">
                    <div className="grid gap-6">
                        {/* Carros */}
                        <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600">
                                        <Car size={20} />
                                    </div>
                                    <span className="font-bold text-gray-800">Carros (General)</span>
                                </div>
                                <button
                                    onClick={() => handleToggleIndefinite('REGULAR_CAR')}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
                                        capacities.REGULAR_CAR === -1 
                                        ? 'bg-orange-600 text-white border-orange-600' 
                                        : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
                                    }`}
                                >
                                    <InfinityIcon size={14} />
                                    {capacities.REGULAR_CAR === -1 ? 'Indefinido' : 'Poner Indefinido'}
                                </button>
                            </div>
                            {capacities.REGULAR_CAR !== -1 && (
                                <input
                                    type="number"
                                    value={capacities.REGULAR_CAR}
                                    onChange={(e) => handleInputChange('REGULAR_CAR', e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-orange-500 outline-none font-bold text-lg"
                                />
                            )}
                        </div>

                        {/* Motos */}
                        <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600">
                                        <Bike size={20} />
                                    </div>
                                    <span className="font-bold text-gray-800">Motocicletas</span>
                                </div>
                                <button
                                    onClick={() => handleToggleIndefinite('MOTO')}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
                                        capacities.MOTO === -1 
                                        ? 'bg-orange-600 text-white border-orange-600' 
                                        : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
                                    }`}
                                >
                                    <InfinityIcon size={14} />
                                    {capacities.MOTO === -1 ? 'Indefinido' : 'Poner Indefinido'}
                                </button>
                            </div>
                            {capacities.MOTO !== -1 && (
                                <input
                                    type="number"
                                    value={capacities.MOTO}
                                    onChange={(e) => handleInputChange('MOTO', e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-orange-500 outline-none font-bold text-lg"
                                />
                            )}
                        </div>

                        {/* Bicicletas */}
                        <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600">
                                        <Bike size={20} />
                                    </div>
                                    <span className="font-bold text-gray-800">Bicicletas</span>
                                </div>
                                <button
                                    onClick={() => handleToggleIndefinite('BICYCLE')}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
                                        capacities.BICYCLE === -1 
                                        ? 'bg-orange-600 text-white border-orange-600' 
                                        : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
                                    }`}
                                >
                                    <InfinityIcon size={14} />
                                    {capacities.BICYCLE === -1 ? 'Indefinido' : 'Poner Indefinido'}
                                </button>
                            </div>
                            {capacities.BICYCLE !== -1 && (
                                <input
                                    type="number"
                                    value={capacities.BICYCLE}
                                    onChange={(e) => handleInputChange('BICYCLE', e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-orange-500 outline-none font-bold text-lg"
                                />
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black rounded-2xl transition-all uppercase tracking-widest text-xs"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => onSave(capacities)}
                            className="flex-1 py-4 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-orange-900/20 uppercase tracking-widest text-xs active:scale-95"
                        >
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
