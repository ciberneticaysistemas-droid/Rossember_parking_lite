import React, { useState, useEffect } from 'react';
import { X, Printer, CheckCircle, Wifi, WifiOff, TestTube2, Save, Trash2, Ruler, FileText, RefreshCw, ChevronDown } from 'lucide-react';

export interface PrinterConfig {
  name: string;
  type: 'USB' | 'NETWORK' | 'BLUETOOTH';
  address?: string;
  port?: number;
  usbPort?: string;   // Puerto USB/COM asignado por Windows (ej: USB001, COM3)
  paperWidth: 58 | 80 | 104 | 216; // mm: 58=ticket, 80=ticket wide, 104=half-letter, 216=letter/A4
  paperFormat: 'TICKET' | 'HALF' | 'LETTER' | 'A4'; // paper format name
  connected: boolean;
  autoprint: boolean;
  /** Tipo de código en el tiquete de entrada. Default: 'QR' */
  ticketCodeType: 'QR' | 'BARCODE';
}

interface SystemPrinter {
  name: string;
  isDefault: boolean;
  status: number;
  port: string | null;  // Puerto real en Windows (USB001, COM3, etc.)
}

interface SerialPort {
  id: string;   // COM3, COM4, etc.
  name: string; // Nombre descriptivo
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
  paperFormat: 'TICKET',
  connected: false,
  autoprint: false,
  ticketCodeType: 'QR',
};

// Paper format definitions
const PAPER_FORMATS = [
  {
    id: 'TICKET',
    label: 'Tiquete 58mm',
    sublabel: 'Impresora térmica pequeña',
    width: 58 as const,
    icon: '🧾',
    cssWidth: '384px',
    cssMaxWidth: '394px',
  },
  {
    id: 'TICKET_WIDE',
    label: 'Tiquete 80mm',
    sublabel: 'Impresora térmica estándar',
    width: 80 as const,
    icon: '🖨️',
    cssWidth: '576px',
    cssMaxWidth: '586px',
  },
  {
    id: 'HALF',
    label: 'Media Carta',
    sublabel: 'Compacto, ahorra papel',
    width: 104 as const,
    icon: '📄',
    cssWidth: '380px',
    cssMaxWidth: '390px',
  },
  {
    id: 'LETTER',
    label: 'Carta / Oficio',
    sublabel: 'Hoja completa estándar',
    width: 216 as const,
    icon: '📃',
    cssWidth: '720px',
    cssMaxWidth: '740px',
  },
] as const;

