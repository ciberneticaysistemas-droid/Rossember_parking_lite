import React, { useState, useEffect } from 'react';
import { ShieldAlert, Key, Eye, EyeOff, Save, X } from 'lucide-react';
import { SecurityConfig, LicenseConfig } from '../types';

interface SecuritySettingsModalProps {
  currentSecurity: SecurityConfig;
  currentLicense: LicenseConfig | null;
  onSaveSecurity: (config: SecurityConfig) => void;
  onSaveLicense: (config: LicenseConfig) => void;
  onClose: () => void;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  currentSecurity,
  currentLicense,
  onSaveSecurity,
  onSaveLicense,
  onClose
}) => {
  const [masterPassword, setMasterPassword] = useState(currentSecurity.masterPassword || '');
  const [ratesPassword, setRatesPassword] = useState(currentSecurity.ratesPassword || '');
  const [specialRatesPassword, setSpecialRatesPassword] = useState(currentSecurity.specialRatesPassword || '');
  const [licensePassword, setLicensePassword] = useState(currentLicense?.unlockPassword || '');

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const [showPwdFields, setShowPwdFields] = useState({
    master: false,
    rates: false,
    specialRates: false,
    license: false
  });

  const toggleVisibility = (field: keyof typeof showPwdFields) => {
    setShowPwdFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = () => {
    onSaveSecurity({
      masterPassword,
      ratesPassword,
      specialRatesPassword
    });

    if (currentLicense) {
      onSaveLicense({
        ...currentLicense,
        unlockPassword: licensePassword
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-fade-in-up">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 flex justify-between items-center border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-xl border border-blue-500/30">
              <ShieldAlert className="text-blue-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Configuración de Seguridad</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Gestión de Claves del Sistema</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar bg-slate-900">
          
          {/* Master Password */}
          <div>
            <label className="block text-slate-300 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <Key size={14} className="text-blue-400" /> Clave Maestra / Administrador
            </label>
            <div className="relative">
              <input
                type={showPwdFields.master ? 'text' : 'password'}
                value={masterPassword}
                onChange={e => setMasterPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-4 pr-12 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono tracking-widest"
                placeholder="Clave maestra"
              />
              <button
                type="button"
                onClick={() => toggleVisibility('master')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPwdFields.master ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-slate-500 text-[10px] mt-1 font-medium">Permite iniciar sesión en el panel y usar funcionalidades de recuperación.</p>
          </div>

          {/* Rates Password */}
          <div>
            <label className="block text-slate-300 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <Key size={14} className="text-orange-400" /> Acceso a Tarifas Base
            </label>
            <div className="relative">
              <input
                type={showPwdFields.rates ? 'text' : 'password'}
                value={ratesPassword}
                onChange={e => setRatesPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-4 pr-12 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono tracking-widest"
                placeholder="Clave para tarifas"
              />
              <button
                type="button"
                onClick={() => toggleVisibility('rates')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPwdFields.rates ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Special Rates Password */}
          <div>
            <label className="block text-slate-300 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <Key size={14} className="text-yellow-400" /> Acceso a Tarifas Especiales
            </label>
            <div className="relative">
              <input
                type={showPwdFields.specialRates ? 'text' : 'password'}
                value={specialRatesPassword}
                onChange={e => setSpecialRatesPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-4 pr-12 py-3 text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all font-mono tracking-widest"
                placeholder="Clave para tarifas especiales"
              />
              <button
                type="button"
                onClick={() => toggleVisibility('specialRates')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPwdFields.specialRates ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* License Password */}
          {currentLicense && (
            <div>
              <label className="block text-slate-300 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                <Key size={14} className="text-green-400" /> Clave de Desbloqueo (Licencia)
              </label>
              <div className="relative">
                <input
                  type={showPwdFields.license ? 'text' : 'password'}
                  value={licensePassword}
                  onChange={e => setLicensePassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-4 pr-12 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-mono tracking-widest"
                  placeholder="Clave de licencia"
                />
                <button
                  type="button"
                  onClick={() => toggleVisibility('license')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPwdFields.license ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-slate-500 text-[10px] mt-1 font-medium">Clave para desbloquear el sistema si se agota el tiempo de la licencia.</p>
            </div>
          )}

        </div>

        <div className="p-6 bg-slate-800 border-t border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-slate-300 font-bold hover:bg-slate-700 transition-colors rounded-xl"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center justify-center gap-2"
          >
            <Save size={18} /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};
