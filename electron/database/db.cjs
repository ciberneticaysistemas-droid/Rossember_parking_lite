'use strict';
/**
 * db.cjs  —  Inicialización y conexión SQLite (Electron / backend)
 *
 * Abre (o crea) la base de datos SQLite usando better-sqlite3.
 * - Desarrollo: archivo junto al proyecto (rossember_parking.db)
 * - Producción: carpeta userData del sistema operativo
 *
 * Ejecuta migration.sql en cada arranque (idempotente gracias a IF NOT EXISTS),
 * activa claves foráneas y modo WAL para mejor rendimiento en lectura concurrente.
 *
 * Exporta: initDatabase(), getDatabase(), getParqueaderoId()
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db = null;

// ID del parqueadero por defecto (debe coincidir con migration.sql)
const PARQUEADERO_ID = 'park-default-0001';

function getDbPath() {
  // En desarrollo: junto al proyecto. En producción: carpeta userData del usuario.
  const { app } = require('electron');
  const isPackaged = !!(app && app.isPackaged);
  if (!isPackaged) {
    return path.join(__dirname, '../../rossember_parking.db');
  }
  return path.join(app.getPath('userData'), 'rossember_parking.db');
}

function getMigrationSql() {
  const migrationPath = path.join(__dirname, '../../database/migration.sql');
  if (!fs.existsSync(migrationPath)) {
    throw new Error(`No se encontró migration.sql en: ${migrationPath}`);
  }
  return fs.readFileSync(migrationPath, 'utf8');
}

function initDatabase() {
  const dbPath = getDbPath();
  console.log('[DB] Iniciando base de datos en:', dbPath);

  db = new Database(dbPath);

  // Activar claves foráneas y modo WAL (mayor rendimiento)
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  // Crear tablas si no existen (idempotente por los IF NOT EXISTS)
  const migrationSql = getMigrationSql();
  db.exec(migrationSql);

  console.log('[DB] ✅ Base de datos lista. Tablas verificadas.');
  return db;
}

function getDatabase() {
  if (!db) {
    throw new Error('[DB] Base de datos no inicializada. Llama a initDatabase() primero.');
  }
  return db;
}

function getParqueaderoId() {
  return PARQUEADERO_ID;
}

module.exports = { initDatabase, getDatabase, getParqueaderoId };
