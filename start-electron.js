#!/usr/bin/env node
// Helper script para lanzar Electron con el binario local
// Evita problemas de PATH en Windows con el CLI de npm

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const electronPath = path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron.exe');

if (!fs.existsSync(electronPath)) {
  console.error('[start-electron] ERROR: No se encontró el binario de Electron en:', electronPath);
  process.exit(1);
}

console.log('[start-electron] Lanzando Electron desde:', electronPath);

const extEnv = { ...process.env };
delete extEnv.ELECTRON_RUN_AS_NODE;

const child = spawn(electronPath, ['.'], {
  stdio: 'inherit',
  cwd: __dirname,
  env: extEnv,
  windowsHide: false,
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});
