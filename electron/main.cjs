'use strict';

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { initDatabase } = require('./database/db.cjs');
const { registerHandlers } = require('./database/handlers.cjs');

const isDev = !app.isPackaged;
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    title: 'Rossember Parking Lite',
    show: false, // Mostramos solo cuando esté lista (evita flash blanco)
  });

  // En desarrollo carga el servidor Vite; en producción carga el build estático
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Mostrar la ventana cuando termine de cargar (evita parpadeo)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Abrir links externos en el navegador del sistema, pero permitir impresiones internas (about:blank)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('about:')) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ─── Ciclo de vida de la app ─────────────────────────────────────────────────

app.whenReady().then(() => {
  // 1. Inicializar la base de datos SQLite
  try {
    initDatabase();
  } catch (err) {
    console.error('[Main] ❌ Error al inicializar la BD:', err.message);
    app.quit();
    return;
  }

  // 2. Registrar todos los handlers CRUD
  registerHandlers(ipcMain);

  // 3. Crear la ventana principal
  createWindow();

  app.on('activate', () => {
    // En macOS: re-crear ventana si se cierra pero la app sigue en el dock
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // En Windows/Linux cerrar todas las ventanas termina la app
  if (process.platform !== 'darwin') app.quit();
});
