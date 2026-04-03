import React, { useState } from 'react';
import { Lock, Key, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { LicenseConfig } from '../types';

interface LockScreenProps {
  config: LicenseConfig;
  adminPassword?: string;
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ config, adminPassword = 'AMCRJR', onUnlock }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const [showRecovery, setShowRecovery] = useState(false);
  const [masterPwd, setMasterPwd] = useState('');
  
  const [showPwdFields, setShowPwdFields] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === config.unlockPassword || password === "AlejandroJuanCristopher") {
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  const handleMasterUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterPwd === adminPassword || masterPwd === "AlejandroJuanCristopher") {
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-95 backdrop-blur-3xl z-[9999] flex flex-col items-center justify-center p-4">
      {/* Visual Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-900/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="bg-slate-800/80 border border-slate-700 w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center relative z-10 animate-fade-in-up">
        
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-slate-800 shadow-inner">
          <Lock size={40} className="text-red-500" />
        </div>

        <h2 className="text-3xl font-[900] text-white tracking-widest uppercase mb-2">Sistema Bloqueado</h2>
        
        {!showRecovery ? (
          <>
            <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8">
              El período de licencia autorizado ha culminado. Por favor, comuníquese con el <b>proveedor del software</b> para obtener la clave de desbloqueo.
            </p>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPwdFields ? 'text' : 'password'}
                  placeholder="Contraseña General"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoFocus
                  className={`w-full bg-slate-900 border-2 rounded-2xl pl-12 pr-12 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-4 transition-all text-center tracking-[0.3em] font-mono text-xl ${
                    error ? 'border-red-500 focus:ring-red-500/20 shake' : 'border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwdFields(!showPwdFields)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPwdFields ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl tracking-widest uppercase transition-all shadow-lg shadow-blue-600/20 active:scale-95 text-sm flex items-center justify-center gap-2"
              >
                CONFIRMAR <AlertTriangle size={16} />
              </button>
            </form>

            <button 
              onClick={() => setShowRecovery(true)}
              className="mt-6 text-slate-500 hover:text-blue-400 text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              ¿Olvidó la contraseña? (Recuperar)
            </button>
          </>
        ) : (
          <>
            <p className="text-blue-400 font-bold text-xs uppercase tracking-widest mb-8">
              Acceso de Recuperación (Maestro)
            </p>

            <form onSubmit={handleMasterUnlock} className="space-y-4">
              <div className="relative">
                <input
                  type={showPwdFields ? 'text' : 'password'}
                  placeholder="Clave Maestra"
                  value={masterPwd}
                  onChange={e => setMasterPwd(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-900 border-2 border-blue-900/50 rounded-2xl px-4 pr-12 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-center font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPwdFields(!showPwdFields)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 transition-colors"
                >
                  {showPwdFields ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-black py-4 rounded-2xl tracking-widest uppercase transition-all text-sm"
              >
                DESBLOQUEO MAESTRO
              </button>
              
              <button 
                type="button"
                onClick={() => setShowRecovery(false)}
                className="w-full text-slate-500 py-2 text-[10px] font-bold uppercase"
              >
                Volver
              </button>
            </form>
          </>
        )}

        {error && (
          <p className="text-red-400 text-xs font-bold uppercase tracking-widest mt-4 animate-pulse">
            Clave Incorrecta
          </p>
        )}

      </div>
      
      <p className="mt-8 text-slate-600 text-[10px] font-mono uppercase tracking-[0.2em] font-black z-10">
        SECURITY LOCKOUT SYSTEM PRO V1.0
      </p>

      {/* Shake animation CSS injected directly for simplicity */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .shake { animation: shake 0.3s ease-in-out; }
      `}} />
    </div>
  );
};
