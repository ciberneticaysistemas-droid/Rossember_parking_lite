/**
 * electronDB.ts
 * Servicio de acceso a datos para la app React.
 *
 * - Si corre en ELECTRON → usa SQLite vía window.electronAPI (IPC)
 * - Si corre en el NAVEGADOR → usa localStorage como fallback
 *
 * Reemplaza todos los localStorage.getItem/setItem de App.tsx.
 */

// Detecta si estamos dentro de Electron
const api = typeof window !== 'undefined' ? (window as any).electronAPI : null;
export const enElectron: boolean = !!api;

// ── REGISTROS VEHICULOS ───────────────────────────────────────────────────────

export async function cargarRegistros(): Promise<any[]> {
  if (api) return api.registros.todos();
  const s = localStorage.getItem('parkingRecords');
  return s ? JSON.parse(s) : [];
}

export async function crearRegistro(record: any): Promise<void> {
  if (api) { await api.registros.crear(record); return; }
  const prev = await cargarRegistros();
  localStorage.setItem('parkingRecords', JSON.stringify([record, ...prev]));
}

export async function actualizarRegistro(record: any): Promise<void> {
  if (api) { await api.registros.actualizar(record); return; }
  const prev = await cargarRegistros();
  localStorage.setItem('parkingRecords', JSON.stringify(prev.map((r: any) => r.id === record.id ? record : r)));
}

export async function eliminarRegistro(id: string): Promise<void> {
  if (api) { await api.registros.eliminar(id); return; }
  const prev = await cargarRegistros();
  localStorage.setItem('parkingRecords', JSON.stringify(prev.filter((r: any) => r.id !== id)));
}

export async function purgarRegistros(tipo: 'all' | 'completed'): Promise<void> {
  if (api) { await api.registros.purgar(tipo); return; }
  if (tipo === 'all') localStorage.removeItem('parkingRecords');
  else {
    const prev = await cargarRegistros();
    localStorage.setItem('parkingRecords', JSON.stringify(prev.filter((r: any) => r.status !== 'COMPLETED')));
  }
}

// ── TARIFAS DE PRECIOS ────────────────────────────────────────────────────────

export async function cargarTarifas(): Promise<any> {
  if (api) return api.tarifas.obtener();
  const s = localStorage.getItem('parkingRates');
  return s ? JSON.parse(s) : null;
}

export async function guardarTarifas(rates: any): Promise<void> {
  if (api) { await api.tarifas.actualizar(rates); return; }
  localStorage.setItem('parkingRates', JSON.stringify(rates));
}

// ── PISOS Y CAPACIDADES ───────────────────────────────────────────────────────

export async function cargarPisos(): Promise<any[]> {
  if (api) return api.pisos.obtener();
  const s = localStorage.getItem('parkingFloors');
  return s ? JSON.parse(s) : [];
}

export async function guardarPisos(floors: any[]): Promise<void> {
  if (api) { await api.pisos.actualizar(floors); return; }
  localStorage.setItem('parkingFloors', JSON.stringify(floors));
}

// ── TARIFAS ESPECIALES (MENSUALIDADES / DESCUENTOS) ───────────────────────────

export async function cargarTarifasEspeciales(): Promise<any[]> {
  if (api) return api.tarifasEspeciales.obtener();
  const s = localStorage.getItem('specialRates');
  return s ? JSON.parse(s) : [];
}

export async function guardarTarifasEspeciales(rates: any[]): Promise<void> {
  if (api) { await api.tarifasEspeciales.actualizar(rates); return; }
  localStorage.setItem('specialRates', JSON.stringify(rates));
}

// ── VEHICULOS VETADOS ─────────────────────────────────────────────────────────

export async function cargarVetados(): Promise<any[]> {
  if (api) return api.vetados.obtener();
  const s = localStorage.getItem('bannedVehicles');
  return s ? JSON.parse(s) : [];
}

export async function guardarVetados(banned: any[]): Promise<void> {
  if (api) { await api.vetados.actualizar(banned); return; }
  localStorage.setItem('bannedVehicles', JSON.stringify(banned));
}

// ── CONFIGURACION DOCUMENTOS ──────────────────────────────────────────────────

