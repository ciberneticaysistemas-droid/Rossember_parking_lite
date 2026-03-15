import React, { useState } from 'react';
import { X, Lock, Key, Calendar, ShieldAlert, Save, Trash2, CheckCircle } from 'lucide-react';
import { LicenseConfig } from '../types';

interface DevConfigModalProps {
  currentConfig: LicenseConfig | null;
  onSave: (config: LicenseConfig | null) => void;
  onClose: () => void;
}

export const DevConfigModal: React.FC<DevConfigModalProps> = ({ currentConfig, onSave, onClose }) => {
  const [config, setConfig] = useState<LicenseConfig>(currentConfig || {
    isActive: false,
    expirationDate: null,
    unlockPassword: '12345'
  });

  const [dateStr, setDateStr] = useState<string>(() => {
    if (currentConfig?.expirationDate) {
      const d = new Date(currentConfig.expirationDate);
      return d.toISOString().slice(0, 16); // YYYY-MM-DDThh:mm format
    }
    return '';
  });

  const handleSave = () => {
    let expTime = null;
    if (config.isActive && dateStr) {
      expTime = new Date(dateStr).getTime();
    }
    onSave({
      ...config,
      expirationDate: expTime,
      unlockPassword: config.unlockPassword || '12345'
    });
    onClose();
  };

  const handleDisable = () => {
    onSave(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999] flex items-center justify-center p-4">
      <div className="bg-[#1a1a2e] border border-blue-900/50 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-5 flex justify-between items-center border-b border-indigo-800/50">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-blue-500/20 shadow-inner p-2 rounded-xl">
              <ShieldAlert size={20} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-[900] text-lg tracking-widest uppercase">Admin Developer</h3>
              <p className="text-blue-200/70 text-[10px] font-bold tracking-widest">CONTROL DE LICENCIA LOCAL</p>
            </div>
          </div>
          <button onClick={onClose} className="text-blue-300 hover:text-white p-1.5 hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 text-gray-200">
          {/* Status Toggle */}
          <div className="flex items-center justify-between p-4 bg-blue-950/30 rounded-xl border border-blue-800/30">
            <div>
              <p className="font-bold text-sm text-white">Activar Bloqueo Automático</p>
              <p className="text-blue-300 text-xs">El software pedirá clave llegada la fecha.</p>
            </div>
            <button
              onClick={() => setConfig(c => ({ ...c, isActive: !c.isActive }))}
              className={`w-12 h-6 rounded-full transition-all ${config.isActive ? 'bg-blue-500' : 'bg-slate-700'} relative`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${config.isActive ? 'left-6' : 'left-0.5'}`}></div>
            </button>
          </div>

          {config.isActive && (
            <div className="space-y-4 animate-fade-in-up">
              {/* Date/Time Picker */}
              <div>
                <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5 block flex items-center gap-1.5">
                  <Calendar size={12} /> Fecha y Hora Límite
                </label>
                <input
                  type="datetime-local"
                  value={dateStr}
                  onChange={e => setDateStr(e.target.value)}
                  className="w-full bg-[#0f1025] border border-blue-800/50 rounded-xl p-3 text-white focus:border-blue-500 outline-none font-mono text-sm shadow-inner"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5 block flex items-center gap-1.5">
                  <Key size={12} /> Clave General de Desbloqueo
                </label>
                <input
                  type="text"
                  value={config.unlockPassword}
                  onChange={e => setConfig(c => ({ ...c, unlockPassword: e.target.value }))}
                  placeholder="Ej: 12345"
                  className="w-full bg-[#0f1025] border border-blue-800/50 rounded-xl p-3 text-white focus:border-blue-500 outline-none font-mono text-sm tracking-widest shadow-inner text-center"
                />
                <p className="text-[10px] text-gray-500 mt-1.5 leading-tight">
                  Esta será la contraseña requerida por el sistema para seguir operando una vez que pase la fecha límite.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm shadow-lg shadow-blue-900/30"
            >
              <Save size={16} /> GUARDAR CONFIGURACIÓN
            </button>
          </div>

          {currentConfig && currentConfig.isActive && (
            <button
              onClick={handleDisable}
              className="w-full text-red-400/80 hover:text-red-400 hover:bg-red-900/20 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 transition-colors border border-red-900/30 line-height-1"
            >
              <Trash2 size={12} /> Deshabilitar Completamente
            </button>
          )}

        </div>
      </div>
    </div>
  );
};
