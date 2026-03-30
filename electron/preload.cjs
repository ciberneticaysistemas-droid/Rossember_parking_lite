'use strict';
/**
 * preload.cjs  —  Bridge seguro entre Electron y React
 *
 * Usa contextBridge para exponer window.electronAPI al renderer con
 * contextIsolation habilitado (nodeIntegration = false).
 * El renderer NUNCA accede directamente a Node.js; todo pasa por este puente.
 *
 * Estructura del API expuesto:
 *   window.electronAPI.registros.*        → CRUD de registros de vehículos
 *   window.electronAPI.tarifas.*          → Configuración de precios
 *   window.electronAPI.pisos.*            → Pisos y capacidades
 *   window.electronAPI.tarifasEspeciales.*→ Mensualidades y descuentos
 *   window.electronAPI.vetados.*          → Lista negra de vehículos
 *   window.electronAPI.config.*           → Documentos, impresora, escáner, atajos, licencia
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  print:      (html, options) => ipcRenderer.invoke('app:print',      { html, ...options }),
  printToPDF: (html, options) => ipcRenderer.invoke('app:printToPDF', { html, ...options }),
  getPrinters: () => ipcRenderer.invoke('app:getPrinters'),
  getSerialPorts: () => ipcRenderer.invoke('app:getSerialPorts'),

  // ── Registros Vehiculos ────────────────────────────────────────────────
  registros: {
    todos: () => ipcRenderer.invoke('db:registros:todos'),
    crear: (record) => ipcRenderer.invoke('db:registros:crear', record),
    actualizar: (record) => ipcRenderer.invoke('db:registros:actualizar', record),
    eliminar: (id) => ipcRenderer.invoke('db:registros:eliminar', id),
    purgar: (tipo) => ipcRenderer.invoke('db:registros:purgar', tipo),
  },

  // ── Tarifas de Precios ─────────────────────────────────────────────────
  tarifas: {
    obtener: () => ipcRenderer.invoke('db:tarifas:obtener'),
    actualizar: (rates) => ipcRenderer.invoke('db:tarifas:actualizar', rates),
  },

  // ── Pisos y Capacidades ────────────────────────────────────────────────
  pisos: {
    obtener: () => ipcRenderer.invoke('db:pisos:obtener'),
    actualizar: (floors) => ipcRenderer.invoke('db:pisos:actualizar', floors),
  },

  // ── Tarifas Especiales (Mensualidades / Descuentos) ────────────────────
  tarifasEspeciales: {
    obtener: () => ipcRenderer.invoke('db:tarifasEspeciales:obtener'),
    actualizar: (rates) => ipcRenderer.invoke('db:tarifasEspeciales:actualizar', rates),
  },

  // ── Vehículos Vetados ──────────────────────────────────────────────────
  vetados: {
    obtener: () => ipcRenderer.invoke('db:vetados:obtener'),
    actualizar: (banned) => ipcRenderer.invoke('db:vetados:actualizar', banned),
  },

  // ── Configuraciones ────────────────────────────────────────────────────
  config: {
    documentos: {
      obtener: () => ipcRenderer.invoke('db:configDocumentos:obtener'),
      actualizar: (c) => ipcRenderer.invoke('db:configDocumentos:actualizar', c),
    },
    impresora: {
      obtener: () => ipcRenderer.invoke('db:configImpresora:obtener'),
      actualizar: (c) => ipcRenderer.invoke('db:configImpresora:actualizar', c),
      print: (html, options) => ipcRenderer.invoke('app:print', { html, ...options }),
    },
    escaner: {
      obtener: () => ipcRenderer.invoke('db:configEscaner:obtener'),
      actualizar: (c) => ipcRenderer.invoke('db:configEscaner:actualizar', c),
    },
    atajos: {
      obtener: () => ipcRenderer.invoke('db:atajos:obtener'),
      actualizar: (s) => ipcRenderer.invoke('db:atajos:actualizar', s),
    },
    licencia: {
      obtener: () => ipcRenderer.invoke('db:licencia:obtener'),
      actualizar: (c) => ipcRenderer.invoke('db:licencia:actualizar', c),
    },
  },
});
