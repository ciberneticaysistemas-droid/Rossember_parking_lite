import React, { useState } from 'react';
import { X, Printer, CheckCircle, Wifi, WifiOff, TestTube2, Save, Trash2 } from 'lucide-react';

export interface PrinterConfig {
  name: string;
  type: 'USB' | 'NETWORK' | 'BLUETOOTH';
  address?: string; // IP or BT address
  port?: number;
  paperWidth: 58 | 80; // mm
  connected: boolean;
  autoprint: boolean;
}

interface PrinterSettingsModalProps {
  currentConfig: PrinterConfig | null;
  onSave: (config: PrinterConfig | null) => void;
  onClose: () => void;
}

const DEFAULT_CONFIG: PrinterConfig = {
  name: 'Impresora Térmica',
  type: 'USB',
  paperWidth: 80,
  connected: false,
  autoprint: false,
};

export const PrinterSettingsModal: React.FC<PrinterSettingsModalProps> = ({
  currentConfig,
  onSave,
  onClose,
}) => {
  const [config, setConfig] = useState<PrinterConfig>(currentConfig || DEFAULT_CONFIG);
  const [testResult, setTestResult] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');

  const handleTest = () => {
    setTestResult('testing');
    // Simulate test
    setTimeout(() => {
      // Try sending a test print via browser print dialog
      const w = window.open('', '_blank', 'width=300,height=200');
      if (w) {
        w.document.write(`
          <html><head><title>Test</title>
          <style>body{font-family:monospace;padding:16px;text-align:center}</style>
          </head><body onload="window.print();window.close();">
            <h2>PochiParking</h2>
            <p>Prueba de Impresión</p>
            <p>Impresora: ${config.name}</p>
            <p>${new Date().toLocaleString('es-CO')}</p>
            <p>------ OK ------</p>
          </body></html>`);
        w.document.close();
        setTestResult('ok');
      } else {
        setTestResult('fail');
      }
    }, 800);
  };

  const handleSave = () => {
    onSave({ ...config, connected: true });
  };

  const handleRemove = () => {
    onSave(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-600 p-5 flex justify-between items-center border-b border-slate-600">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-teal-500/20 border border-teal-500/30 p-2 rounded-xl">
              <Printer size={20} className="text-teal-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Configuración de Impresora</h3>
              <p className="text-slate-400 text-xs">Impresora Térmica de Tiquetes</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Connection Status Banner */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${config.connected
            ? 'bg-teal-900/30 border-teal-700/50 text-teal-300'
            : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}>
            {config.connected ? <Wifi size={18} /> : <WifiOff size={18} />}
            <span className="text-sm font-semibold">
              {config.connected ? `Conectada: ${config.name}` : 'Sin impresora configurada'}
            </span>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Nombre de la Impresora</label>
            <input
              type="text"
              value={config.name}
              onChange={e => setConfig(c => ({ ...c, name: e.target.value }))}
              placeholder="Ej: EPSON TM-T20"
              className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white focus:border-teal-500 outline-none"
            />
          </div>

          {/* Connection Type */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Tipo de Conexión</label>
            <div className="grid grid-cols-3 gap-2">
              {(['USB', 'NETWORK', 'BLUETOOTH'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setConfig(c => ({ ...c, type: t }))}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${config.type === t
                    ? 'bg-teal-600 border-teal-500 text-white'
                    : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'}`}
                >
                  {t === 'USB' ? '🔌 USB' : t === 'NETWORK' ? '🌐 Red / IP' : '📶 Bluetooth'}
                </button>
              ))}
            </div>
          </div>

          {/* IP / Address if Network */}
          {config.type === 'NETWORK' && (
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Dirección IP</label>
                <input
                  type="text"
                  value={config.address || ''}
                  onChange={e => setConfig(c => ({ ...c, address: e.target.value }))}
                  placeholder="192.168.1.100"
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white focus:border-teal-500 outline-none font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Puerto</label>
                <input
                  type="number"
                  value={config.port || 9100}
                  onChange={e => setConfig(c => ({ ...c, port: parseInt(e.target.value) || 9100 }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white focus:border-teal-500 outline-none font-mono"
                />
              </div>
            </div>
          )}

          {/* Paper Width */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Ancho de Papel</label>
            <div className="flex gap-3">
              {([58, 80] as const).map(w => (
                <button
                  key={w}
                  onClick={() => setConfig(c => ({ ...c, paperWidth: w }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${config.paperWidth === w
                    ? 'bg-teal-600 border-teal-500 text-white'
                    : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'}`}
                >
                  {w}mm
                </button>
              ))}
            </div>
          </div>

          {/* Autoprint Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div>
              <p className="text-white font-semibold text-sm">Impresión Automática</p>
              <p className="text-slate-400 text-xs">Imprimir tiquete automáticamente en cada entrada</p>
            </div>
            <button
              onClick={() => setConfig(c => ({ ...c, autoprint: !c.autoprint }))}
              className={`w-12 h-6 rounded-full transition-all ${config.autoprint ? 'bg-teal-500' : 'bg-slate-600'} relative`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${config.autoprint ? 'left-6' : 'left-0.5'}`}></div>
            </button>
          </div>

          {/* Test Result */}
          {testResult === 'ok' && (
            <div className="flex items-center gap-2 bg-teal-900/30 border border-teal-700/50 p-3 rounded-xl text-teal-300 text-sm font-semibold">
              <CheckCircle size={16} /> Prueba enviada. Verifique la impresora.
            </div>
          )}
          {testResult === 'fail' && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 p-3 rounded-xl text-red-300 text-sm font-semibold">
              ⚠️ No se pudo abrir la ventana de impresión. Permita pop-ups.
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleTest}
              disabled={testResult === 'testing'}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 text-sm"
            >
              <TestTube2 size={16} />
              {testResult === 'testing' ? 'Probando...' : 'Prueba de Impresión'}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm shadow-lg shadow-teal-900/30"
            >
              <Save size={16} /> Guardar
            </button>
          </div>

          {currentConfig && (
            <button
              onClick={handleRemove}
              className="w-full text-red-400 hover:text-red-300 hover:bg-red-900/20 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors border border-red-900/30"
            >
              <Trash2 size={14} /> Eliminar Configuración
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
