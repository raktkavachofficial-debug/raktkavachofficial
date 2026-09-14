import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { Toaster } from './components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { createCommandCenterAdapter, emptyCommandCenterData, loadCommandCenterData } from '@/store/commandCenter';
import type { BloodGroup, CommandCenterData, UserRole } from '@/types';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Database,
  FileCheck2,
  Globe2,
  HeartPulse,
  LayoutDashboard,
  LockKeyhole,
  MapPin,
  Menu,
  PackageCheck,
  QrCode,
  Radio,
  RefreshCcw,
  Route,
  Search,
  Settings2,
  Shield,
  Siren,
  Smartphone,
  Stethoscope,
  Users,
  WifiOff,
  X,
} from 'lucide-react';
import { Link, Route as WouterRoute, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();
const adapter = createCommandCenterAdapter();

const navItems = [
  { href: '/dashboard', label: 'Command dashboard', short: 'Home', icon: LayoutDashboard },
  { href: '/donor', label: 'Donor wallet', short: 'Donor', icon: HeartPulse },
  { href: '/inventory', label: 'Blood inventory', short: 'Stock', icon: Boxes },
  { href: '/tracking', label: 'Unit tracking', short: 'Track', icon: Route },
  { href: '/emergency', label: 'Emergency desk', short: 'SOS', icon: Siren },
  { href: '/command-center', label: 'National command', short: 'Nation', icon: Globe2 },
  { href: '/admin', label: 'Super Admin', short: 'Admin', icon: Settings2 },
];

function useCommandCenter() {
  const [data, setData] = useState<CommandCenterData>(emptyCommandCenterData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(adapter.configured ? null : 'Supabase connection required');

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      setLoading(true);
      const result = await loadCommandCenterData(adapter);
      if (!active) return;
      setData(result.data);
      setError(result.error);
      setLoading(false);
    };
    void refresh();
    const unsubscribe = ['blood_inventory', 'emergency_requests', 'blood_unit_movements', 'demand_forecasts', 'system_metrics']
      .map((table) => adapter.subscribe(table, () => void refresh()));
    return () => {
      active = false;
      unsubscribe.forEach((stop) => stop());
    };
  }, []);

  return { data, loading, error, refresh: () => loadCommandCenterData(adapter).then((result) => { setData(result.data); setError(result.error); }) };
}

function StatusPill({ children, tone = 'info' }: { children: ReactNode; tone?: 'live' | 'alert' | 'info' }) {
  return <span className={`rk-status ${tone}`}><span className="status-dot" style={{ background: tone === 'alert' ? '#ff1744' : tone === 'live' ? '#2ccf92' : '#0ea5e9' }} />{children}</span>;
}

function ConnectionBanner({ error, loading, onRefresh }: { error: string | null; loading: boolean; onRefresh: () => void }) {
  if (!error && !loading) return null;
  return (
    <div className="glass" style={{ margin: '0 clamp(18px, 3vw, 48px)', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, borderColor: error ? 'rgba(255,23,68,.3)' : 'rgba(14,165,233,.25)' }}>
      {error ? <WifiOff size={15} color="#ff5574" /> : <RefreshCcw size={15} color="#0ea5e9" className="animate-spin" />}
      <span style={{ fontSize: 12, color: error ? '#ff9aae' : '#8edcff' }}>{error ?? 'Synchronising live network data…'}</span>
      {error && <button className="rk-btn rk-btn-ghost" style={{ marginLeft: 'auto', padding: '6px 9px' }} onClick={onRefresh} data-testid="button-refresh-connection"><RefreshCcw size={13} /> Retry</button>}
    </div>
  );
}

