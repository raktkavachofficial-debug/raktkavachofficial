export type UserRole = 'citizen' | 'donor' | 'hospital' | 'authority' | 'operator' | 'super_admin';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface UserProfile {
  id: string;
  fullName: string;
  role: UserRole;
  organization: string | null;
  district: string | null;
  state: string | null;
  abhaVerified: boolean;
}

export interface AuthResult {
  ok: boolean;
  error: string | null;
}

export interface BloodInventory {
  id: string;
  nodeId: string;
  bloodGroup: BloodGroup;
  component: string;
  unitsAvailable: number;
  unitsReserved: number;
  expiresAt: string;
  status: 'available' | 'shortage' | 'critical' | 'expired';
  updatedAt: string;
}

export interface EmergencyRequest {
  id: string;
  patientRef: string;
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  facility: string;
  district: string;
  priority: 'routine' | 'urgent' | 'critical';
  status: 'open' | 'broadcast' | 'acknowledged' | 'fulfilled' | 'cancelled';
  createdAt: string;
}

export interface BloodUnitMovement {
  id: string;
  unitId: string;
  fromNode: string;
  toNode: string;
  status: 'queued' | 'in_transit' | 'received' | 'delayed';
  eta: string | null;
  lastUpdatedAt: string;
}

export interface DemandForecast {
  id: string;
  region: string;
  bloodGroup: BloodGroup;
  horizonDays: number;
  projectedUnits: number;
  confidence: number;
  updatedAt: string;
}

export interface DonorWallet {
  donorId: string;
  bloodGroup: BloodGroup;
  credits: number;
  tier: 'new' | 'steady' | 'champion' | 'lifeline';
  nextEligibleAt: string | null;
  lastDonationAt: string | null;
}

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  role: UserRole;
  occurredAt: string;
}

export interface SystemMetric {
  label: string;
  value: string;
  change: string;
  status: 'healthy' | 'watch' | 'critical' | 'offline';
}

export interface CommandCenterData {
  profile: UserProfile | null;
  inventory: BloodInventory[];
  emergencies: EmergencyRequest[];
  movements: BloodUnitMovement[];
  forecasts: DemandForecast[];
  wallet: DonorWallet | null;
  audit: AuditEvent[];
  metrics: SystemMetric[];
}