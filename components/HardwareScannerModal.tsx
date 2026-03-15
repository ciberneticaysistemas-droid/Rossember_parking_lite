import React, { useState } from 'react';
import { HardwareScannerConfig } from '../types';
import { Tablet, X, Save, ShieldCheck, Keyboard } from 'lucide-react';

interface HardwareScannerModalProps {
    currentConfig: HardwareScannerConfig | null;
    onSave: (config: HardwareScannerConfig) => void;
    onClose: () => void;
}

export const HardwareScannerModal: React.FC<HardwareScannerModalProps> = ({
    currentConfig,
    onSave,
    onClose
}) => {
    const [config, setConfig] = useState<HardwareScannerConfig>(currentConfig || {
        enabled: false,
        prefix: '',
        suffix: 'Enter',
        captureGlobally: true
    });

    const handleSave = () => {
        onSave(config);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-orange-100 w-full max-w-md animate-fade-in-up overflow-hidden">
                {/* Header */}
                <div className="bg-orange-600 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <Tablet size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black">Escáner de Hardware</h2>
                            <p className="text-orange-100 text-[10px] font-bold uppercase tracking-widest">Infrarrojo / HID / QR Externo</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-100">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="text-orange-600" size={20} />
                            <div>
                                <p className="font-black text-gray-800 text-sm">Estado del Escáner</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase trekking-widest">Habilitar/Deshabilitar</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                            className={`w-14 h-8 rounded-full transition-all relative ${config.enabled ? 'bg-orange-600' : 'bg-gray-300'}`}
                        >
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${config.enabled ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Keyboard size={14} /> Tecla de Finalización (Suffix)
                            </label>
                            <select
                                value={config.suffix}
                                onChange={(e) => setConfig(prev => ({ ...prev, suffix: e.target.value }))}
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-800 outline-none focus:border-orange-500 transition-all appearance-none"
                            >
                                <option value="Enter">Enter (Recomendado)</option>
                                <option value="Tab">Tab</option>
                                <option value="">Ninguno</option>
                            </select>
                            <p className="text-[10px] text-gray-400 font-medium leading-tight">
                                La mayoría de lectores emulan un teclado (HID) y envían una tecla 'Enter' al terminar el escaneo.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Tablet size={14} /> Prefijo de Identificación (Opcional)
                            </label>
                            <input
                                type="text"
                                value={config.prefix || ''}
                                onChange={(e) => setConfig(prev => ({ ...prev, prefix: e.target.value }))}
                                placeholder="Ej: SCAN_"
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-800 outline-none focus:border-orange-500 transition-all uppercase"
                            />
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                             <input 
                                type="checkbox"
                                checked={config.captureGlobally}
                                onChange={(e) => setConfig(prev => ({ ...prev, captureGlobally: e.target.checked }))}
                                className="w-5 h-5 accent-orange-600"
                             />
                             <div>
                                <p className="font-bold text-gray-800 text-sm">Captura Global</p>
                                <p className="text-[10px] text-gray-400 font-medium">Capturar escaneos incluso si el foco no está en un campo de texto.</p>
                             </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg shadow-orange-900/20 active:scale-95 transition-all"
                    >
                        <Save size={20} />
                        GUARDAR CONFIGURACIÓN
                    </button>
                </div>
            </div>
        </div>
    );
};