function EmptyLiveState({ title = 'Awaiting live records', body = 'Connect the Rakt Kavach data plane to populate this view. No sample records are shown.' }: { title?: string; body?: string }) {
  return (
    <div className="rk-empty" data-testid="status-empty-live">
      <div>
        <div style={{ width: 42, height: 42, margin: '0 auto 14px', display: 'grid', placeItems: 'center', borderRadius: 12, background: 'rgba(14,165,233,.08)', border: '1px solid rgba(14,165,233,.22)' }}><Database size={19} color="#0ea5e9" /></div>
        <div style={{ color: '#d7e4ef', fontSize: 14, fontWeight: 600 }}>{title}</div>
        <p style={{ maxWidth: 420, margin: '8px auto 0', color: '#71879b', fontSize: 12, lineHeight: 1.6 }}>{body}</p>
      </div>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#eef7ff', textDecoration: 'none' }} data-testid="link-brand">
      <span className="brand-mark" style={{ width: 34, height: 34, border: '1px solid rgba(255,23,68,.65)', borderRadius: 10, display: 'grid', placeItems: 'center', color: '#ff1744', background: 'rgba(255,23,68,.08)' }}><Shield size={19} /></span>
      {!compact && <span className="brand-copy"><strong style={{ display: 'block', fontSize: 14, letterSpacing: '.03em' }}>RAKT KAVACH</strong><span className="rk-label" style={{ fontSize: 8 }}>national blood grid</span></span>}
    </Link>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data, loading, error, refresh } = useCommandCenter();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="rk-shell grid-bg">
      <div style={{ display: 'flex', minHeight: '100dvh' }}>
        <aside className="rk-sidebar">
          <div style={{ padding: '21px 16px 26px' }}><Brand /></div>
          <div className="side-meta" style={{ padding: '0 16px 16px' }}>
            <div className="rk-label">Live operations</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8, color: '#6fe7be', fontSize: 11 }}><span className="status-dot" style={{ background: '#2ccf92', boxShadow: '0 0 12px #2ccf92' }} />Network monitoring</div>
          </div>
          <nav style={{ padding: '0 10px', display: 'grid', gap: 3 }} aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return <Link key={item.href} href={item.href} className={`rk-nav-item ${location === item.href ? 'active' : ''}`} onClick={() => setMobileOpen(false)} data-testid={`link-nav-${item.short.toLowerCase()}`}><Icon size={17} /><span className="nav-copy">{item.label}</span></Link>;
            })}
          </nav>
          <div style={{ marginTop: 'auto', padding: 14 }} className="side-meta">
            <div className="rk-card" style={{ padding: 12, borderColor: 'rgba(14,165,233,.18)' }}>
              <div className="rk-label">Data plane</div>
              <div style={{ marginTop: 8, fontSize: 11, color: adapter.configured ? '#6fe7be' : '#ff879d' }}>{adapter.configured ? 'Supabase connected' : 'Connection required'}</div>
              <div style={{ marginTop: 6, fontSize: 10, color: '#637b91', lineHeight: 1.5 }}>Realtime subscriptions are active when configured.</div>
            </div>
          </div>
        </aside>
        <main className="rk-main">
          <header style={{ height: 70, borderBottom: '1px solid rgba(101,127,157,.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(18px, 3vw, 48px)', background: 'rgba(5,11,20,.56)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <button className="rk-btn rk-btn-ghost" style={{ display: 'none', padding: 8 }} onClick={() => setMobileOpen(!mobileOpen)} data-testid="button-open-mobile-nav"><Menu size={18} /></button>
              <span className="rk-label">India / national mesh</span>
              <span style={{ color: '#324960' }}>/</span>
              <span style={{ color: '#a8b9c8', fontSize: 12 }}>{navItems.find((item) => item.href === location)?.label ?? 'Operations'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <StatusPill tone={adapter.configured ? 'live' : 'alert'}>{adapter.configured ? 'Live sync' : 'Offline boundary'}</StatusPill>
              <div style={{ width: 32, height: 32, borderRadius: 10, display: 'grid', placeItems: 'center', border: '1px solid rgba(14,165,233,.24)', color: '#8edcff', background: 'rgba(14,165,233,.06)' }}><Users size={15} /></div>
            </div>
          </header>
          <ConnectionBanner error={error} loading={loading} onRefresh={() => void refresh()} />
          {children}
        </main>
      </div>
      <nav className="rk-mobile-bar" aria-label="Mobile navigation">
        {navItems.slice(0, 5).map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} className={location === item.href ? 'active' : ''} data-testid={`mobile-link-${item.short.toLowerCase()}`}><Icon size={17} /><span>{item.short}</span></Link>; })}
      </nav>
      {mobileOpen && <div style={{ position: 'fixed', inset: '70px 0 0', zIndex: 19, background: 'rgba(4,10,18,.95)', padding: 20 }}><div style={{ display: 'grid', gap: 5 }}>{navItems.map((item) => <Link key={item.href} href={item.href} className="rk-nav-item" onClick={() => setMobileOpen(false)} data-testid={`mobile-menu-${item.short.toLowerCase()}`}>{<item.icon size={18} />}{item.label}</Link>)}</div></div>}
      <div style={{ display: 'none' }}>{data.profile?.fullName}</div>
    </div>
  );
}

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice?: Promise<{ outcome: 'accepted' | 'dismissed' }> };

