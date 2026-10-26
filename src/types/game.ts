export type MaterialType = 'rodas' | 'bancos' | 'motores';

export interface MaterialInfo {
  type: MaterialType;
  name: string;
  plural: string;
  iconName: string;
  color: string;
  neededPerCar: number;
  boxColor: string;
}

export const MATERIAL_CONFIG: Record<MaterialType, MaterialInfo> = {
  rodas: {
    type: 'rodas',
    name: 'Roda',
    plural: 'Rodas',
    iconName: 'Disc',
    color: '#3b82f6', // blue
    neededPerCar: 4,
    boxColor: '#1e3a8a',
  },
  bancos: {
    type: 'bancos',
    name: 'Banco',
    plural: 'Bancos',
    iconName: 'Armchair',
    color: '#10b981', // green
    neededPerCar: 2,
    boxColor: '#065f46',
  },
  motores: {
    type: 'motores',
    name: 'Motor',
    plural: 'Motores',
    iconName: 'Cog',
    color: '#f59e0b', // amber
    neededPerCar: 1,
    boxColor: '#b45309',
  },
};

export interface PalletItem {
  id: string;
  type: MaterialType;
  quantity: number;
}

export interface Truck {
  id: string;
  dockIndex: number; // 0 (Doca 1) or 1 (Doca 2)
  status: 'arriving' | 'docked' | 'unloading' | 'departing' | 'departed';
  cargo: PalletItem;
  progress: number; // 0 to 1 for animations
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  doorOpen: number; // 0 to 1
  waitTime: number;
  maxWaitTime: number;
  isUrgent?: boolean;
}

export interface RackSlot {
  id: string;
  code: string; // e.g., 'A1', 'A2', 'B1', etc.
  x: number;
  y: number;
  pallet: PalletItem | null;
  highlighted?: boolean;
}

export interface AssemblyBuffer {
  rodas: number;
  bancos: number;
  motores: number;
}

export interface CarAssemblyState {
  id: string;
  stage: number; // 0: Chassis, 1: Wheels added, 2: Seats added, 3: Engine added, 4: Body installed, 5: Completed drive off
  progress: number; // 0 to 100% within current stage or overall
  stalled: boolean;
  stalledMaterial: MaterialType | null;
  carColor: string;
  x: number;
  y: number;
  wheelsAttached: number;
  seatsAttached: number;
  engineAttached: boolean;
}

export interface ForkliftTask {
  id: string;
  type: 'unload_truck' | 'feed_line';
  source: { type: 'truck' | 'rack'; id: string; x: number; y: number };
  target: { type: 'rack' | 'assembly'; id: string; x: number; y: number };
  cargo: PalletItem;
}

export interface Forklift {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  angle: number;
  state: 'idle' | 'moving_to_pickup' | 'picking_up' | 'moving_to_drop' | 'dropping' | 'maintenance';
  currentCargo: PalletItem | null;
  forkHeight: number; // 0 (down) to 1 (up)
  speed: number;
  isUnderMaintenance: boolean;
  maintenanceTimer: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  scale: number;
  velocityY: number;
  life: number;
  maxLife: number;
}

export interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  life: number;
}

export interface GamePhase {
  phaseNumber: number;
  title: string;
  subtitle: string;
  durationSeconds: number;
  targetCars: number;
  truckFrequencySeconds: number;
  maxWarehouseSlots: number;
  lineSpeedMultiplier: number;
  description: string;
  learningFocus: string;
}

export interface SurpriseEvent {
  id: string;
  title: string;
  badge: string;
  description: string;
  timeLimitSeconds: number;
  options: {
    id: string;
    text: string;
    consequenceText: string;
    action: 'expedite_supplier' | 'slow_conveyor' | 'wait' | 'safe_maintenance' | 'backup_pallet_jack' | 'unsafe_ignore' | 'accept_early' | 'reject_early';
    scoreBonus?: number;
    scorePenalty?: number;
    isSafeOption?: boolean;
  }[];
}

export interface GameStats {
  score: number;
  carsCompleted: number;
  downtimeSeconds: number;
  totalTimeSeconds: number;
  jitDeliveriesCount: number;
  stockOverloadSeconds: number;
  penaltiesCount: number;
  eventsResolved: number;
}
