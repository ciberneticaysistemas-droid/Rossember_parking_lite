import React, { useState } from 'react';
import { KeyboardShortcutsConfig, DEFAULT_SHORTCUTS } from '../types';
import { Keyboard, X, Save, RotateCcw } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  currentConfig: KeyboardShortcutsConfig;
  onSave: (config: KeyboardShortcutsConfig) => void;
  onClose: () => void;
}

interface ShortcutAction {
  key: keyof KeyboardShortcutsConfig;
  label: string;
  context: string;
}

const SHORTCUT_ACTIONS: ShortcutAction[] = [
  { key: 'focusPlateInput', label: 'Enfocar campo de Placa', context: 'Entrada' },
  { key: 'toggleCar', label: 'Seleccionar Carro', context: 'Entrada' },
  { key: 'toggleMoto', label: 'Seleccionar Moto', context: 'Entrada' },
  { key: 'toggleBike', label: 'Seleccionar Bicicleta', context: 'Entrada' },
  { key: 'toggleAccessibility', label: 'Toggle Prioridad/Accesibilidad', context: 'Entrada' },
  { key: 'registerEntry', label: 'Registrar Ingreso', context: 'Entrada' },
  { key: 'focusSearch', label: 'Enfocar Búsqueda de Placa/QR', context: 'Salida' },
  { key: 'openScanner', label: 'Abrir Cámara QR', context: 'Salida' },
  { key: 'confirmPayment', label: 'Confirmar Cobro / Abrir Pago', context: 'Salida' },
  { key: 'switchToEntry', label: 'Cambiar a Pestaña ENTRADA', context: 'Navegación' },
  { key: 'switchToExit', label: 'Cambiar a Pestaña SALIDA', context: 'Navegación' },
  { key: 'printDocument', label: 'Imprimir Ticket / Factura', context: 'General' },
  { key: 'toggleHelmet', label: 'Toggle Casco (Dejar/Quitar)', context: 'Entrada' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  currentConfig,
  onSave,
  onClose,
}) => {
  const [config, setConfig] = useState<KeyboardShortcutsConfig>({ ...currentConfig });
  const [capturingKey, setCapturingKey] = useState<keyof KeyboardShortcutsConfig | null>(null);

  const handleKeyCapture = (key: keyof KeyboardShortcutsConfig, e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Ignore modifier keys being pressed alone
    if (['Control', 'Shift', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;

    let combo = '';
    if (e.ctrlKey) combo += 'Ctrl+';
    if (e.altKey) combo += 'Alt+';
    if (e.shiftKey) combo += 'Shift+';
    
    // Normalize key name (e.g. 'control' -> 'Ctrl') is mostly handled by the logic above
    // but we want the actual key at the end
    const keyName = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    combo += keyName;

    setConfig(prev => ({ ...prev, [key]: combo }));
    setCapturingKey(null);
  };

  const handleReset = () => {
    setConfig({ ...DEFAULT_SHORTCUTS });
  };

  const contextColor = (ctx: string) =>
    ctx === 'Entrada'
      ? 'bg-blue-100 text-blue-700'
      : ctx === 'Salida'
      ? 'bg-orange-100 text-orange-700'
      : 'bg-indigo-100 text-indigo-700';

  const entryActions = SHORTCUT_ACTIONS.filter(a => a.context === 'Entrada');
  const exitActions = SHORTCUT_ACTIONS.filter(a => a.context === 'Salida');
  const navActions = SHORTCUT_ACTIONS.filter(a => a.context === 'Navegación');
  const generalActions = SHORTCUT_ACTIONS.filter(a => a.context === 'General');

  const renderActions = (actions: ShortcutAction[]) =>
    actions.map(action => (
      <div key={action.key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
        <div>
          <p className="font-bold text-gray-800 text-sm">{action.label}</p>
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${contextColor(action.context)}`}>
            {action.context}
          </span>
        </div>
        <button
          onKeyDown={(e) => capturingKey === action.key && handleKeyCapture(action.key, e)}
          onClick={() => setCapturingKey(capturingKey === action.key ? null : action.key)}
          className={`min-w-[90px] px-4 py-2 rounded-xl font-black text-sm border-2 transition-all text-center ${
            capturingKey === action.key
              ? 'bg-orange-600 text-white border-orange-600 animate-pulse'
              : 'bg-gray-100 text-gray-700 border-gray-200 hover:border-orange-400 hover:bg-orange-50'
          }`}
        >
          {capturingKey === action.key ? 'Presiona...' : config[action.key]}
        </button>
      </div>
    ));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-orange-100 w-full max-w-lg animate-fade-in-up overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-orange-600 p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-white/20 p-2 rounded-xl">
              <Keyboard size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black">Atajos de Teclado</h2>
              <p className="text-orange-100 text-[10px] font-bold uppercase tracking-widest">Haz clic en un atajo para cambiarlo</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-3 text-xs text-blue-700 font-medium">
          💡 Los atajos <strong>NO interfieren</strong> con la escritura. Solo se activan cuando no hay ningún campo de texto con foco.
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span> Módulo de Entrada
            </p>
            {renderActions(entryActions)}
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span> Módulo de Salida
            </p>
            {renderActions(exitActions)}
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span> Navegación General
            </p>
            {renderActions(navActions)}
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-500 inline-block"></span> General / Impresión
            </p>
            {renderActions(generalActions)}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex gap-3 shrink-0">
          <button
            onClick={handleReset}
            className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors text-sm"
          >
            <RotateCcw size={16} />
            Restaurar Defaults
          </button>
          <button
            onClick={() => onSave(config)}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-black flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20 active:scale-95 transition-all"
          >
            <Save size={18} />
            GUARDAR
          </button>
        </div>
      </div>
    </div>
  );
};