export async function cargarConfigDocumentos(): Promise<any> {
  if (api) return api.config.documentos.obtener();
  const s = localStorage.getItem('documentConfig');
  return s ? JSON.parse(s) : null;
}

export async function guardarConfigDocumentos(config: any): Promise<void> {
  if (api) { await api.config.documentos.actualizar(config); return; }
  localStorage.setItem('documentConfig', JSON.stringify(config));
}

// ── CONFIGURACION IMPRESORA ───────────────────────────────────────────────────

export async function cargarConfigImpresora(): Promise<any> {
  if (api) return api.config.impresora.obtener();
  const s = localStorage.getItem('printerConfig');
  return s ? JSON.parse(s) : null;
}

export async function guardarConfigImpresora(config: any): Promise<void> {
  if (api) { await api.config.impresora.actualizar(config); return; }
  if (config) localStorage.setItem('printerConfig', JSON.stringify(config));
  else localStorage.removeItem('printerConfig');
}

// ── CONFIGURACION ESCANER ─────────────────────────────────────────────────────

export async function cargarConfigEscaner(): Promise<any> {
  if (api) return api.config.escaner.obtener();
  const s = localStorage.getItem('hardwareScannerConfig');
  return s ? JSON.parse(s) : { enabled: false, prefix: '', suffix: 'Enter', captureGlobally: true };
}

export async function guardarConfigEscaner(config: any): Promise<void> {
  if (api) { await api.config.escaner.actualizar(config); return; }
  localStorage.setItem('hardwareScannerConfig', JSON.stringify(config));
}

// ── ATAJOS DE TECLADO ─────────────────────────────────────────────────────────

export async function cargarAtajos(): Promise<any> {
  if (api) return api.config.atajos.obtener();
  const s = localStorage.getItem('keyboardShortcuts');
  return s ? JSON.parse(s) : null;
}

export async function guardarAtajos(shortcuts: any): Promise<void> {
  if (api) { await api.config.atajos.actualizar(shortcuts); return; }
  localStorage.setItem('keyboardShortcuts', JSON.stringify(shortcuts));
}

// ── CONFIGURACION LICENCIA ──────────────────────────────────────────────────

export async function cargarLicencia(): Promise<any> {
  if (api) return api.config.licencia.obtener();
  const s = localStorage.getItem('licenseConfig');
  if (s) {
    const parsed = JSON.parse(s);
    if (parsed.unlockPassword === '12345') parsed.unlockPassword = 'licenciavelvetsoftware';
    return parsed;
  }
  return { isActive: false, expirationDate: null, unlockPassword: 'licenciavelvetsoftware' };
}

export async function guardarLicencia(config: any): Promise<void> {
  if (api) { await api.config.licencia.actualizar(config); return; }
  localStorage.setItem('licenseConfig', JSON.stringify(config));
}

// ── CONFIGURACION SEGURIDAD ──────────────────────────────────────────────────

export async function cargarConfigSeguridad(): Promise<any> {
  // Siempre lo guardaremos en localStorage de momento sin subirlo a capa SQLite
  const s = localStorage.getItem('securityConfig');
  if (s) {
    const parsed = JSON.parse(s);
    if (parsed.masterPassword === 'AMCRJR' || parsed.masterPassword === 'admin' || parsed.masterPassword === 'adminvelvetsoftware') parsed.masterPassword = 'adminvelvet';
    if (parsed.ratesPassword === 'AMCRJR' || parsed.ratesPassword === 'admin' || parsed.ratesPassword === 'tarifasvelvetsoftware') parsed.ratesPassword = 'tarifasvelvet';
    if (parsed.specialRatesPassword === 'AMCRJR' || parsed.specialRatesPassword === 'admin' || parsed.specialRatesPassword === 'tarifasespecialesvelvetsoftware') parsed.specialRatesPassword = 'tarifasespecialesvelvet';
    return parsed;
  }
  return { masterPassword: 'adminvelvet', ratesPassword: 'tarifasvelvet', specialRatesPassword: 'tarifasespecialesvelvet' };
}

export async function guardarConfigSeguridad(config: any): Promise<void> {
  localStorage.setItem('securityConfig', JSON.stringify(config));
}
