'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// Expone una API segura al contexto del navegador (React).
// La app React la usa como: window.electronAPI.registros.todos()

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

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
