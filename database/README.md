# 🗄️ Base de Datos SQLite — Rossember Parking Lite

Motor elegido: **SQLite** → genera un único archivo `.db` que va dentro del instalador `.exe`.

```
database/
├── migration.sql    ← Crea todas las tablas (SQLite puro)
├── schema.prisma    ← Esquema Prisma ORM para TypeScript
└── README.md        ← Este archivo
```

---

## ¿Por qué SQLite para el .exe?

| Ventaja | Detalle |
|---|---|
| **Un solo archivo** | `rossember_parking.db` va dentro del instalador |
| **Sin servidor** | No requiere instalar PostgreSQL, MySQL, etc. |
| **Rápido** | Para 1 sede con cientos de registros diarios es más que suficiente |
| **Backup simple** | Copiar el `.db` es hacer un backup completo |
| **Compatible** | Funciona perfecto con Electron + `better-sqlite3` |

---

## Opción A — Probar la BD ahora mismo (sin instalar nada)

Puedes verificar el SQL usando **DB Browser for SQLite** (gratis):

1. Descargar: [https://sqlitebrowser.org/dl/](https://sqlitebrowser.org/dl/)
2. Abrir el programa → **"New Database"** → guardar como `rossember_parking.db`
3. Ir a **"Execute SQL"**
4. Copiar y pegar todo el contenido de `migration.sql`
5. Clic en ▶️ **"Execute all"**
6. Ir a **"Browse Data"** → ver las tablas creadas con datos de ejemplo

---

## Opción B — Integrar con Prisma en el proyecto (recomendado para .exe)

### 1. Instalar Prisma
```bash
npm install prisma @prisma/client
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3
```

### 2. Copiar el schema
```bash
# Crear carpeta y mover el esquema
mkdir prisma
copy database\schema.prisma prisma\schema.prisma
```

### 3. Configurar el .env
Agregar al archivo `.env` existente en la raíz del proyecto:
```env
DATABASE_URL="file:./rossember_parking.db"
```

### 4. Crear la base de datos
```bash
npx prisma migrate dev --name inicio
```
Esto crea el archivo `rossember_parking.db` automáticamente.

### 5. Ver los datos en panel visual (opcional)
```bash
npx prisma studio
# Abre http://localhost:5555 — panel para ver y editar datos
```

---

## Opción C — Electron + SQLite para el .exe

Para compilar todo en un `.exe` con la BD incluida, la arquitectura sería:

```
Electron App (.exe)
├── Frontend (React + Vite)   ← Lo que ya tienes
├── Backend (Electron Main)   ← Proceso Node.js local
│   └── better-sqlite3        ← Lee/escribe en el .db
└── rossember_parking.db      ← Archivo de la BD (dentro del instalador)
```

### Pasos para Electron:
```bash
# Instalar Electron
npm install --save-dev electron electron-builder

# Instalar driver SQLite nativo para Node.js
npm install better-sqlite3
```

### Archivo `electron/main.js` básico:
```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');

let db;

app.whenReady().then(() => {
    // La BD se guarda en la carpeta de datos del usuario
    const dbPath = path.join(app.getPath('userData'), 'rossember_parking.db');
    db = new Database(dbPath);
    
    // Crear tablas si no existen (leer migration.sql)
    const fs = require('fs');
    const sql = fs.readFileSync(path.join(__dirname, '../database/migration.sql'), 'utf8');
    db.exec(sql);
    
    // Crear ventana principal
    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: { preload: path.join(__dirname, 'preload.js') }
    });
    win.loadFile('dist/index.html');
});

// Ejemplo de handler para registrar entrada
ipcMain.handle('registrar-entrada', (event, datos) => {
    const stmt = db.prepare(`
        INSERT INTO registros_vehiculos 
        (id_registro, id_parqueadero, placa, tipo_vehiculo, hora_entrada, estado)
        VALUES (?, ?, ?, ?, ?, 'ACTIVO')
    `);
    return stmt.run(datos.id, datos.id_parqueadero, datos.placa, datos.tipo_vehiculo, Date.now());
});
```

---

## Diferencias clave: SQLite vs PostgreSQL

| Característica | SQLite | PostgreSQL |
|---|---|---|
| **Instalación** | Ninguna | Requiere servidor |
| **Archivo** | Un solo `.db` | Servidor + archivos |
| **Múltiples PCs** | ❌ Un solo equipo | ✅ Red/Internet |
| **Usuarios simultáneos** | 1 activo (varios leen) | Ilimitados |
| **Tamaño máx. BD** | 281 TB (más que suficiente) | Sin límite práctico |
| **Para el .exe** | ✅ Perfecto | Complejo |

> [!NOTE]
> SQLite es la elección correcta para un **punto de venta único** empaquetado en `.exe`.  
> Si en el futuro necesitan **múltiples sedes conectadas en red**, se puede migrar a PostgreSQL/Supabase con el mismo esquema.

---

## Notas importantes

- **`hora_entrada` y `hora_salida`** se guardan como `INTEGER` (milisegundos Unix) — exactamente igual que `Date.now()` en JavaScript. Sin conversión necesaria.
- **`activo`, `es_prioritario`, `deja_casco`** etc. se guardan como `0` o `1` en SQLite (no hay tipo BOOLEAN nativo).
- **`capacidad_maxima = -1`** sigue significando ilimitado, igual que en el código actual.
- **El `.env`** y el archivo `.db` nunca deben subirse a GitHub. Verificar el `.gitignore`.
