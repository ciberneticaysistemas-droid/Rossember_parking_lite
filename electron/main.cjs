'use strict';
/**
 * main.cjs  —  Proceso principal de Electron
 *
 * Punto de entrada de la aplicación de escritorio. Responsable de:
 *  1. Inicializar la base de datos SQLite (db.cjs)
 *  2. Registrar todos los handlers IPC (handlers.cjs)
 *  3. Crear la ventana principal del navegador
 *
 * En desarrollo carga http://localhost:5173 (servidor Vite).
 * En producción carga dist/index.html (build estático).
 */

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { initDatabase } = require('./database/db.cjs');
const { registerHandlers } = require('./database/handlers.cjs');

// En desarrollo: electron lanza con un argumento script (process.defaultApp = true)
// En producción (empaquetado): process.defaultApp es undefined/false
const isDev = !!(process.defaultApp || /[\\/]electron[\\/]/.test(process.execPath));
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

  // Helper: ejecuta un comando shell de forma asíncrona sin bloquear el hilo principal
  const execAsync = (cmd) => new Promise((resolve) => {
    require('child_process').exec(cmd, { encoding: 'utf-8', timeout: 6000 }, (err, stdout) => {
      resolve(err ? '' : stdout);
    });
  });

  // 4a. Handler para listar impresoras reales del sistema con su puerto
  ipcMain.handle('app:getPrinters', async () => {
    try {
      // Las dos consultas en paralelo: Electron nativo + PowerShell para puertos
      const [systemPrinters, psOut] = await Promise.all([
        mainWindow.webContents.getPrintersAsync(),
        process.platform === 'win32'
          // -NoProfile -NonInteractive reduce el tiempo de inicio de PowerShell ~400 ms
          ? execAsync('powershell -NoProfile -NonInteractive -Command "Get-Printer | Select-Object Name,PortName | ConvertTo-Csv -NoTypeInformation"')
          : Promise.resolve(''),
      ]);

      const portMap = {};
      psOut.split('\n').slice(1).forEach(line => {
        const parts = line.replace(/"/g, '').split(',');
        if (parts.length >= 2) {
          const name = parts[0].trim();
          const port = parts[1].trim();
          if (name) portMap[name] = port;
        }
      });

      return systemPrinters.map(p => ({
        name: p.name,
        isDefault: p.isDefault,
        status: p.status,
        port: portMap[p.name] || null,
      }));
    } catch (err) {
      console.error('[Printers] Error:', err.message);
      return [];
    }
  });

  // 4b. Handler para listar puertos serie/COM disponibles en el sistema
  ipcMain.handle('app:getSerialPorts', async () => {
    if (process.platform !== 'win32') return [];
    try {
      const out = await execAsync(
        'powershell -NoProfile -NonInteractive -Command "Get-CimInstance Win32_SerialPort | Select-Object DeviceID,Name | ConvertTo-Csv -NoTypeInformation"'
      );
      const ports = [];
      out.split('\n').slice(1).forEach(line => {
        const parts = line.replace(/"/g, '').split(',');
        if (parts.length >= 2) {
          const id = parts[0].trim();
          const name = parts[1].trim();
          if (id) ports.push({ id, name });
        }
      });
      return ports;
    } catch {
      return [];
    }
  });

  // 4c. Handler de impresión nativa (Restauración v14: Sin Bloqueos)
  let printInProgress = false;

  ipcMain.handle('app:print', async (_event, { html, deviceName, paperWidth }) => {
    if (printInProgress) {
      console.log('[Print] ⚠️ Trabajo en curso — ignorando.');
      return { ok: false, error: 'Trabajo en curso' };
    }

    printInProgress = true;
    const pw = paperWidth || 80;
    // Ventana estándar para tiquetes (300px es seguro para 58mm y 80mm)
    const winW = 300;

    console.log(`[Print] 🖨️  Restauración v14: Imprimiendo en "${deviceName || '(predeterminada)'}"`);

    let workerWin = null;

    try {
      const dataUri = `data:text/html;base64,${Buffer.from(html).toString('base64')}`;

      workerWin = new BrowserWindow({
        show: false,
        width: winW,
        height: 600,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        },
      });

      workerWin.loadURL(dataUri);

      return new Promise((resolve) => {
        workerWin.webContents.once('did-finish-load', () => {
          console.log('[Print] ✅ HTML cargado — enviando a driver...');
          
          // Pequeño delay para renderizado de QR
          setTimeout(() => {
            if (!workerWin || workerWin.isDestroyed()) {
              printInProgress = false;
              return resolve({ ok: false, error: 'Ventana cerrada' });
            }

            workerWin.webContents.print(
              {
                silent: true,
                printBackground: true,
                deviceName: deviceName || '',
                margins: { marginType: 'default' } // 'default' es más compatible con XP-58
              },
              (success, failureReason) => {
                if (success) console.log('[Print] ✨ Tiquete enviado con éxito.');
                else console.error('[Print] ❌ Error driver:', failureReason);
                
                if (workerWin && !workerWin.isDestroyed()) workerWin.destroy();
                printInProgress = false;
                resolve({ ok: success, error: failureReason });
              }
            );
          }, 800);
        });

        workerWin.webContents.once('did-fail-load', (_e, _code, desc) => {
          console.error('[Print] ❌ Fallo carga:', desc);
          if (workerWin && !workerWin.isDestroyed()) workerWin.destroy();
          printInProgress = false;
          resolve({ ok: false, error: desc });
        });
      });

    } catch (err) {
      console.error('[Print] 💥 Error:', err.message);
      if (workerWin && !workerWin.isDestroyed()) workerWin.destroy();
      printInProgress = false;
      return { ok: false, error: err.message };
    }
  });

  // 4d. Handler para "Ver PDF": guarda el HTML en un archivo temporal
  ipcMain.handle('app:printToPDF', async (_event, { html }) => {
    try {
      const tmpPath = path.join(os.tmpdir(), `tiquete_${Date.now()}.html`);
      fs.writeFileSync(tmpPath, html, 'utf-8');
      await shell.openPath(tmpPath); // abre en el navegador/visor predeterminado de Windows
      return { ok: true };
    } catch (err) {
      console.error('[PDF] Error:', err.message);
      return { ok: false, error: err.message };
    }
  });

  app.on('activate', () => {
    // En macOS: re-crear ventana si se cierra pero la app sigue en el dock
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // En Windows/Linux cerrar todas las ventanas termina la app
  if (process.platform !== 'darwin') app.quit();
});