function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => window.sessionStorage.getItem('rk-pwa-dismissed') === '1');

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!installEvent || dismissed) return null;
  const install = async () => {
    await installEvent.prompt();
    setInstallEvent(null);
  };
  const dismiss = () => {
    window.sessionStorage.setItem('rk-pwa-dismissed', '1');
    setDismissed(true);
  };
  return <div className="rk-toast rk-card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, borderColor: 'rgba(14,165,233,.4)' }} role="dialog" aria-label="Install Rakt Kavach"><Smartphone size={20} color="#0ea5e9" /><div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600 }}>Install Rakt Kavach</div><div style={{ fontSize: 10, color: '#7890a6', marginTop: 3 }}>Keep the response network one tap away.</div></div><button className="rk-btn rk-btn-secondary" onClick={() => void install()} data-testid="button-install-pwa">Install</button><button className="rk-btn rk-btn-ghost" style={{ padding: 7 }} onClick={dismiss} aria-label="Dismiss install prompt" data-testid="button-dismiss-install"><X size={14} /></button></div>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, marginBottom: 28, flexWrap: 'wrap' }}><div><div className="rk-label" style={{ color: '#ff5574', marginBottom: 9 }}>{eyebrow}</div><h1 className="rk-title">{title}</h1><p style={{ color: '#70869a', fontSize: 13, margin: '10px 0 0', maxWidth: 600, lineHeight: 1.6 }}>{description}</p></div>{action}</div>;
}

function MetricCard({ label, value, detail, tone = 'blue', icon: Icon }: { label: string; value: string; detail: string; tone?: 'blue' | 'red' | 'green' | 'amber'; icon: typeof Activity }) {
  const color = tone === 'red' ? '#ff1744' : tone === 'green' ? '#2ccf92' : tone === 'amber' ? '#f6b73c' : '#0ea5e9';
  return <div className="rk-card rk-kpi" data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><span className="rk-label">{label}</span><Icon size={16} color={color} /></div><div style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-.05em', marginTop: 12, color: '#edf7ff' }}>{value}</div><div style={{ fontSize: 11, color, marginTop: 5 }}>{detail}</div></div>;
}

function Dashboard() {
  const { data } = useCommandCenter();
  const units = data.inventory.reduce((sum, item) => sum + item.unitsAvailable, 0);
  const reserved = data.inventory.reduce((sum, item) => sum + item.unitsReserved, 0);
  const critical = data.inventory.filter((item) => item.status === 'critical' || item.status === 'shortage').length;
  return <ShellPage><PageHeader eyebrow="Operations / 01" title="Network pulse" description="A live operating picture for the blood-grid. Every counter below is derived from connected records." action={<Link href="/emergency" className="rk-btn rk-btn-primary" data-testid="link-open-emergency"><Siren size={15} /> Open emergency desk</Link>} /><div className="scan-line"><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12, marginBottom: 18 }} className="responsive-grid"><MetricCard label="Available units" value={data.inventory.length ? units.toLocaleString() : '—'} detail={data.inventory.length ? 'Across reporting nodes' : 'No live inventory'} icon={Boxes} /><MetricCard label="Reserved units" value={data.inventory.length ? reserved.toLocaleString() : '—'} detail={data.inventory.length ? 'Held for active requests' : 'No live reservations'} tone="red" icon={PackageCheck} /><MetricCard label="Open emergencies" value={data.emergencies.length ? String(data.emergencies.length) : '—'} detail={data.emergencies.length ? 'Needs operator attention' : 'No live requests'} tone="amber" icon={Siren} /><MetricCard label="Nodes reporting" value={data.metrics.length ? String(data.metrics.length) : '—'} detail={data.metrics.length ? 'Realtime system metrics' : 'Awaiting connection'} tone="green" icon={Radio} /></div></div><div style={{ display: 'grid', gridTemplateColumns: '1.35fr .65fr', gap: 16 }} className="responsive-split"><section className="rk-card" style={{ padding: 20 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}><div><div className="rk-label">Live event stream</div><h2 style={{ fontSize: 16, margin: '6px 0 0' }}>What needs attention</h2></div><StatusPill tone="info">Realtime</StatusPill></div>{data.emergencies.length ? <div style={{ display: 'grid', gap: 9 }}>{data.emergencies.slice(0, 5).map((request) => <div key={request.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: 13, borderRadius: 9, background: 'rgba(255,255,255,.025)', border: '1px solid rgba(101,127,157,.14)' }}><div style={{ display: 'flex', gap: 10 }}><div style={{ color: '#ff5574', paddingTop: 2 }}><AlertTriangle size={15} /></div><div><div style={{ fontSize: 12, color: '#d9e5ef' }}>{request.facility}</div><div style={{ fontSize: 10, color: '#71879b', marginTop: 4 }}>{request.district} · {request.bloodGroup} · {request.unitsNeeded} units</div></div></div><StatusPill tone={request.priority === 'critical' ? 'alert' : 'info'}>{request.status}</StatusPill></div>)}</div> : <EmptyLiveState title="No live events in the stream" body="Emergency requests, node alerts and movement updates will appear here as Supabase records arrive." />}</section><section className="rk-card" style={{ padding: 20 }}><div className="rk-label">Readiness signal</div><h2 style={{ fontSize: 16, margin: '6px 0 18px' }}>Connected system health</h2>{data.metrics.length ? <div style={{ display: 'grid', gap: 12 }}>{data.metrics.slice(0, 6).map((metric) => <div key={metric.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ color: '#9cb0c1', fontSize: 12 }}>{metric.label}</span><span style={{ color: metric.status === 'healthy' ? '#6fe7be' : '#ff879d', font: '11px var(--app-font-mono)' }}>{metric.value}</span></div>)}</div> : <div style={{ padding: '20px 0' }}><div className="rk-orb" style={{ width: 100, height: 100, margin: '0 auto 15px' }}><Activity size={22} color="#0ea5e9" style={{ position: 'relative', zIndex: 2 }} /></div><p style={{ color: '#71879b', fontSize: 11, lineHeight: 1.6, textAlign: 'center' }}>Health telemetry appears when the command center is connected.</p></div>}<Link href="/command-center" className="rk-btn rk-btn-ghost" style={{ width: '100%', marginTop: 18 }} data-testid="link-view-command-center">View command center <ArrowUpRight size={14} /></Link></section></div><div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }} className="responsive-grid"><QuickAction href="/inventory" icon={Boxes} title="Inventory" text="See availability and expiry across nodes" /><QuickAction href="/tracking" icon={Route} title="Chain of custody" text="Follow every movement with timestamps" /><QuickAction href="/donor" icon={HeartPulse} title="Donor wallet" text="Open digital donor identity and credits" /></div><style>{`.responsive-grid{ } @media(max-width:820px){.responsive-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.responsive-split{grid-template-columns:1fr!important}} @media(max-width:460px){.responsive-grid{grid-template-columns:1fr!important}}`}</style></ShellPage>;
}

