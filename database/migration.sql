-- ============================================================
--  ROSSEMBER PARKING LITE — Script SQLite
--  Motor: SQLite 3 (archivo único .db)
--  Compatible con: Electron + better-sqlite3 / Tauri + SQLite
--
--  NOTAS SQLite vs PostgreSQL:
--  - UUID: Se genera desde la app (Prisma o randomUUID() de JS)
--  - BOOLEAN: Se guarda como 0/1 (INTEGER)
--  - TIMESTAMP: Se guarda como texto ISO-8601 o INTEGER (Unix ms)
--  - No existe DECIMAL → usar REAL o NUMERIC
--  - No existe gen_random_uuid() → se genera desde la aplicación
-- ============================================================

PRAGMA foreign_keys = ON;
-- SQLite no activa las claves foráneas por defecto. SIEMPRE activar.

PRAGMA journal_mode = WAL;
-- WAL mejora la velocidad en lecturas/escrituras concurrentes.

-- ─────────────────────────────────────────────────────────────
-- 1. PARQUEADERO — Datos del negocio
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parqueadero (
    id_parqueadero  TEXT    PRIMARY KEY,           -- UUID generado por la app
    nombre_negocio  TEXT    NOT NULL,
    nit             TEXT,
    direccion       TEXT,
    telefono        TEXT,
    activo          INTEGER NOT NULL DEFAULT 1,    -- 1=TRUE, 0=FALSE
    fecha_creacion  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────────────────────
-- 2. USUARIOS ADMIN — Credenciales del administrador
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios_admin (
    id_usuario      TEXT    PRIMARY KEY,
    id_parqueadero  TEXT    NOT NULL REFERENCES parqueadero(id_parqueadero) ON DELETE CASCADE,
    usuario         TEXT    NOT NULL UNIQUE,
    contrasena_hash TEXT    NOT NULL,   -- bcrypt. NUNCA en texto plano.
    -- Roles: 'superadmin' | 'admin' | 'operario'
    rol             TEXT    NOT NULL DEFAULT 'admin',
    activo          INTEGER NOT NULL DEFAULT 1,
    fecha_creacion  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────────────────────
-- 3. PISOS — Sectores del parqueadero (Piso 1, Sótano, etc.)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pisos (
    id_piso         TEXT    PRIMARY KEY,
    id_parqueadero  TEXT    NOT NULL REFERENCES parqueadero(id_parqueadero) ON DELETE CASCADE,
    nombre          TEXT    NOT NULL,   -- 'Piso 1', 'Sótano A', 'Torre Norte'
    orden           INTEGER NOT NULL DEFAULT 0,
    activo          INTEGER NOT NULL DEFAULT 1
);

-- ─────────────────────────────────────────────────────────────
-- 4. CAPACIDADES PISO — Cuántos espacios por tipo de vehículo
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS capacidades_piso (
    id_capacidad        TEXT    PRIMARY KEY,
    id_piso             TEXT    NOT NULL REFERENCES pisos(id_piso) ON DELETE CASCADE,
    -- Tipos: 'CARRO_REGULAR' | 'CARRO_PRIORITARIO' | 'MOTO' | 'CARGA_ELECTRICA' | 'BICICLETA'
    tipo_vehiculo       TEXT    NOT NULL,
    -- -1 = Ilimitado (muestra ∞ en la pantalla)
    capacidad_maxima    INTEGER NOT NULL,
    -- Letra: 'C'=Carro | 'P'=Prioritario | 'M'=Moto | 'E'=Eléctrico | 'B'=Bicicleta
    prefijo_puesto      TEXT    NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- 5. TARIFAS ESPECIALES — Mensualidades y descuentos por placa
--    (Va antes de registros_vehiculos por la referencia de FK)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tarifas_especiales (
    id_tarifa           TEXT    PRIMARY KEY,
    id_parqueadero      TEXT    NOT NULL REFERENCES parqueadero(id_parqueadero),
    placa               TEXT    NOT NULL,
    cedula_propietario  TEXT,
    -- Tipos: 'Mensualidad' | 'Descuento' | 'Empleado' | 'Otro'
    tipo_tarifa         TEXT    NOT NULL,
    -- Si Mensualidad: valor pagado. Si Descuento/Empleado: porcentaje 0-100
    valor               REAL    NOT NULL,
    descripcion         TEXT,
    -- NULL = sin vencimiento
    fecha_vencimiento   TEXT,
    activa              INTEGER NOT NULL DEFAULT 1,
    fecha_creacion      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tarifas_placa ON tarifas_especiales (placa, activa);

-- ─────────────────────────────────────────────────────────────
-- 6. REGISTROS VEHICULOS ⭐ — LA TABLA MÁS IMPORTANTE
--    Cada fila = un vehículo que entró al parqueadero
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS registros_vehiculos (
    id_registro                 TEXT    PRIMARY KEY,  -- Este UUID va codificado en el tiquete QR
    id_parqueadero              TEXT    NOT NULL REFERENCES parqueadero(id_parqueadero),
    id_piso                     TEXT    REFERENCES pisos(id_piso),

    -- Datos del vehículo
    placa                       TEXT    NOT NULL,     -- 'ABC123' | 'XYZ12A'
    cedula_propietario          TEXT,                 -- Cédula, opcional
    -- Valores: 'Carro' | 'Moto' | 'Bicicleta' | 'Eléctrico'
    tipo_vehiculo               TEXT    NOT NULL,
    numero_puesto               TEXT,                 -- 'C-001' | 'P1-M-003' | 'E-002'

    -- Tiempos (en milisegundos Unix, igual que Date.now() en JS)
    hora_entrada                INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
    hora_salida                 INTEGER,              -- NULL mientras está dentro

    -- Estado del registro
    -- Valores: 'ACTIVO' | 'COMPLETADO'
    estado                      TEXT    NOT NULL DEFAULT 'ACTIVO',

    -- Características del ingreso
    es_prioritario              INTEGER NOT NULL DEFAULT 0, -- 1=discapacidad→descuento auto
    requiere_carga_electrica    INTEGER NOT NULL DEFAULT 0, -- 1=puesto EV

    -- Estado físico del vehículo al entrar
    -- Valores: 'BUENO' | 'REGULAR' | 'MALO'
    estado_vehiculo             TEXT,
    observaciones               TEXT,   -- 'Rayón en puerta derecha'

    -- Custodia de casco (solo motos)
    deja_casco                  INTEGER NOT NULL DEFAULT 0,
    descripcion_casco           TEXT,   -- 'Casco negro AGV talla M'

    -- Cobro
    costo_total                 REAL,   -- Valor final (con IVA si aplica)
    costo_sin_descuento         REAL,   -- Antes del descuento (para mostrar diferencia)
    valor_iva                   REAL    DEFAULT 0,
    -- Valores: 'PENDIENTE' | 'PAGADO' | 'ANULADO_ADMIN'
    estado_pago                 TEXT,
    -- Valores: 'Efectivo' | 'Tarjeta' | 'Nequi' | 'Manual - Admin' | 'GRACIA'
    metodo_pago                 TEXT,

    -- Tarifa especial aplicada (si tuvo)
    id_tarifa_especial          TEXT    REFERENCES tarifas_especiales(id_tarifa),
    etiqueta_tarifa_especial    TEXT,   -- 'Mensualidad Activa' | 'Empleado: 30%'

    fecha_registro              TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Índices para búsquedas frecuentes (placa, estado activo, fechas)
CREATE INDEX IF NOT EXISTS idx_registros_placa   ON registros_vehiculos (placa, estado);
CREATE INDEX IF NOT EXISTS idx_registros_entrada ON registros_vehiculos (hora_entrada DESC);
CREATE INDEX IF NOT EXISTS idx_registros_sede    ON registros_vehiculos (id_parqueadero, estado);
CREATE INDEX IF NOT EXISTS idx_registros_salida  ON registros_vehiculos (hora_salida DESC);

-- ─────────────────────────────────────────────────────────────
-- 7. TRANSACCIONES PAGO — Detalle del cobro en taquilla
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transacciones_pago (
    id_transaccion      TEXT    PRIMARY KEY,
    id_registro         TEXT    NOT NULL REFERENCES registros_vehiculos(id_registro),
    -- 'Efectivo' | 'Tarjeta' | 'Nequi'
    metodo_pago         TEXT,
    monto_pagado        REAL    NOT NULL,
    monto_iva           REAL    NOT NULL DEFAULT 0,
    efectivo_recibido   REAL,   -- Cuánto entregó el cliente (solo Efectivo)
    cambio_entregado    REAL,   -- Vueltas dadas (solo Efectivo)
    estado              TEXT    NOT NULL DEFAULT 'PAGADO',
    fecha_pago          TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────────────────────
-- 8. VEHICULOS VETADOS — Lista negra
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehiculos_vetados (
    id_veto         TEXT    PRIMARY KEY,
    id_parqueadero  TEXT    NOT NULL REFERENCES parqueadero(id_parqueadero),
    placa           TEXT    NOT NULL,
    motivo_veto     TEXT    NOT NULL,
    vetado_por      TEXT    REFERENCES usuarios_admin(id_usuario),
    fecha_veto      TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE (id_parqueadero, placa)  -- Una placa no puede vetarse dos veces en la misma sede
);

-- ─────────────────────────────────────────────────────────────
-- 9. CONFIGURACION TARIFAS — Precios del parqueadero
-- ─────────────────────────────────────────────────────────────
-- Equivalencia con parkingRates (localStorage):
--   'Carro'                      → tarifa_carro_por_minuto
--   'CAR_FULL'                   → tarifa_plena_carro_dia
--   'Moto'                       → tarifa_moto_por_minuto
--   'MOTO_FULL'                  → tarifa_plena_moto_dia
--   'Bicicleta'                  → tarifa_bicicleta_por_minuto
--   'BICYCLE_FULL'               → tarifa_plena_bicicleta_dia
--   'EV_CHARGING_RATE'           → tarifa_carga_electrica_por_minuto
--   'DISABILITY_DISCOUNT_PERCENT'→ porcentaje_descuento_prioritario
--   'GRACE_PERIOD_MINUTES'       → minutos_gracia
--   'IVA_ENABLED'                → iva_habilitado
--   'IVA_RATE'                   → porcentaje_iva
CREATE TABLE IF NOT EXISTS configuracion_tarifas (
    id_config                           TEXT    PRIMARY KEY,
    id_parqueadero                      TEXT    NOT NULL UNIQUE REFERENCES parqueadero(id_parqueadero),
    tarifa_carro_por_minuto             REAL    NOT NULL DEFAULT 85,
    tarifa_plena_carro_dia              REAL    NOT NULL DEFAULT 35000,
    tarifa_moto_por_minuto              REAL    NOT NULL DEFAULT 55,
    tarifa_plena_moto_dia               REAL    NOT NULL DEFAULT 18000,
    tarifa_bicicleta_por_minuto         REAL    NOT NULL DEFAULT 30,
    tarifa_plena_bicicleta_dia          REAL    NOT NULL DEFAULT 8000,
    tarifa_carga_electrica_por_minuto   REAL    NOT NULL DEFAULT 120,
    porcentaje_descuento_prioritario    REAL    NOT NULL DEFAULT 50,
    minutos_gracia                      INTEGER NOT NULL DEFAULT 15,
    iva_habilitado                      INTEGER NOT NULL DEFAULT 0, -- 0=NO, 1=SÍ
    porcentaje_iva                      REAL    NOT NULL DEFAULT 19,
    ultima_actualizacion                TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────────────────────
-- 10. CONFIGURACION DOCUMENTOS — Datos para tiquetes y facturas
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS configuracion_documentos (
    id_config           TEXT    PRIMARY KEY,
    id_parqueadero      TEXT    NOT NULL UNIQUE REFERENCES parqueadero(id_parqueadero),
    nombre_empresa      TEXT    DEFAULT 'Rossember Parking',
    nit                 TEXT,
    direccion           TEXT,
    telefono            TEXT,
    info_legal          TEXT,     -- 'SISTEMA INTEGRAL DE GESTIÓN DE PARQUEADERO'
    pie_tiquete         TEXT,     -- Texto al pie del tiquete QR de entrada
    pie_factura         TEXT,     -- Texto al pie de la factura de salida
    mostrar_marca_agua  INTEGER NOT NULL DEFAULT 1,
    logo_base64         TEXT      -- Logo del cliente en Base64 (clientLogo)
);

-- ─────────────────────────────────────────────────────────────
-- 11. CONFIGURACION IMPRESORA — Impresora Térmica
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS configuracion_impresora (
    id_config               TEXT    PRIMARY KEY,
    id_parqueadero          TEXT    NOT NULL UNIQUE REFERENCES parqueadero(id_parqueadero),
    nombre_impresora        TEXT    DEFAULT 'Impresora Térmica',
    -- 'USB' | 'NETWORK' | 'BLUETOOTH'
    tipo_conexion           TEXT    NOT NULL DEFAULT 'USB',
    direccion_ip            TEXT,   -- Solo si tipo_conexion = 'NETWORK'
    puerto                  INTEGER DEFAULT 9100,
    -- 58 | 80 | 104 | 216 (mm)
    ancho_papel_mm          INTEGER NOT NULL DEFAULT 80,
    -- 'TICKET' | 'HALF' | 'LETTER' | 'A4'
    formato_papel           TEXT    NOT NULL DEFAULT 'TICKET',
    impresion_automatica    INTEGER NOT NULL DEFAULT 0 -- 0=NO, 1=SÍ
);

-- ─────────────────────────────────────────────────────────────
-- 12. CONFIGURACION ESCANER — Lector QR/Barras externo (HID)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS configuracion_escaner (
    id_config       TEXT    PRIMARY KEY,
    id_parqueadero  TEXT    NOT NULL UNIQUE REFERENCES parqueadero(id_parqueadero),
    habilitado      INTEGER NOT NULL DEFAULT 0,
    prefijo         TEXT,                       -- Caracteres antes del dato
    sufijo          TEXT    DEFAULT 'Enter',    -- Caracter de fin de lectura
    captura_global  INTEGER NOT NULL DEFAULT 1  -- 1 = desde cualquier pantalla
);

-- ─────────────────────────────────────────────────────────────
-- 13. ATAJOS TECLADO — Teclas de acceso rápido F1-F12
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS atajos_teclado (
    id_config               TEXT    PRIMARY KEY,
    id_parqueadero          TEXT    NOT NULL UNIQUE REFERENCES parqueadero(id_parqueadero),
    registrar_entrada       TEXT    NOT NULL DEFAULT 'F2',
    enfocar_campo_placa     TEXT    NOT NULL DEFAULT 'F3',
    seleccionar_carro       TEXT    NOT NULL DEFAULT 'F4',
    seleccionar_moto        TEXT    NOT NULL DEFAULT 'F5',
    seleccionar_bicicleta   TEXT    NOT NULL DEFAULT 'F6',
    activar_prioritario     TEXT    NOT NULL DEFAULT 'F7',
    enfocar_busqueda        TEXT    NOT NULL DEFAULT 'F8',
    abrir_escaner           TEXT    NOT NULL DEFAULT 'F9',
    confirmar_pago          TEXT    NOT NULL DEFAULT 'F10',
    cambiar_a_entrada       TEXT    NOT NULL DEFAULT 'F1',
    cambiar_a_salida        TEXT    NOT NULL DEFAULT 'F12',
    imprimir_documento      TEXT    NOT NULL DEFAULT 'F11'
);

-- ─────────────────────────────────────────────────────────────
-- 14. CONFIGURACION LICENCIA — Bloqueo por fecha (time bomb)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS configuracion_licencia (
    id_config               TEXT    PRIMARY KEY,
    id_parqueadero          TEXT    NOT NULL UNIQUE REFERENCES parqueadero(id_parqueadero),
    activa                  INTEGER NOT NULL DEFAULT 0, -- 0=NO bloquea, 1=SÍ bloquea
    -- Fecha de expiración en milisegundos Unix (igual que Date.now() en JS)
    fecha_expiracion        INTEGER,          -- NULL = sin límite
    contrasena_desbloqueo   TEXT    DEFAULT '12345'
);

-- ============================================================
--  DATOS INICIALES POR DEFECTO
--  Se insertan automáticamente al crear la BD por primera vez
-- ============================================================

-- 1. Parqueadero principal
-- Los UUIDs en SQLite los genera la aplicación. Aquí usamos valores de ejemplo.
INSERT OR IGNORE INTO parqueadero (id_parqueadero, nombre_negocio, nit, direccion, telefono)
VALUES (
    'park-default-0001',
    'Rossember Parking',
    '900.123.456-7',
    'Calle Ficticia 123, Bogotá',
    '300 123 4567'
);

-- 2. Usuario administrador por defecto
-- hash corresponde a 'admin123'. CAMBIAR EN PRODUCCIÓN.
INSERT OR IGNORE INTO usuarios_admin (id_usuario, id_parqueadero, usuario, contrasena_hash, rol)
VALUES (
    'user-admin-0001',
    'park-default-0001',
    'admin',
    '$2b$10$placeholder_hash_cambiar',
    'admin'
);

-- 3. Piso 1 por defecto
INSERT OR IGNORE INTO pisos (id_piso, id_parqueadero, nombre, orden)
VALUES ('piso-default-0001', 'park-default-0001', 'Piso 1', 1);

-- 4. Capacidades del Piso 1 (igual que DEFAULT_CAPACITIES en App.tsx)
INSERT OR IGNORE INTO capacidades_piso (id_capacidad, id_piso, tipo_vehiculo, capacidad_maxima, prefijo_puesto) VALUES
    ('cap-001', 'piso-default-0001', 'CARRO_REGULAR',    10, 'C'),
    ('cap-002', 'piso-default-0001', 'CARRO_PRIORITARIO', 5, 'P'),
    ('cap-003', 'piso-default-0001', 'MOTO',              5, 'M'),
    ('cap-004', 'piso-default-0001', 'CARGA_ELECTRICA',   5, 'E'),
    ('cap-005', 'piso-default-0001', 'BICICLETA',        10, 'B');

-- 5. Tarifas por defecto (igual que DEFAULT_RATES en App.tsx)
INSERT OR IGNORE INTO configuracion_tarifas (id_config, id_parqueadero)
VALUES ('cfg-tarifas-0001', 'park-default-0001');

-- 6. Documentos por defecto
INSERT OR IGNORE INTO configuracion_documentos (
    id_config, id_parqueadero, nombre_empresa, nit, direccion, telefono,
    info_legal, pie_tiquete, pie_factura
) VALUES (
    'cfg-docs-0001',
    'park-default-0001',
    'Rossember Parking',
    '900.123.456-7',
    'Calle Ficticia 123, Bogotá',
    '300 123 4567',
    'SISTEMA INTEGRAL DE GESTIÓN DE PARQUEADERO',
    'Conserve este tiquete. Se requiere para registrar la salida.',
    'Gracias por su visita. Este documento es equivalente a factura.'
);

-- 7. Atajos de teclado por defecto
INSERT OR IGNORE INTO atajos_teclado (id_config, id_parqueadero)
VALUES ('cfg-atajos-0001', 'park-default-0001');

-- 8. Escáner deshabilitado por defecto
INSERT OR IGNORE INTO configuracion_escaner (id_config, id_parqueadero)
VALUES ('cfg-escaner-0001', 'park-default-0001');

-- 9. Licencia desactivada por defecto (sin bloqueo)
INSERT OR IGNORE INTO configuracion_licencia (id_config, id_parqueadero)
VALUES ('cfg-licencia-0001', 'park-default-0001');

-- ============================================================
--  VERIFICACIÓN — Ejecutar para confirmar que todo se creó bien
-- ============================================================
-- SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
