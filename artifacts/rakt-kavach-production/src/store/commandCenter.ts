import type {
  AuthResult,
  AuditEvent,
  BloodInventory,
  BloodUnitMovement,
  CommandCenterData,
  DemandForecast,
  DonorWallet,
  EmergencyRequest,
  SystemMetric,
  UserProfile,
} from '@/types';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface AdapterResult<T> {
  data: T;
  error: string | null;
}

export interface CommandCenterAdapter {
  readonly configured: boolean;
  readonly url: string | null;
  getProfile(): Promise<AdapterResult<UserProfile | null>>;
  sendOtp(phone: string, abhaId: string): Promise<AuthResult>;
  verifyOtp(phone: string, otp: string): Promise<AuthResult>;
  signOut(): Promise<AuthResult>;
  listInventory(): Promise<AdapterResult<BloodInventory[]>>;
  listEmergencies(): Promise<AdapterResult<EmergencyRequest[]>>;
  listMovements(): Promise<AdapterResult<BloodUnitMovement[]>>;
  listForecasts(): Promise<AdapterResult<DemandForecast[]>>;
  getWallet(): Promise<AdapterResult<DonorWallet | null>>;
  listAudit(): Promise<AdapterResult<AuditEvent[]>>;
  listMetrics(): Promise<AdapterResult<SystemMetric[]>>;
  createEmergency(input: Omit<EmergencyRequest, 'id' | 'createdAt' | 'status'>): Promise<AdapterResult<EmergencyRequest | null>>;
  acknowledgeEmergency(id: string): Promise<AdapterResult<EmergencyRequest | null>>;
  subscribe(table: string, onChange: () => void): () => void;
}

const unavailable = <T>(value: T): AdapterResult<T> => ({
  data: value,
  error: 'Supabase connection required',
});

function buildRestUrl(base: string, table: string): string {
  return `${base.replace(/\/$/, '')}/rest/v1/${table}`;
}

function createRestReader<T>(configured: boolean, url: string | null, key: string | undefined, table: string, fallback: T) {
  return async (): Promise<AdapterResult<T>> => {
    if (!configured || !url || !key) return unavailable(fallback);
    try {
      const response = await fetch(buildRestUrl(url, table), {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        credentials: 'include',
      });
      if (!response.ok) return { data: fallback, error: `Supabase returned ${response.status}` };
      return { data: (await response.json()) as T, error: null };
    } catch {
      return { data: fallback, error: 'Unable to reach Supabase' };
    }
  };
}

export function createCommandCenterAdapter(): CommandCenterAdapter {
  const url = import.meta.env.VITE_SUPABASE_URL ?? null;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  const configured = Boolean(url && key);
  const supabase: SupabaseClient | null = configured && url && key
    ? createClient(url, key, {
        auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
      })
    : null;
  const getProfile = createRestReader<UserProfile | null>(configured, url, key, 'user_profiles', null);
  const listInventory = createRestReader<BloodInventory[]>(configured, url, key, 'blood_inventory', []);
  const listEmergencies = createRestReader<EmergencyRequest[]>(configured, url, key, 'emergency_requests', []);
  const listMovements = createRestReader<BloodUnitMovement[]>(configured, url, key, 'blood_unit_movements', []);
  const listForecasts = createRestReader<DemandForecast[]>(configured, url, key, 'demand_forecasts', []);
  const getWallet = createRestReader<DonorWallet | null>(configured, url, key, 'donor_wallets', null);
  const listAudit = createRestReader<AuditEvent[]>(configured, url, key, 'audit_events', []);
  const listMetrics = createRestReader<SystemMetric[]>(configured, url, key, 'system_metrics', []);

  return {
    configured,
    url,
    getProfile,
    async sendOtp(phone, abhaId) {
      if (!supabase) return { ok: false, error: 'Supabase connection required' };
      const result = await supabase.auth.signInWithOtp({
        phone,
        options: { data: { abha_id: abhaId } },
      });
      return result.error ? { ok: false, error: result.error.message } : { ok: true, error: null };
    },
    async verifyOtp(phone, otp) {
      if (!supabase) return { ok: false, error: 'Supabase connection required' };
      const result = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
      return result.error ? { ok: false, error: result.error.message } : { ok: true, error: null };
    },
    async signOut() {
      if (!supabase) return { ok: false, error: 'Supabase connection required' };
      const result = await supabase.auth.signOut();
      return result.error ? { ok: false, error: result.error.message } : { ok: true, error: null };
    },
    listInventory,
    listEmergencies,
    listMovements,
    listForecasts,
    getWallet,
    listAudit,
    listMetrics,
    async createEmergency(input) {
      if (!configured || !url || !key) return unavailable(null);
      try {
        const response = await fetch(buildRestUrl(url, 'emergency_requests'), {
          method: 'POST',
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          credentials: 'include',
          body: JSON.stringify(input),
        });
        if (!response.ok) return { data: null, error: `Supabase returned ${response.status}` };
        const rows = (await response.json()) as EmergencyRequest[];
        return { data: rows[0] ?? null, error: null };
      } catch {
        return { data: null, error: 'Unable to reach Supabase' };
      }
    },
    async acknowledgeEmergency(id) {
      if (!configured || !url || !key) return unavailable(null);
      try {
        const response = await fetch(`${buildRestUrl(url, 'emergency_requests')}?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          credentials: 'include',
          body: JSON.stringify({ status: 'acknowledged' }),
        });
        if (!response.ok) return { data: null, error: `Supabase returned ${response.status}` };
        const rows = (await response.json()) as EmergencyRequest[];
        return { data: rows[0] ?? null, error: null };
      } catch {
        return { data: null, error: 'Unable to reach Supabase' };
      }
    },
    subscribe(table, onChange) {
      if (!supabase) return () => undefined;
      const channel = supabase
        .channel(`rakt-kavach-${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => onChange())
        .subscribe();
      return () => { void supabase.removeChannel(channel); };
    },
  };
}

export async function loadCommandCenterData(adapter: CommandCenterAdapter): Promise<AdapterResult<CommandCenterData>> {
  const [profile, inventory, emergencies, movements, forecasts, wallet, audit, metrics] = await Promise.all([
    adapter.getProfile(),
    adapter.listInventory(),
    adapter.listEmergencies(),
    adapter.listMovements(),
    adapter.listForecasts(),
    adapter.getWallet(),
    adapter.listAudit(),
    adapter.listMetrics(),
  ]);
  const errors = [profile, inventory, emergencies, movements, forecasts, wallet, audit, metrics].map((item) => item.error).filter(Boolean);
  return {
    data: {
      profile: profile.data,
      inventory: inventory.data,
      emergencies: emergencies.data,
      movements: movements.data,
      forecasts: forecasts.data,
      wallet: wallet.data,
      audit: audit.data,
      metrics: metrics.data,
    },
    error: errors[0] ?? null,
  };
}

export const emptyCommandCenterData: CommandCenterData = {
  profile: null,
  inventory: [],
  emergencies: [],
  movements: [],
  forecasts: [],
  wallet: null,
  audit: [],
  metrics: [],
};