function QuickAction({ href, icon: Icon, title, text }: { href: string; icon: typeof Activity; title: string; text: string }) {
  return <Link href={href} className="rk-card" style={{ padding: 16, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }} data-testid={`link-quick-${title.toLowerCase().replaceAll(' ', '-')}`}><span style={{ width: 36, height: 36, borderRadius: 9, display: 'grid', placeItems: 'center', color: '#0ea5e9', background: 'rgba(14,165,233,.09)' }}><Icon size={17} /></span><span style={{ flex: 1 }}><strong style={{ display: 'block', fontSize: 12, color: '#d7e5ef' }}>{title}</strong><span style={{ display: 'block', color: '#71869b', fontSize: 10, marginTop: 4 }}>{text}</span></span><ChevronRight size={15} color="#50697f" /></Link>;
}

function ShellPage({ children }: { children: ReactNode }) {
  return <div className="rk-content">{children}</div>;
}

function DonorPage() {
  const { data } = useCommandCenter();
  const wallet = data.wallet;
  return <ShellPage><PageHeader eyebrow="Identity / 02" title="Donor wallet" description="A portable donor identity with eligibility, blood credits and a verifiable QR pass." action={<button className="rk-btn rk-btn-secondary" disabled={!wallet} data-testid="button-open-qr-pass"><QrCode size={15} /> Show QR pass</button>} /><div style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 16 }} className="responsive-split"><section className="rk-card rk-mesh" style={{ padding: 22, minHeight: 290, position: 'relative', overflow: 'hidden' }}><div className="rk-label" style={{ color: '#ff5574' }}>Digital donor card</div>{wallet ? <><div style={{ marginTop: 40, fontSize: 24 }}>Verified donor</div><div style={{ marginTop: 8, color: '#91a6b8', fontSize: 12 }}>{wallet.bloodGroup} · {wallet.tier} tier</div><div style={{ position: 'absolute', right: 28, bottom: 28, color: '#ff1744' }}><QrCode size={76} /></div></> : <div style={{ marginTop: 54 }}><div style={{ fontSize: 24, color: '#dceaf5' }}>Your donor identity</div><p style={{ color: '#7890a6', fontSize: 12, maxWidth: 360, lineHeight: 1.6 }}>Sign in through ABHA to issue a donor card. Personal identity is never replaced by placeholder data.</p><button className="rk-btn rk-btn-primary" disabled style={{ marginTop: 16 }} data-testid="button-verify-abha"><BadgeCheck size={14} /> ABHA verification required</button></div>}<div style={{ position: 'absolute', left: 22, bottom: 20, font: '10px var(--app-font-mono)', color: '#637c92' }}>RAKT KAVACH / SECURE ID</div></section><section className="rk-card" style={{ padding: 22 }}><div className="rk-label">Blood credit balance</div><div style={{ display: 'flex', alignItems: 'center', gap: 15, marginTop: 22 }}><div style={{ width: 54, height: 54, borderRadius: '50%', display: 'grid', placeItems: 'center', border: '1px solid rgba(255,23,68,.4)', color: '#ff1744', boxShadow: '0 0 24px rgba(255,23,68,.14)' }}><HeartPulse size={24} /></div><div><div style={{ fontSize: 34, letterSpacing: '-.06em' }}>{wallet ? wallet.credits : '—'}</div><div className="rk-label" style={{ marginTop: 5 }}>credits available</div></div></div><div style={{ marginTop: 30, paddingTop: 16, borderTop: '1px solid rgba(102,129,155,.16)', display: 'grid', gap: 14 }}>{[['Last donation', wallet?.lastDonationAt ?? '—'], ['Next eligible', wallet?.nextEligibleAt ?? '—'], ['Status', wallet ? 'Eligible window tracked' : 'Awaiting identity']].map(([label, value]) => <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 11 }}><span style={{ color: '#758b9f' }}>{label}</span><span style={{ color: '#c3d2df', fontFamily: 'var(--app-font-mono)' }}>{value}</span></div>)}</div></section></div><section className="rk-card" style={{ marginTop: 16, padding: 22 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}><div><div className="rk-label">Contribution ledger</div><h2 style={{ fontSize: 16, margin: '6px 0 0' }}>Donation history</h2></div><FileCheck2 size={18} color="#0ea5e9" /></div>{wallet ? <EmptyLiveState title="No donation events returned" body="Your ledger is empty in the connected workspace. New verified donations will appear here." /> : <EmptyLiveState title="Donor wallet not connected" body="Connect Supabase and authenticate a donor profile to unlock history and eligibility." />}</section></ShellPage>;
}

