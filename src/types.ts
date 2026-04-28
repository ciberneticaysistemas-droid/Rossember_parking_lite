export enum VehicleType {
  CAR = 'Carro',
  MOTORCYCLE = 'Moto',
  BICYCLE = 'Bicicleta',
  ELECTRIC = 'Eléctrico',
  UNKNOWN = 'Desconocido'
}


export interface Floor {
  id: string;
  name: string;
  mapImageUrl?: string;
  capacities: {
    REGULAR_CAR: number;
    PRIORITY_CAR: number;
    MOTO: number;
    EV_CHARGING: number;
    BICYCLE?: number;
  };
  prefixes: {
    REGULAR_CAR: string;
    PRIORITY_CAR: string;
    MOTO: string;
    EV_CHARGING: string;
    BICYCLE?: string;
  };
}

export interface ParkingRecord {
  id: string;
  plate: string;
  ownerId?: string; // Document ID (C.C.)
  vehicleType: VehicleType;
  floorId?: string; // Optional for backward compatibility, required for new records
  entryTime: number; // Timestamp
  exitTime?: number; // Timestamp
  status: 'ACTIVE' | 'COMPLETED';
  cost?: number;
  paymentStatus?: 'PENDING' | 'PAID' | 'MANUAL_OVERRIDE';
  paymentMethod?: string; // e.g., 'PSE - Bancolombia'
  isDisabled?: boolean; // Flag for disability/priority parking
  spotNumber?: string; // e.g., 'C-001', 'P-001', 'M-001', 'E-001'
  requiresCharging?: boolean; // Flag for EV charging station requirement
  vehicleState?: 'BUENO' | 'REGULAR' | 'MALO';
  vehicleComment?: string;
  leavesHelmet?: boolean;
  helmetDescription?: string;
  helmetLocation?: string;
}


export enum SpecialRateType {
  MONTHLY = 'Mensualidad',
  DISCOUNT = 'Descuento',
  EMPLOYEE = 'Empleado',
  OTHER = 'Otro'
}

export interface SpecialRate {
  id: string;
  plate: string;
  ownerId?: string; // Cédula/ID
  type: SpecialRateType;
  value: number; // For discount percentage (0-100) or Monthly paid value
  description?: string;
  expirationDate?: number; // Timestamp
  isActive: boolean;
}

export interface BannedVehicle {
  plate: string;
  reason: string;
  createdAt: number;
}

export interface HardwareScannerConfig {
  enabled: boolean;
  prefix?: string;
  suffix?: string;
  captureGlobally: boolean;
}

export interface DocumentConfig {
  businessName: string;
  nit: string;
  address: string;
  phone: string;
  legalInfo: string;
  ticketFooter: string;
  invoiceFooter: string;
  showWatermark: boolean;
}

export interface KeyboardShortcutsConfig {
  registerEntry: string;
  focusPlateInput: string;
  toggleCar: string;
  toggleMoto: string;
  toggleBike: string;
  toggleAccessibility: string;
  focusSearch: string;
  openScanner: string;
  confirmPayment: string;
  switchToEntry: string;
  switchToExit: string;
  printDocument: string;
  toggleHelmet: string;
}

export const DEFAULT_SHORTCUTS: KeyboardShortcutsConfig = {
  registerEntry: 'F2',
  focusPlateInput: 'F3',
  toggleCar: 'F4',
  toggleMoto: 'F5',
  toggleBike: 'F6',
  toggleAccessibility: 'F7',
  focusSearch: 'F8',
  openScanner: 'F9',
  confirmPayment: 'F10',
  switchToEntry: 'F1',
  switchToExit: 'F12',
  printDocument: 'F11',
  toggleHelmet: 'Alt+H',
};

export interface LicenseConfig {
  expirationDate: number | null; // ms timestamp, si es null no hay limite
  unlockPassword?: string; // default será "licenciavelvetsoftware"
  isActive: boolean; // para habilitarlo o deshabilitarlo facilmente
}

export interface SecurityConfig {
  masterPassword?: string; // Por defecto adminvelvet
  ratesPassword?: string;  // Por defecto tarifasvelvet
  specialRatesPassword?: string; // Por defecto tarifasespecialesvelvet
}
