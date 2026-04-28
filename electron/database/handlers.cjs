'use strict';
/**
 * handlers.cjs  —  Capa de acceso a datos (Electron / backend)
 *
 * Registra todos los handlers IPC que responden a las llamadas de la app React.
 * Cada handler recibe datos del renderer, ejecuta una operación SQLite (via db.cjs)
 * y devuelve el resultado serializado al renderer.
 *
 * Conversores internos (rowToRecord, rowToRates, etc.) mapean los nombres de
 * columna en español de la BD al formato JS en inglés definido en src/types.ts.
 *
 * Expuesto al renderer a través de: electron/preload.cjs → window.electronAPI
 */

const { randomUUID } = require('crypto');
const { getDatabase, getParqueaderoId } = require('./db.cjs');

// ─── CONVERSORES: DB → Formato JS (compatible con types.ts) ──────────────────

function rowToRecord(row) {
  if (!row) return null;
  return {
    id: row.id_registro,
    plate: row.placa,
    ownerId: row.cedula_propietario || undefined,
    vehicleType: row.tipo_vehiculo,
    floorId: row.id_piso || undefined,
    entryTime: row.hora_entrada,
    exitTime: row.hora_salida || undefined,
    status: row.estado === 'ACTIVO' ? 'ACTIVE' : 'COMPLETED',
    cost: row.costo_total !== null ? row.costo_total : undefined,
    paymentStatus: row.estado_pago || undefined,
    paymentMethod: row.metodo_pago || undefined,
    isDisabled: row.es_prioritario === 1,
    spotNumber: row.numero_puesto || undefined,
    requiresCharging: row.requiere_carga_electrica === 1,
    vehicleState: row.estado_vehiculo || undefined,
    vehicleComment: row.observaciones || undefined,
    leavesHelmet: row.deja_casco === 1,
    helmetDescription: row.descripcion_casco || undefined,
  };
}

function rowToRates(row) {
  if (!row) return null;
  return {
    'Carro': row.tarifa_carro_por_minuto,
    'Moto': row.tarifa_moto_por_minuto,
    'Bicicleta': row.tarifa_bicicleta_por_minuto,
    'Eléctrico': row.tarifa_carga_electrica_por_minuto,
    'Desconocido': row.tarifa_carro_por_minuto,
    'CAR_FULL': row.tarifa_plena_carro_dia,
    'MOTO_FULL': row.tarifa_plena_moto_dia,
    'BICYCLE_FULL': row.tarifa_plena_bicicleta_dia,
    'EV_CHARGING_RATE': row.tarifa_carga_electrica_por_minuto,
    'DISABILITY_DISCOUNT_PERCENT': row.porcentaje_descuento_prioritario,
    'GRACE_PERIOD_MINUTES': row.minutos_gracia,
    'IVA_ENABLED': row.iva_habilitado,
    'IVA_RATE': row.porcentaje_iva,
  };
}

function rowToSpecialRate(row) {
  if (!row) return null;
  return {
    id: row.id_tarifa,
    plate: row.placa,
    ownerId: row.cedula_propietario || undefined,
    type: row.tipo_tarifa,
    value: row.valor,
    description: row.descripcion || undefined,
    expirationDate: row.fecha_vencimiento || undefined,
    isActive: row.activa === 1,
  };
}

function rowToBanned(row) {
  if (!row) return null;
  return { plate: row.placa, reason: row.motivo_veto, createdAt: row.fecha_veto };
}

function rowsToFloor(pisoRow, capacidades) {
  const dbToJs = { CARRO_REGULAR: 'REGULAR_CAR', CARRO_PRIORITARIO: 'PRIORITY_CAR', MOTO: 'MOTO', CARGA_ELECTRICA: 'EV_CHARGING', BICICLETA: 'BICYCLE' };
  const caps = {};
  const prefixes = {};
  capacidades.forEach(c => {
    const key = dbToJs[c.tipo_vehiculo] || c.tipo_vehiculo;
    caps[key] = c.capacidad_maxima;
    prefixes[key] = c.prefijo_puesto;
  });
  return { id: pisoRow.id_piso, name: pisoRow.nombre, capacities: caps, prefixes };
}

// ─── REGISTRAR TODOS LOS HANDLERS IPC ────────────────────────────────────────