function InventoryPage() {
  const { data } = useCommandCenter();
  const [group, setGroup] = useState<BloodGroup | 'all'>('all');
  const [query, setQuery] = useState('');
  const rows = useMemo(() => data.inventory.filter((item) => (group === 'all' || item.bloodGroup === group) && item.nodeId.toLowerCase().includes(query.toLowerCase())), [data.inventory, group, query]);
  return <ShellPage><PageHeader eyebrow="Supply / 03" title="Blood inventory" description="A node-by-node view of available components, reservation pressure and expiry risk." action={<button className="rk-btn rk-btn-ghost" onClick={() => { setGroup('all'); setQuery(''); }} data-testid="button-reset-inventory"><RefreshCcw size={14} /> Reset filters</button>} /><div className="rk-card" style={{ padding: 14, marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}><div style={{ position: 'relative', flex: '1 1 220px' }}><Search size={14} color="#60788e" style={{ position: 'absolute', left: 12, top: 13 }} /><input className="rk-input" style={{ paddingLeft: 34 }} placeholder="Search reporting node" value={query} onChange={(event) => setQuery(event.target.value)} data-testid="input-search-inventory" /></div><select className="rk-input" style={{ width: 150 }} value={group} onChange={(event) => setGroup(event.target.value as BloodGroup | 'all')} data-testid="select-blood-group"><option value="all">All groups</option>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((value) => <option key={value} value={value}>{value}</option>)}</select></div>{rows.length ? <div className="rk-card rk-table-wrap"><table className="rk-table"><thead><tr><th>Node</th><th>Group</th><th>Component</th><th>Available</th><th>Reserved</th><th>Expiry</th><th>Signal</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id} data-testid={`row-inventory-${item.id}`}><td style={{ color: '#dbe8f2' }}>{item.nodeId}</td><td><span style={{ color: '#ff6b86', fontFamily: 'var(--app-font-mono)' }}>{item.bloodGroup}</span></td><td>{item.component}</td><td style={{ color: '#6fe7be', fontFamily: 'var(--app-font-mono)' }}>{item.unitsAvailable}</td><td style={{ fontFamily: 'var(--app-font-mono)' }}>{item.unitsReserved}</td><td>{item.expiresAt}</td><td><StatusPill tone={item.status === 'critical' || item.status === 'shortage' ? 'alert' : 'live'}>{item.status}</StatusPill></td></tr>)}</tbody></table></div> : <EmptyLiveState title={data.inventory.length ? 'No inventory matches these filters' : 'No inventory records available'} body={data.inventory.length ? 'Try another blood group or node name.' : 'Live stock appears here only after the Supabase inventory table is connected.'} />}</ShellPage>;
}

