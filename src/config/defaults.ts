/**
 * defaults.ts
 * Valores por defecto del sistema de parqueadero.
 *
 * Centraliza todas las constantes de configuración inicial para que App.tsx
 * no mezcle lógica de negocio con datos de configuración. Si necesitas cambiar
 * un valor por defecto (p.ej. capacidad inicial, tarifa base), este es el
 * único lugar donde hacerlo.
 */

import { VehicleType, Floor } from '../types';

// ── Capacidades por defecto (un piso, por tipo de vehículo) ─────────────────
export const DEFAULT_CAPACITIES = {
  REGULAR_CAR: 10,
  PRIORITY_CAR: 5,
  MOTO: 5,
  EV_CHARGING: 5,
  BICYCLE: 10,
};

// ── Prefijos de numeración de puestos ───────────────────────────────────────
// C = Carro regular, P = Prioritario, M = Moto, E = Eléctrico, B = Bicicleta
export const DEFAULT_PREFIXES = {
  REGULAR_CAR: 'C',
  PRIORITY_CAR: 'P',
  MOTO: 'M',
  EV_CHARGING: 'E',
  BICYCLE: 'B',
};

// ── Piso inicial ─────────────────────────────────────────────────────────────
export const DEFAULT_FLOORS: Floor[] = [
  {
    id: 'floor-1',
    name: 'Piso 1',
    capacities: DEFAULT_CAPACITIES,
    prefixes: DEFAULT_PREFIXES,
  },
];

// ── Tarifas por defecto (COP) ────────────────────────────────────────────────
// Claves de tipo VehicleType: tarifa por minuto
// Claves string especiales: topes, descuentos, IVA y período de gracia
export const DEFAULT_RATES: Record<string, number> = {
  [VehicleType.CAR]:        85,
  [VehicleType.MOTORCYCLE]: 55,
  [VehicleType.BICYCLE]:    30,
  [VehicleType.ELECTRIC]:   100,
  [VehicleType.UNKNOWN]:    85,
  CAR_FULL:                  35000,  // Tope tarifa plena diaria - carro
  MOTO_FULL:                 18000,  // Tope tarifa plena diaria - moto
  BICYCLE_FULL:              8000,   // Tope tarifa plena diaria - bicicleta
  EV_CHARGING_RATE:          120,    // Tarifa/min vehículo eléctrico con carga
  DISABILITY_DISCOUNT_PERCENT: 50,  // % descuento accesibilidad
  GRACE_PERIOD_MINUTES:      15,    // Minutos de gracia sin cobro
  IVA_ENABLED:               0,     // 0 = deshabilitado, 1 = habilitado
  IVA_RATE:                  19,    // % IVA cuando está habilitado
};

// ── Credenciales de administrador ───────────────────────────────────────────
// Se leen desde variables de entorno (.env). Si no están definidas, se usan
// los valores de fallback. Para producción, SIEMPRE configurar las variables
// VITE_ADMIN_USERNAME y VITE_ADMIN_PASSWORD en el entorno o GitHub Secrets.
export const ADMIN_CREDENTIALS = {
  username: import.meta.env.VITE_ADMIN_USERNAME || 'admin',
  password: import.meta.env.VITE_ADMIN_PASSWORD || 'admin123',
};