function registerHandlers(ipcMain) {
  const PARK_ID = getParqueaderoId();

  // ── REGISTROS VEHICULOS ──────────────────────────────────────────────────

  ipcMain.handle('db:registros:todos', () => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM registros_vehiculos WHERE id_parqueadero = ? ORDER BY hora_entrada DESC').all(PARK_ID).map(rowToRecord);
  });

  ipcMain.handle('db:registros:crear', (_e, r) => {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO registros_vehiculos (
        id_registro, id_parqueadero, id_piso, placa, cedula_propietario,
        tipo_vehiculo, numero_puesto, hora_entrada, hora_salida, estado,
        es_prioritario, requiere_carga_electrica, estado_vehiculo,
        observaciones, deja_casco, descripcion_casco, costo_total,
        costo_sin_descuento, valor_iva, estado_pago, metodo_pago
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      r.id, PARK_ID, r.floorId || null, r.plate, r.ownerId || null,
      r.vehicleType, r.spotNumber || null, r.entryTime, r.exitTime || null,
      r.status === 'ACTIVE' ? 'ACTIVO' : 'COMPLETADO',
      r.isDisabled ? 1 : 0, r.requiresCharging ? 1 : 0,
      r.vehicleState || null, r.vehicleComment || null,
      r.leavesHelmet ? 1 : 0, r.helmetDescription || null,
      r.cost ?? null, null, null, r.paymentStatus || null, r.paymentMethod || null
    );
    return { ok: true };
  });

  ipcMain.handle('db:registros:actualizar', (_e, r) => {
    const db = getDatabase();
    db.prepare(`
      UPDATE registros_vehiculos SET
        hora_salida = ?, estado = ?, costo_total = ?, costo_sin_descuento = ?,
        valor_iva = ?, estado_pago = ?, metodo_pago = ?
      WHERE id_registro = ?
    `).run(
      r.exitTime || null,
      r.status === 'ACTIVE' ? 'ACTIVO' : 'COMPLETADO',
      r.cost ?? null, null, null,
      r.paymentStatus || null, r.paymentMethod || null, r.id
    );
    return { ok: true };
  });

  ipcMain.handle('db:registros:eliminar', (_e, id) => {
    getDatabase().prepare('DELETE FROM registros_vehiculos WHERE id_registro = ?').run(id);
    return { ok: true };
  });

  ipcMain.handle('db:registros:purgar', (_e, tipo) => {
    const db = getDatabase();
    if (tipo === 'all') db.prepare('DELETE FROM registros_vehiculos WHERE id_parqueadero = ?').run(PARK_ID);
    else db.prepare("DELETE FROM registros_vehiculos WHERE id_parqueadero = ? AND estado = 'COMPLETADO'").run(PARK_ID);
    return { ok: true };
  });

  // ── TARIFAS (RATES) ──────────────────────────────────────────────────────

  ipcMain.handle('db:tarifas:obtener', () => {
    const row = getDatabase().prepare('SELECT * FROM configuracion_tarifas WHERE id_parqueadero = ?').get(PARK_ID);
    return rowToRates(row);
  });

  ipcMain.handle('db:tarifas:actualizar', (_e, rates) => {
    getDatabase().prepare(`
      UPDATE configuracion_tarifas SET
        tarifa_carro_por_minuto=?, tarifa_plena_carro_dia=?,
        tarifa_moto_por_minuto=?, tarifa_plena_moto_dia=?,
        tarifa_bicicleta_por_minuto=?, tarifa_plena_bicicleta_dia=?,
        tarifa_carga_electrica_por_minuto=?, porcentaje_descuento_prioritario=?,
        minutos_gracia=?, iva_habilitado=?, porcentaje_iva=?,
        ultima_actualizacion=datetime('now')
      WHERE id_parqueadero=?
    `).run(
      rates['Carro']||85, rates['CAR_FULL']||35000,
      rates['Moto']||55, rates['MOTO_FULL']||18000,
      rates['Bicicleta']||30, rates['BICYCLE_FULL']||8000,
      rates['EV_CHARGING_RATE']||120, rates['DISABILITY_DISCOUNT_PERCENT']||50,
      rates['GRACE_PERIOD_MINUTES']||15, rates['IVA_ENABLED']||0,
      rates['IVA_RATE']||19, PARK_ID
    );
    return { ok: true };
  });

  // ── PISOS (FLOORS) ───────────────────────────────────────────────────────

  ipcMain.handle('db:pisos:obtener', () => {
    const db = getDatabase();
    const pisos = db.prepare('SELECT * FROM pisos WHERE id_parqueadero = ? AND activo = 1 ORDER BY orden').all(PARK_ID);
    return pisos.map(p => rowsToFloor(p, db.prepare('SELECT * FROM capacidades_piso WHERE id_piso = ?').all(p.id_piso)));
  });

  ipcMain.handle('db:pisos:actualizar', (_e, floors) => {
    const db = getDatabase();
    const jsToDb = { REGULAR_CAR:'CARRO_REGULAR', PRIORITY_CAR:'CARRO_PRIORITARIO', MOTO:'MOTO', EV_CHARGING:'CARGA_ELECTRICA', BICYCLE:'BICICLETA' };
    const tx = db.transaction((floors) => {
      floors.forEach(f => {
        db.prepare(`INSERT INTO pisos(id_piso,id_parqueadero,nombre,orden) VALUES(?,?,?,1)
          ON CONFLICT(id_piso) DO UPDATE SET nombre=excluded.nombre`).run(f.id, PARK_ID, f.name);
        Object.entries(f.capacities).forEach(([k, v]) => {
          const dbKey = jsToDb[k] || k;
          const prefix = (f.prefixes && f.prefixes[k]) || k.charAt(0);
          const ex = db.prepare('SELECT id_capacidad FROM capacidades_piso WHERE id_piso=? AND tipo_vehiculo=?').get(f.id, dbKey);
          if (ex) db.prepare('UPDATE capacidades_piso SET capacidad_maxima=?,prefijo_puesto=? WHERE id_capacidad=?').run(v, prefix, ex.id_capacidad);
          else db.prepare('INSERT INTO capacidades_piso(id_capacidad,id_piso,tipo_vehiculo,capacidad_maxima,prefijo_puesto) VALUES(?,?,?,?,?)').run(randomUUID(), f.id, dbKey, v, prefix);
        });
      });
    });
    tx(floors);
    return { ok: true };
  });

  // ── TARIFAS ESPECIALES ───────────────────────────────────────────────────

  ipcMain.handle('db:tarifasEspeciales:obtener', () =>
    getDatabase().prepare('SELECT * FROM tarifas_especiales WHERE id_parqueadero=?').all(PARK_ID).map(rowToSpecialRate)
  );

  ipcMain.handle('db:tarifasEspeciales:actualizar', (_e, rates) => {
    const db = getDatabase();
    const tx = db.transaction((rates) => {
      db.prepare('DELETE FROM tarifas_especiales WHERE id_parqueadero=?').run(PARK_ID);
      const s = db.prepare(`INSERT INTO tarifas_especiales(id_tarifa,id_parqueadero,placa,cedula_propietario,tipo_tarifa,valor,descripcion,fecha_vencimiento,activa) VALUES(?,?,?,?,?,?,?,?,?)`);
      rates.forEach(r => s.run(r.id, PARK_ID, r.plate, r.ownerId||null, r.type, r.value, r.description||null, r.expirationDate||null, r.isActive?1:0));
    });
    tx(rates);
    return { ok: true };
  });

  // ── VEHICULOS VETADOS ────────────────────────────────────────────────────

  ipcMain.handle('db:vetados:obtener', () =>
    getDatabase().prepare('SELECT * FROM vehiculos_vetados WHERE id_parqueadero=?').all(PARK_ID).map(rowToBanned)
  );

  ipcMain.handle('db:vetados:actualizar', (_e, banned) => {
    const db = getDatabase();
    const tx = db.transaction((banned) => {
      db.prepare('DELETE FROM vehiculos_vetados WHERE id_parqueadero=?').run(PARK_ID);
      const s = db.prepare('INSERT OR IGNORE INTO vehiculos_vetados(id_veto,id_parqueadero,placa,motivo_veto,fecha_veto) VALUES(?,?,?,?,?)');
      banned.forEach(v => s.run(randomUUID(), PARK_ID, v.plate, v.reason, v.createdAt||Date.now()));
    });
    tx(banned);
    return { ok: true };
  });

  // ── CONFIGURACION DOCUMENTOS ─────────────────────────────────────────────

  ipcMain.handle('db:configDocumentos:obtener', () => {
    const row = getDatabase().prepare('SELECT * FROM configuracion_documentos WHERE id_parqueadero=?').get(PARK_ID);
    if (!row) return null;
    return {
      businessName: row.nombre_empresa, nit: row.nit, address: row.direccion,
      phone: row.telefono, legalInfo: row.info_legal, ticketFooter: row.pie_tiquete,
      invoiceFooter: row.pie_factura, showWatermark: row.mostrar_marca_agua===1,
      logo: row.logo_base64,
    };
  });

  ipcMain.handle('db:configDocumentos:actualizar', (_e, c) => {
    getDatabase().prepare(`UPDATE configuracion_documentos SET nombre_empresa=?,nit=?,direccion=?,telefono=?,info_legal=?,pie_tiquete=?,pie_factura=?,mostrar_marca_agua=?,logo_base64=? WHERE id_parqueadero=?`)
      .run(c.businessName, c.nit, c.address, c.phone, c.legalInfo, c.ticketFooter, c.invoiceFooter, c.showWatermark?1:0, c.logo||null, PARK_ID);
    return { ok: true };
  });

  // ── CONFIGURACION IMPRESORA ──────────────────────────────────────────────

  ipcMain.handle('db:configImpresora:obtener', () => {
    const row = getDatabase().prepare('SELECT * FROM configuracion_impresora WHERE id_parqueadero=?').get(PARK_ID);
    if (!row) return null;
    return { name: row.nombre_impresora, type: row.tipo_conexion, address: row.direccion_ip, port: row.puerto, paperWidth: row.ancho_papel_mm, paperFormat: row.formato_papel, connected: true, autoprint: row.impresion_automatica===1 };
  });

  ipcMain.handle('db:configImpresora:actualizar', (_e, c) => {
    if (!c) { getDatabase().prepare("UPDATE configuracion_impresora SET impresion_automatica=0 WHERE id_parqueadero=?").run(PARK_ID); return { ok: true }; }
    getDatabase().prepare(`UPDATE configuracion_impresora SET nombre_impresora=?,tipo_conexion=?,direccion_ip=?,puerto=?,ancho_papel_mm=?,formato_papel=?,impresion_automatica=? WHERE id_parqueadero=?`)
      .run(c.name||'Impresora Térmica', c.type||'USB', c.address||null, c.port||9100, c.paperWidth||80, c.paperFormat||'TICKET', c.autoprint?1:0, PARK_ID);
    return { ok: true };
  });

  // ── CONFIGURACION ESCANER ────────────────────────────────────────────────

  ipcMain.handle('db:configEscaner:obtener', () => {
    const row = getDatabase().prepare('SELECT * FROM configuracion_escaner WHERE id_parqueadero=?').get(PARK_ID);
    if (!row) return { enabled: false, prefix: '', suffix: 'Enter', captureGlobally: true };
    return { enabled: row.habilitado===1, prefix: row.prefijo||'', suffix: row.sufijo||'Enter', captureGlobally: row.captura_global===1 };
  });

  ipcMain.handle('db:configEscaner:actualizar', (_e, c) => {
    getDatabase().prepare(`UPDATE configuracion_escaner SET habilitado=?,prefijo=?,sufijo=?,captura_global=? WHERE id_parqueadero=?`)
      .run(c.enabled?1:0, c.prefix||null, c.suffix||'Enter', c.captureGlobally?1:0, PARK_ID);
    return { ok: true };
  });

  // ── ATAJOS DE TECLADO ────────────────────────────────────────────────────

  ipcMain.handle('db:atajos:obtener', () => {
    const row = getDatabase().prepare('SELECT * FROM atajos_teclado WHERE id_parqueadero=?').get(PARK_ID);
    if (!row) return null;
    return { registerEntry: row.registrar_entrada, focusPlateInput: row.enfocar_campo_placa, toggleCar: row.seleccionar_carro, toggleMoto: row.seleccionar_moto, toggleBike: row.seleccionar_bicicleta, toggleAccessibility: row.activar_prioritario, focusSearch: row.enfocar_busqueda, openScanner: row.abrir_escaner, confirmPayment: row.confirmar_pago, switchToEntry: row.cambiar_a_entrada, switchToExit: row.cambiar_a_salida, printDocument: row.imprimir_documento };
  });

  ipcMain.handle('db:atajos:actualizar', (_e, s) => {
    getDatabase().prepare(`UPDATE atajos_teclado SET registrar_entrada=?,enfocar_campo_placa=?,seleccionar_carro=?,seleccionar_moto=?,seleccionar_bicicleta=?,activar_prioritario=?,enfocar_busqueda=?,abrir_escaner=?,confirmar_pago=?,cambiar_a_entrada=?,cambiar_a_salida=?,imprimir_documento=? WHERE id_parqueadero=?`)
      .run(s.registerEntry, s.focusPlateInput, s.toggleCar, s.toggleMoto, s.toggleBike, s.toggleAccessibility, s.focusSearch, s.openScanner, s.confirmPayment, s.switchToEntry, s.switchToExit, s.printDocument, PARK_ID);
    return { ok: true };
  });

  // ── CONFIGURACION LICENCIA ───────────────────────────────────────────────

  ipcMain.handle('db:licencia:obtener', () => {
    const row = getDatabase().prepare('SELECT * FROM configuracion_licencia WHERE id_parqueadero=?').get(PARK_ID);
    if (!row) return { isActive: false, expirationDate: null, unlockPassword: 'licenciavelvetsoftware' };
    const unlockPwd = (row.contrasena_desbloqueo === '12345') ? 'licenciavelvetsoftware' : (row.contrasena_desbloqueo || 'licenciavelvetsoftware');
    return { isActive: row.activa===1, expirationDate: row.fecha_expiracion||null, unlockPassword: unlockPwd };
  });

  ipcMain.handle('db:licencia:actualizar', (_e, c) => {
    getDatabase().prepare(`UPDATE configuracion_licencia SET activa=?,fecha_expiracion=?,contrasena_desbloqueo=? WHERE id_parqueadero=?`)
      .run(c.isActive?1:0, c.expirationDate||null, c.unlockPassword||'licenciavelvetsoftware', PARK_ID);
    return { ok: true };
  });

  console.log('[DB] ✅ Todos los handlers IPC registrados.');
}

module.exports = { registerHandlers };