function TrackingPage() {
  const { data } = useCommandCenter();
  return <ShellPage><PageHeader eyebrow="Logistics / 04" title="Unit tracking" description="Follow blood units through the chain of custody. Every handoff is timestamped against its node." action={<StatusPill tone="info">Chain of custody</StatusPill>} />{data.movements.length ? <div className="rk-card rk-table-wrap"><table className="rk-table"><thead><tr><th>Unit</th><th>From</th><th>To</th><th>Status</th><th>ETA</th><th>Last updated</th></tr></thead><tbody>{data.movements.map((movement) => <tr key={movement.id} data-testid={`row-movement-${movement.id}`}><td style={{ color: '#dbe8f2', fontFamily: 'var(--app-font-mono)' }}>{movement.unitId}</td><td>{movement.fromNode}</td><td>{movement.toNode}</td><td><StatusPill tone={movement.status === 'delayed' ? 'alert' : 'info'}>{movement.status.replace('_', ' ')}</StatusPill></td><td>{movement.eta ?? '—'}</td><td>{movement.lastUpdatedAt}</td></tr>)}</tbody></table></div> : <EmptyLiveState title="No units in motion" body="Movement records will populate once participating nodes publish chain-of-custody events." />}</ShellPage>;
}

function EmergencyPage() {
  const { data } = useCommandCenter();
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState('');
  const [facility, setFacility] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [units, setUnits] = useState('1');
  const submit = async () => {
    const result = await adapter.createEmergency({ patientRef: 'operator-entry', bloodGroup, unitsNeeded: Number(units), facility, district: '', priority: 'critical' });
    setNotice(result.error ?? 'Emergency request submitted');
    if (!result.error) setShowForm(false);
  };
}

function CommandCenterPage() {
  const { data } = useCommandCenter();
  return <ShellPage><PageHeader eyebrow="National / 06" title="Command center" description="Regional readiness and demand forecasting for WHO and Government operators." action={<StatusPill tone={data.forecasts.length ? 'live' : 'info'}>{data.forecasts.length ? 'Forecast current' : 'Awaiting forecast feed'}</StatusPill>} /><div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 16 }} className="responsive-split"><section className="rk-card" style={{ padding: 20 }}><div className="rk-label">Demand intelligence</div><h2 style={{ fontSize: 16, margin: '6px 0 20px' }}>Regional forecast</h2>{data.forecasts.length ? <div className="rk-table-wrap"><table className="rk-table"><thead><tr><th>Region</th><th>Group</th><th>Horizon</th><th>Projected</th><th>Confidence</th></tr></thead><tbody>{data.forecasts.map((forecast) => <tr key={forecast.id}><td style={{ color: '#dce8f2' }}>{forecast.region}</td><td style={{ color: '#ff6b86', fontFamily: 'var(--app-font-mono)' }}>{forecast.bloodGroup}</td><td>{forecast.horizonDays} days</td><td style={{ fontFamily: 'var(--app-font-mono)' }}>{forecast.projectedUnits}</td><td style={{ color: '#6fe7be' }}>{forecast.confidence}%</td></tr>)}</tbody></table></div> : <EmptyLiveState title="Forecast feed is not connected" body="DemandForecast records are intentionally not fabricated. Connect the forecasting table to see regional projections." />}</section><section className="rk-card" style={{ padding: 20 }}><div className="rk-label">Readiness map</div><h2 style={{ fontSize: 16, margin: '6px 0 16px' }}>Regional signal</h2><div style={{ minHeight: 255, display: 'grid', placeItems: 'center', borderRadius: 10, background: 'radial-gradient(circle at center, rgba(14,165,233,.12), transparent 58%), repeating-radial-gradient(circle at center, rgba(14,165,233,.11) 0 1px, transparent 1px 30px)', border: '1px solid rgba(14,165,233,.13)' }}><div style={{ textAlign: 'center' }}><Globe2 size={36} color="#0ea5e9" /><div style={{ marginTop: 12, fontSize: 12, color: '#a2b7c8' }}>{data.metrics.length ? `${data.metrics.length} signals reporting` : 'No regional signals'}</div><div style={{ marginTop: 5, color: '#637b91', fontSize: 10 }}>Live geospatial layer</div></div></div></section></div><section className="rk-card" style={{ padding: 20, marginTop: 16 }}><div className="rk-label">Operator notes</div><div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, color: '#8298ab', fontSize: 12 }}><AlertTriangle size={16} color="#f6b73c" /> This view stays empty until verified regional signals are available.</div></section></ShellPage>;
}