export const PrinterSettingsModal: React.FC<PrinterSettingsModalProps> = ({
  currentConfig,
  onSave,
  onClose,
}) => {
  const [config, setConfig] = useState<PrinterConfig>(currentConfig || DEFAULT_CONFIG);
  const [testResult, setTestResult] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [systemPrinters, setSystemPrinters] = useState<SystemPrinter[]>([]);
  const [serialPorts, _setSerialPorts] = useState<SerialPort[]>([]);
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [showPrinterList, setShowPrinterList] = useState(false);
  // Persistencia v16: Si ya hay un nombre guardado, asumimos "true" hasta que se pruebe lo contrario
  const [verifiedStatus, setVerifiedStatus] = useState<boolean | null>(
    currentConfig?.name && currentConfig.name !== 'Impresora Térmica' ? true : null
  );

  const selectedFormat = PAPER_FORMATS.find(f => f.id === config.paperFormat) || PAPER_FORMATS[1];

  const isElectron = !!(window as any).electronAPI?.getPrinters;

  // Carga las impresoras del sistema al abrir el modal
  useEffect(() => {
    if (isElectron) fetchSystemPrinters();
  }, []);

  const fetchSystemPrinters = async () => {
    setLoadingPrinters(true);
    // Persistencia v16: No reseteamos verifiedStatus, dejamos el valor anterior mientras actualizamos
    try {
      const printerList: SystemPrinter[] = await (window as any).electronAPI.getPrinters();
      setSystemPrinters(printerList);

      // Busca si la impresora guardada actualmente existe en el sistema
      const savedName = config.name;
      if (savedName && savedName !== 'Impresora Térmica' && savedName !== DEFAULT_CONFIG.name) {
        const match = printerList.find(p => p.name.toLowerCase() === savedName.toLowerCase());
        if (match) {
          setVerifiedStatus(true);
          setConfig(c => ({ ...c, connected: true, usbPort: match.port ?? c.usbPort }));
        } else {
          // La impresora guardada ya no existe en el sistema — mostrar lista abierta
          setVerifiedStatus(false);
          setConfig(c => ({ ...c, connected: false }));
          setShowPrinterList(true); // Abre el dropdown para que el usuario escoja una disponible
        }
      } else {
        // No hay impresora configurada — abrir lista directamente
        setShowPrinterList(printerList.length > 0);
      }
    } catch {
      setSystemPrinters([]);
      setVerifiedStatus(false);
    } finally {
      setLoadingPrinters(false);
    }
  };

  const handleSelectSystemPrinter = (printer: SystemPrinter) => {
    // Si la impresora aparece en el sistema, la consideramos disponible
    setConfig(c => ({ ...c, name: printer.name, connected: true, usbPort: printer.port ?? c.usbPort }));
    setVerifiedStatus(true);
    setShowPrinterList(false);
  };

  const handleFormatSelect = (fmt: typeof PAPER_FORMATS[number]) => {
    setConfig(c => ({
      ...c,
      paperFormat: fmt.id as PrinterConfig['paperFormat'],
      paperWidth: fmt.width,
    }));
  };

  const handleTest = async () => {
    if (!config.name || !config.connected) return;
    setTestResult('testing');

    if (isElectron) {
      const testHtml = `<!DOCTYPE html><html><head><style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 8px; text-align: center; font-size: 12px; }
        h2 { font-size: 16px; font-weight: 900; margin-bottom: 4px; }
        p { margin: 2px 0; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        @page { size: ${config.paperWidth}mm 100mm; margin: 0; }
      </style></head><body>
        <h2>ParkingCore</h2>
        <p>** PRUEBA DE IMPRESION **</p>
        <div class="line"></div>
        <p>Impresora: ${config.name}</p>
        <p>Formato: ${selectedFormat.label}</p>
        <p>${new Date().toLocaleString('es-CO')}</p>
        <div class="line"></div>
        <p>------ OK ------</p>
      </body></html>`;

      try {
        await (window as any).electronAPI.print(testHtml, {
          deviceName: config.name,
          paperWidth: config.paperWidth,
          silent: true,
        });
        setTestResult('ok');
      } catch {
        setTestResult('fail');
      }
    }
  };

  const handleSave = () => {
    onSave({ ...config, connected: verifiedStatus === true });
  };

  const handleRemove = () => {
    onSave(null);
    onClose();
  };

  const statusColor = verifiedStatus === true
    ? 'bg-teal-900/30 border-teal-700/50 text-teal-300'
    : verifiedStatus === false
      ? 'bg-red-900/30 border-red-700/50 text-red-300'
      : 'bg-slate-800/50 border-slate-700 text-slate-400';

  const statusIcon = verifiedStatus === true ? <Wifi size={18} /> : <WifiOff size={18} />;
  const statusText = 
    verifiedStatus === true
      ? `Detectada: ${config.name}${config.usbPort ? ` — ${config.usbPort}` : ''}`
      : loadingPrinters
        ? 'Verificando impresoras del sistema...'
        : verifiedStatus === false
          ? `"${config.name}" no encontrada — selecciona una de la lista`
          : 'Selecciona una impresora de la lista';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-600 p-5 flex justify-between items-center border-b border-slate-600 sticky top-0 z-10">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-teal-500/20 border border-teal-500/30 p-2 rounded-xl">
              <Printer size={20} className="text-teal-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Configuración de Impresora</h3>
              <p className="text-slate-400 text-xs">Impresora de Tiquetes y Facturas</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Connection Status Banner */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${statusColor}`}>
            {statusIcon}
            <span className="text-sm font-semibold flex-1">{statusText}</span>
          </div>

          {/* Selector de impresoras del sistema */}
          {isElectron && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Impresoras Instaladas en Este Equipo
                </label>
                <button
                  onClick={fetchSystemPrinters}
                  disabled={loadingPrinters}
                  className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw size={12} className={loadingPrinters ? 'animate-spin' : ''} />
                  {loadingPrinters ? 'Detectando...' : 'Actualizar'}
                </button>
              </div>

              {systemPrinters.length === 0 && !loadingPrinters && (
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-slate-500 text-sm text-center">
                  No se detectaron impresoras. Verifica que estén instaladas en Windows.
                </div>
              )}

              {systemPrinters.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowPrinterList(v => !v)}
                    className="w-full flex items-center justify-between bg-slate-800 border border-slate-600 rounded-xl p-3 text-white hover:border-teal-500 transition-colors"
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-sm">{config.name || 'Seleccionar impresora...'}</span>
                      {config.usbPort && (
                        <span className="text-[10px] text-teal-400 font-mono">Puerto: {config.usbPort}</span>
                      )}
                    </div>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${showPrinterList ? 'rotate-180' : ''}`} />
                  </button>

                  {showPrinterList && (
                    <div className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                      {systemPrinters.map(p => (
                        <button
                          key={p.name}
                          onClick={() => handleSelectSystemPrinter(p)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700 transition-colors text-left border-b border-slate-700/50 last:border-0"
                        >
                          <div>
                            <p className="text-sm text-white font-medium">{p.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {p.port && (
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-700 px-1.5 py-0.5 rounded">
                                  {p.port}
                                </span>
                              )}
                              {p.isDefault && <span className="text-[10px] text-teal-400">Predeterminada</span>}
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${p.status === 0 ? 'bg-teal-900/50 text-teal-300' : 'bg-yellow-900/50 text-yellow-300'}`}>
                            {p.status === 0 ? 'Lista' : 'Disponible'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Selector de puerto USB/COM */}
              {(() => {
                // Puertos USB de impresoras (USB001, USB002...) + puertos COM serie
                const usbPrinterPorts = systemPrinters
                  .filter(p => p.port && /^USB\d+$/i.test(p.port))
                  .map(p => ({ id: p.port!, label: p.port!, printer: p.name }));
                // Eliminar duplicados
                const uniqueUsbPorts = usbPrinterPorts.filter(
                  (p, i, arr) => arr.findIndex(x => x.id === p.id) === i
                );
                const comPorts = serialPorts.map(sp => ({ id: sp.id, label: sp.id, printer: sp.name }));
                const allPorts = [...uniqueUsbPorts, ...comPorts];

                if (allPorts.length === 0) return null;

                return (
                  <div className="mt-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                      Puerto Físico USB / COM
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {allPorts.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setConfig(c => ({ ...c, usbPort: p.id }))}
                          className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left ${
                            config.usbPort === p.id
                              ? 'bg-teal-900/40 border-teal-500'
                              : 'bg-slate-800 border-slate-600 hover:border-slate-500'
                          }`}
                        >
                          <span className={`text-sm font-bold font-mono ${config.usbPort === p.id ? 'text-teal-300' : 'text-white'}`}>
                            {p.label}
                          </span>
                          <span className="text-[10px] text-slate-500 leading-tight mt-0.5 truncate w-full">{p.printer}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 px-1">
                      Selecciona el puerto donde está conectada la impresora.
                    </p>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Name manual (solo si no es Electron o como fallback) */}
          {!isElectron && (
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
          )}

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

          {/* Paper Format */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Ruler size={14} className="text-teal-400" />
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Formato de Papel</label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PAPER_FORMATS.map(fmt => (
                <button
                  key={fmt.id}
                  onClick={() => handleFormatSelect(fmt)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${config.paperFormat === fmt.id
                    ? 'bg-teal-900/40 border-teal-500 text-white'
                    : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'}`}
                >
                  <span className="text-2xl">{fmt.icon}</span>
                  <div>
                    <p className={`text-sm font-bold leading-tight ${config.paperFormat === fmt.id ? 'text-teal-300' : 'text-slate-300'}`}>{fmt.label}</p>
                    <p className="text-[10px] text-slate-500 leading-tight">{fmt.sublabel}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700 flex items-center gap-3">
              <FileText size={16} className="text-teal-400 shrink-0" />
              <div className="text-xs text-slate-400">
                <span className="text-slate-300 font-bold">Seleccionado: </span>
                {selectedFormat.label} — Ancho de impresión: <span className="text-teal-400 font-mono">{selectedFormat.cssWidth}</span>
              </div>
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

          {/* Ticket Code Type */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">
              Tipo de Código en Tiquete
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: 'QR',      icon: '⬛', label: 'Código QR',      sublabel: 'Cámara / lector óptico' },
                { id: 'BARCODE', icon: '▌▌▌', label: 'Código de Barras', sublabel: 'Lector láser / HID' },
              ] as const).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setConfig(c => ({ ...c, ticketCodeType: opt.id }))}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    config.ticketCodeType === opt.id
                      ? 'bg-teal-900/40 border-teal-500 text-white'
                      : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <span className="text-2xl leading-none">{opt.icon}</span>
                  <div>
                    <p className={`text-sm font-bold leading-tight ${config.ticketCodeType === opt.id ? 'text-teal-300' : 'text-slate-300'}`}>
                      {opt.label}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-tight">{opt.sublabel}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-slate-500 px-1">
              Ambos formatos codifican el mismo ID de registro. El lector de salida decodifica ambos sin cambios.
            </p>
          </div>

          {/* Test Result */}
          {testResult === 'ok' && (
            <div className="flex items-center gap-2 bg-teal-900/30 border border-teal-700/50 p-3 rounded-xl text-teal-300 text-sm font-semibold">
              <CheckCircle size={16} /> Prueba enviada a la impresora.
            </div>
          )}
          {testResult === 'fail' && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 p-3 rounded-xl text-red-300 text-sm font-semibold">
              Error al imprimir. Verifica que la impresora esté encendida y conectada.
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleTest}
              disabled={testResult === 'testing' || !config.connected}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-40 text-sm"
            >
              <TestTube2 size={16} />
              {testResult === 'testing' ? 'Probando...' : 'Prueba de Impresión'}
            </button>
            <button
              onClick={handleSave}
              disabled={isElectron && verifiedStatus !== true}
              className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm shadow-lg shadow-teal-900/30"
            >
              <Save size={16} /> Guardar
            </button>
          </div>

          {isElectron && verifiedStatus !== true && (
            <p className="text-center text-xs text-slate-500">
              Selecciona una impresora de la lista para poder guardar.
            </p>
          )}

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