function AdminPage() {
  const { data } = useCommandCenter();
  const [tab, setTab] = useState<'audit' | 'users' | 'health'>('audit');
  return <ShellPage><PageHeader eyebrow="Control / 07" title="Super Admin" description="Access controls, auditability and system health. Administrative writes remain gated behind authenticated sessions." action={<StatusPill tone="alert">Restricted surface</StatusPill>} /><div style={{ display: 'flex', gap: 7, marginBottom: 16, flexWrap: 'wrap' }}>{[['audit', 'Audit stream', FileCheck2], ['users', 'Users & permissions', Users], ['health', 'System health', Activity]].map(([key, label, Icon]) => <button key={key as string} className={`rk-btn ${tab === key ? 'rk-btn-secondary' : 'rk-btn-ghost'}`} onClick={() => setTab(key as 'audit' | 'users' | 'health')} data-testid={`button-admin-${key}`}><Icon size={14} />{label as string}</button>)}</div>{tab === 'audit' && (data.audit.length ? <div className="rk-card rk-table-wrap"><table className="rk-table"><thead><tr><th>Actor</th><th>Action</th><th>Role</th><th>Occurred</th></tr></thead><tbody>{data.audit.map((event) => <tr key={event.id}><td>{event.actor}</td><td style={{ color: '#dce8f2' }}>{event.action}</td><td><StatusPill tone="info">{event.role}</StatusPill></td><td>{event.occurredAt}</td></tr>)}</tbody></table></div> : <EmptyLiveState title="Audit stream awaiting connection" body="Every privileged action will be rendered here from the typed audit_events adapter." />)}{tab === 'users' && <div className="rk-card" style={{ padding: 20 }}><div className="rk-label">Directory controls</div><h2 style={{ fontSize: 16, margin: '7px 0 10px' }}>Users & permissions</h2><EmptyLiveState title="No directory records available" body="User profiles and role grants are not seeded in this interface. Connect Supabase to manage real operators." /></div>}{tab === 'health' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }} className="responsive-grid">{data.metrics.length ? data.metrics.map((metric) => <MetricCard key={metric.label} label={metric.label} value={metric.value} detail={metric.change} tone={metric.status === 'healthy' ? 'green' : metric.status === 'critical' ? 'red' : 'amber'} icon={Activity} />) : <div style={{ gridColumn: '1/-1' }}><EmptyLiveState title="System health is not reporting" body="Health metrics appear here after the system_metrics adapter is connected." /></div>}</div>}</ShellPage>;
}

function Home() {
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<UserRole | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const roles: { role: UserRole; title: string; detail: string; icon: typeof Activity }[] = [
    { role: 'citizen', title: 'Citizen', detail: 'Find help and nearby blood services', icon: Users },
    { role: 'donor', title: 'Donor', detail: 'Carry your digital donor card', icon: HeartPulse },
    { role: 'hospital', title: 'Hospital / clinic', detail: 'Request, reserve and move units', icon: Stethoscope },
    { role: 'authority', title: 'District / state', detail: 'Coordinate readiness across nodes', icon: MapPin },
    { role: 'operator', title: 'WHO / Govt operator', detail: 'Monitor national response', icon: Globe2 },
    { role: 'super_admin', title: 'Super Admin', detail: 'Control access and audit trails', icon: Settings2 },
  ];
  const chooseRole = (selected: UserRole) => { setRole(selected); setAuthOpen(true); };
  return <div className="rk-shell grid-bg"><div className="rk-hero"><div style={{ width: 'min(1240px, 100%)', margin: '0 auto', padding: '40px clamp(20px, 5vw, 70px)', position: 'relative', zIndex: 2 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Brand /><div className="rk-label">Operational network · v1.0</div></div><div style={{ maxWidth: 650, marginTop: 'clamp(70px, 14vh, 150px)' }}><div className="rk-label" style={{ color: '#ff5574', marginBottom: 16 }}><span className="status-dot" style={{ background: '#ff1744', marginRight: 8, boxShadow: '0 0 12px #ff1744' }} />Life-critical infrastructure</div><h1 style={{ fontSize: 'clamp(48px, 8vw, 94px)', lineHeight: '.92', letterSpacing: '-.075em', margin: 0, fontWeight: 600 }}>Every unit.<br /><span className="text-glow-red" style={{ color: '#ff1744' }}>Everywhere.</span></h1><p style={{ maxWidth: 520, color: '#8aa0b3', lineHeight: 1.7, fontSize: 14, marginTop: 26 }}>Rakt Kavach is the live operating layer for India’s blood network — connecting donors, hospitals and command teams when time matters.</p><div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 30 }}><button className="rk-btn rk-btn-primary" onClick={() => document.getElementById('role-entry')?.scrollIntoView({ behavior: 'smooth' })} data-testid="button-enter-network">Enter the network <ArrowUpRight size={15} /></button><span className="rk-label" style={{ letterSpacing: '.08em' }}>ABHA-ready access</span></div></div><div className="rk-orb" style={{ position: 'absolute', right: '7%', top: '29%' }}><div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}><Activity size={31} color="#aee7ff" /><div className="rk-label" style={{ marginTop: 9, color: '#8edcff', fontSize: 8 }}>GRID ONLINE</div></div></div><div id="role-entry" style={{ marginTop: 100, maxWidth: 820 }}><div className="rk-label">Choose your access boundary</div><div className="rk-portal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 9, marginTop: 12 }}>{roles.map((item) => { const Icon = item.icon; return <button key={item.role} className={`rk-card rk-portal-card ${role === item.role ? 'selected' : ''}`} onClick={() => chooseRole(item.role)} data-testid={`button-role-${item.role}`}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><Icon size={18} color={role === item.role ? '#ff5574' : '#0ea5e9'} /><ChevronRight size={14} color="#4c667d" /></div><div style={{ marginTop: 23, color: '#dce8f2', fontWeight: 600, fontSize: 12 }}>{item.title}</div><div style={{ marginTop: 5, color: '#6e859a', fontSize: 10, lineHeight: 1.4 }}>{item.detail}</div></button>; })}</div></div><div style={{ display: 'flex', gap: 18, marginTop: 30, color: '#60778c', font: '10px var(--app-font-mono)', flexWrap: 'wrap' }}><span><LockKeyhole size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />Encrypted by default</span><span><Radio size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />Realtime events</span><span><BadgeCheck size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />Verified identities</span></div></div>{authOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(2,7,13,.82)', display: 'grid', placeItems: 'center', padding: 20 }}><div className="rk-card" style={{ width: 'min(430px, 100%)', padding: 24 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><div><div className="rk-label" style={{ color: '#ff5574' }}>Secure access boundary</div><h2 style={{ fontSize: 22, margin: '8px 0 0' }}>{roles.find((item) => item.role === role)?.title} sign-in</h2></div><button className="rk-btn rk-btn-ghost" style={{ padding: 7 }} onClick={() => setAuthOpen(false)} aria-label="Close sign-in" data-testid="button-close-sign-in"><X size={15} /></button></div><p style={{ color: '#7890a6', fontSize: 12, lineHeight: 1.6, marginTop: 17 }}>Identity verification is handled by the configured Supabase session and ABHA boundary. This preview will not invent a successful sign-in.</p><div style={{ marginTop: 18, padding: 13, borderRadius: 9, background: 'rgba(255,23,68,.07)', border: '1px solid rgba(255,23,68,.2)', color: '#ff9bad', fontSize: 11, display: 'flex', gap: 9 }}><WifiOff size={15} />{adapter.configured ? 'Sign-in UI is ready for your auth provider.' : 'Supabase is not configured. Connect the data plane to continue.'}</div><button className="rk-btn rk-btn-primary" style={{ width: '100%', marginTop: 18 }} disabled={!adapter.configured} onClick={() => setLocation('/dashboard')} data-testid="button-continue-sign-in"><LockKeyhole size={14} /> Continue with verified access</button></div></div>}<div style={{ position: 'absolute', bottom: 18, left: 'clamp(20px, 5vw, 70px)', color: '#445c72', font: '10px var(--app-font-mono)' }}>© RAKT KAVACH · NATIONAL BLOOD GRID</div></div></div>;
}

function NotFoundPage() {
  const { id } = useParams();
  return <ShellPage><div className="rk-empty" style={{ marginTop: 80 }}><AlertTriangle size={28} color="#ff5574" /><h1 style={{ fontSize: 24, margin: 10 }}>Route unavailable</h1><p style={{ color: '#7890a6', fontSize: 12 }}>No operational surface exists for {id ?? 'this path'}.</p><Link href="/dashboard" className="rk-btn rk-btn-secondary" style={{ marginTop: 16 }} data-testid="link-return-dashboard">Return to dashboard</Link></div></ShellPage>;
}

function Router() {
  return <Switch><WouterRoute path="/" component={Home} /><WouterRoute path="/dashboard" component={DashboardRoute} /><WouterRoute path="/donor" component={DonorRoute} /><WouterRoute path="/inventory" component={InventoryRoute} /><WouterRoute path="/tracking" component={TrackingRoute} /><WouterRoute path="/emergency" component={EmergencyRoute} /><WouterRoute path="/command-center" component={CommandCenterRoute} /><WouterRoute path="/admin" component={AdminRoute} /><WouterRoute component={() => <Shell><NotFoundPage /></Shell>} /></Switch>;
}

function DashboardRoute() { return <Shell><Dashboard /></Shell>; }
function DonorRoute() { return <Shell><DonorPage /></Shell>; }
function InventoryRoute() { return <Shell><InventoryPage /></Shell>; }
function TrackingRoute() { return <Shell><TrackingPage /></Shell>; }
function EmergencyRoute() { return <Shell><EmergencyPage /></Shell>; }
function CommandCenterRoute() { return <Shell><CommandCenterPage /></Shell>; }
function AdminRoute() { return <Shell><AdminPage /></Shell>; }

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><RoutedErrorBoundary><Router /></RoutedErrorBoundary></WouterRouter><PwaInstallPrompt /><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;