import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleUserRound,
  Copy,
  Droplets,
  FileText,
  Fingerprint,
  HeartPulse,
  History,
  Home,
  Languages,
  LockKeyhole,
  LogOut,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  QrCode,
  ScanLine,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  UserRound,
  X,
} from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

type Language = 'en' | 'hi';
type AuthStep = 'splash' | 'onboarding' | 'phone' | 'otp';
type Tab = 'overview' | 'card' | 'history' | 'profile';

type Donation = {
  id: string;
  date: string;
  location: string;
  units: number;
  creditEarned: number;
  status: 'verified' | 'pending';
};

type DonorProfile = {
  name: string;
  bloodGroup: string;
  city: string;
  donorId: string;
  credits: number;
  tier: 'Silver' | 'Gold' | 'Super Donor';
  donations: Donation[];
  nextEligibleDate: string;
  phone: string;
};

const queryClient = new QueryClient();

const defaultProfile: DonorProfile = {
  name: 'Aarav Mehta',
  bloodGroup: 'B+',
  city: 'Pune',
  donorId: 'RKT-7X9P-2D4F',
  credits: 12.75,
  tier: 'Gold',
  nextEligibleDate: '2025-08-18',
  phone: '9876543210',
  donations: [
    { id: 'don-1', date: '2025-05-18', location: 'Ruby Hall Clinic, Pune', units: 1, creditEarned: 1, status: 'verified' },
    { id: 'don-2', date: '2024-11-04', location: 'Sassoon General Hospital', units: 1, creditEarned: 1, status: 'verified' },
    { id: 'don-3', date: '2024-04-21', location: 'KEM Hospital blood drive', units: 1, creditEarned: 1, status: 'verified' },
  ],
};

const copy = {
  en: {
    language: 'हिन्दी',
    continue: 'Continue',
    skip: 'Skip',
    getStarted: 'Enter the grid',
    phoneTitle: 'Your number is your key',
    phoneSub: 'We use your mobile number to create a secure donor identity.',
    sendOtp: 'Send secure code',
    otpTitle: 'Check your messages',
    otpSub: 'Enter the 4-digit code sent to',
    verify: 'Verify & create wallet',
    demo: 'Use demo code 2468',
    dashboard: 'Dashboard',
    card: 'Donor card',
    history: 'History',
    profile: 'Profile',
  },
  hi: {
    language: 'English',
    continue: 'आगे बढ़ें',
    skip: 'छोड़ें',
    getStarted: 'ग्रिड में आएं',
    phoneTitle: 'आपका नंबर आपकी पहचान है',
    phoneSub: 'आपकी सुरक्षित डोनर पहचान मोबाइल नंबर से बनेगी।',
    sendOtp: 'सुरक्षित कोड भेजें',
    otpTitle: 'संदेश देखें',
    otpSub: 'इस नंबर पर आया 4 अंकों का कोड डालें',
    verify: 'वेरिफाई करके वॉलेट बनाएं',
    demo: 'डेमो कोड 2468 इस्तेमाल करें',
    dashboard: 'डैशबोर्ड',
    card: 'डोनर कार्ड',
    history: 'इतिहास',
    profile: 'प्रोफाइल',
  },
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3" data-testid="brand-mark">
      <div className="relative grid h-10 w-10 place-items-center rounded-xl border border-red-400/40 bg-red-500/10 text-red-300 shadow-[0_0_24px_rgba(239,68,81,.18)]">
        <Droplets size={21} strokeWidth={2.4} />
        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,.9)]" />
      </div>
      {!compact && (
        <div>
          <div className="rk-display text-[15px] font-bold tracking-[.18em] text-slate-100">RAKT KAVACH</div>
          <div className="rk-mono mt-0.5 text-[9px] uppercase text-slate-500">India’s living blood grid</div>
        </div>
      )}
    </div>
  );
}

function LanguageToggle({ language, onChange }: { language: Language; onChange: (language: Language) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(language === 'en' ? 'hi' : 'en')}
      className="rk-button inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-cyan-400/50 hover:text-cyan-200"
      data-testid="button-language-toggle"
      aria-label="Switch language"
    >
      <Languages size={14} className="text-cyan-300" />
      <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
    </button>
  );
}

function Splash({ language, onEnter, onLanguage }: { language: Language; onEnter: () => void; onLanguage: (language: Language) => void }) {
  const text = copy[language];
  return (
    <main className="rk-app rk-grid-lines flex min-h-[100dvh] items-center justify-center px-5">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[23%] h-72 w-72 -translate-x-1/2 rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute -right-28 top-[55%] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-[480px] text-center">
        <div className="mb-10 flex justify-center"><BrandMark /></div>
        <div className="relative mx-auto mb-10 grid h-52 w-52 place-items-center rounded-full border border-red-400/25 bg-[#121931]/70 shadow-[0_0_90px_rgba(239,68,81,.18)]">
          <div className="absolute inset-5 rounded-full border border-cyan-300/20" />
          <div className="absolute inset-10 rounded-full border border-dashed border-red-300/30" />
          <HeartPulse size={86} strokeWidth={1.2} className="text-red-300" />
          <span className="absolute -top-2 right-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-[9px] font-bold tracking-[.16em] text-cyan-200">LIVE</span>
        </div>
        <p className="rk-mono mb-3 text-[10px] uppercase tracking-[.28em] text-cyan-300/75">One country. One living network.</p>
        <h1 className="rk-display text-4xl font-bold leading-[1.03] tracking-[-.04em] text-white sm:text-5xl">
          Every drop<br /><span className="text-red-300">finds a way.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-slate-400">
          {language === 'en' ? 'Rakt Kavach keeps your donation identity, impact and next call close at hand.' : 'रक्त कवच आपकी डोनर पहचान, प्रभाव और अगली पुकार को हमेशा आपके साथ रखता है।'}
        </p>
        <div className="mt-9 flex flex-col items-center gap-3">
          <button type="button" onClick={onEnter} className="rk-button rk-glow-red inline-flex h-12 w-full max-w-xs items-center justify-center gap-3 rounded-xl bg-red-500 px-5 text-sm font-bold text-white hover:bg-red-400" data-testid="button-enter-grid">
            {text.getStarted} <ArrowRight size={17} />
          </button>
          <LanguageToggle language={language} onChange={onLanguage} />
        </div>
        <p className="rk-mono mt-9 text-[9px] uppercase tracking-[.18em] text-slate-600">No hospital queues · no paperwork</p>
      </div>
    </main>
  );
}

function Onboarding({ language, slide, onSlide, onSkip, onLanguage }: { language: Language; slide: number; onSlide: (next: number) => void; onSkip: () => void; onLanguage: (language: Language) => void }) {
  const text = copy[language];
  const slides = [
    { eyebrow: '01 / identity', title: language === 'en' ? 'A donor ID that moves with you.' : 'एक डोनर आईडी, जो आपके साथ चले।', body: language === 'en' ? 'Your unique Rakt Kavach ID connects you to a trusted national blood network.' : 'आपकी यूनिक रक्त कवच आईडी आपको भरोसेमंद राष्ट्रीय ब्लड नेटवर्क से जोड़ती है।', icon: ShieldCheck, color: 'text-cyan-300', bg: 'bg-cyan-400/10' },
    { eyebrow: '02 / impact', title: language === 'en' ? 'See the lives behind the numbers.' : 'हर नंबर के पीछे एक जीवन है।', body: language === 'en' ? 'Every verified donation becomes a visible contribution — with credits to carry forward.' : 'हर वेरिफाइड डोनेशन एक दिखाई देने वाला योगदान बनता है — क्रेडिट के साथ।', icon: Sparkles, color: 'text-red-300', bg: 'bg-red-400/10' },
    { eyebrow: '03 / readiness', title: language === 'en' ? 'Ready when the grid calls.' : 'जब ग्रिड पुकारे, तैयार रहें।', body: language === 'en' ? 'A simple, secure wallet tells you when you can donate again and where you are needed.' : 'एक सरल, सुरक्षित वॉलेट आपको बताता है कि आप फिर कब और कहां डोनेट कर सकते हैं।', icon: Bell, color: 'text-blue-300', bg: 'bg-blue-400/10' },
  ];
  const current = slides[slide];
  const Icon = current.icon;
  return (
    <main className="rk-app flex min-h-[100dvh] items-center justify-center px-5 py-8">
      <div className="w-full max-w-[520px]">
        <header className="mb-10 flex items-center justify-between"><BrandMark compact /><div className="flex items-center gap-2"><LanguageToggle language={language} onChange={onLanguage} /><button type="button" onClick={onSkip} className="rk-button rounded-full px-3 py-2 text-xs text-slate-500 hover:text-slate-200" data-testid="button-skip-onboarding">{text.skip}</button></div></header>
        <div className="rk-glass rk-grid-lines relative min-h-[500px] overflow-hidden rounded-[28px] p-7 sm:p-10">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-red-400/10 blur-3xl" />
          <div className="relative flex min-h-[440px] flex-col">
            <div className="flex items-center justify-between"><span className="rk-mono text-[10px] uppercase tracking-[.22em] text-slate-500">{current.eyebrow}</span><span className="rk-mono text-[10px] text-slate-500">0{slide + 1} / 03</span></div>
            <div className={`mt-12 grid h-24 w-24 place-items-center rounded-3xl ${current.bg} ${current.color}`}><Icon size={45} strokeWidth={1.35} /></div>
            <h1 className="rk-display mt-10 max-w-md text-4xl font-bold leading-[1.05] tracking-[-.04em] text-white">{current.title}</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-400">{current.body}</p>
            <div className="mt-auto">
              <div className="mb-8 flex gap-2">{slides.map((_, index) => <button key={index} type="button" onClick={() => onSlide(index)} className={`h-1.5 rounded-full transition-all ${index === slide ? 'w-10 bg-red-400' : 'w-5 bg-slate-700'}`} aria-label={`Go to onboarding step ${index + 1}`} data-testid={`button-onboarding-step-${index}`} />)}</div>
              <button type="button" onClick={() => slide < 2 ? onSlide(slide + 1) : onSkip()} className="rk-button rk-glow-red flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-red-500 text-sm font-bold text-white hover:bg-red-400" data-testid="button-onboarding-continue">
                {slide < 2 ? text.continue : text.getStarted} <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
        <p className="rk-mono mt-5 text-center text-[9px] uppercase tracking-[.18em] text-slate-600">Private by design · verified by the grid</p>
      </div>
    </main>
  );
}

function AuthFlow({ language, step, phone, otp, biometric, onStep, onPhone, onOtp, onBiometric, onLanguage, onComplete }: {
  language: Language; step: AuthStep; phone: string; otp: string; biometric: boolean;
  onStep: (step: AuthStep) => void; onPhone: (phone: string) => void; onOtp: (otp: string) => void;
  onBiometric: (value: boolean) => void; onLanguage: (language: Language) => void; onComplete: () => void;
}) {
  const text = copy[language];
  const [onboardingSlide, setOnboardingSlide] = useState(0);
  const [error, setError] = useState('');
  if (step === 'splash') return <Splash language={language} onEnter={() => onStep('onboarding')} onLanguage={onLanguage} />;
  if (step === 'onboarding') return <Onboarding language={language} slide={onboardingSlide} onSlide={(next) => next >= 3 ? onStep('phone') : setOnboardingSlide(next)} onSkip={() => onStep('phone')} onLanguage={onLanguage} />;
  if (step === 'phone') {
    return (
      <main className="rk-app flex min-h-[100dvh] items-center justify-center px-5 py-8">
        <div className="w-full max-w-[460px]">
          <header className="mb-12 flex items-center justify-between"><BrandMark compact /><LanguageToggle language={language} onChange={onLanguage} /></header>
          <button type="button" onClick={() => onStep('onboarding')} className="mb-8 inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-200" data-testid="button-back-onboarding"><ArrowLeft size={14} /> {language === 'en' ? 'Back to the beginning' : 'वापस जाएं'}</button>
          <span className="rk-mono text-[10px] uppercase tracking-[.23em] text-red-300">Secure onboarding / 01</span>
          <h1 className="rk-display mt-4 text-4xl font-bold leading-[1.06] tracking-[-.04em] text-white">{text.phoneTitle}</h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">{text.phoneSub}</p>
          <div className="rk-glass mt-10 rounded-2xl p-5">
            <label htmlFor="phone" className="rk-mono text-[10px] uppercase tracking-[.18em] text-slate-500">Mobile number</label>
            <div className="mt-3 flex items-center gap-3 border-b border-slate-700 pb-3">
              <span className="text-sm font-semibold text-slate-400">+91</span>
              <input id="phone" value={phone} onChange={(event) => { setError(''); onPhone(event.target.value.replace(/\D/g, '').slice(0, 10)); }} placeholder="98765 43210" inputMode="numeric" className="w-full bg-transparent text-xl tracking-[.12em] text-white outline-none placeholder:text-slate-700" data-testid="input-phone" />
            </div>
            {error && <p className="mt-3 text-xs text-red-300" data-testid="status-phone-error">{error}</p>}
            <div className="mt-6 flex items-center justify-between rounded-xl bg-slate-900/50 p-3">
              <div className="flex items-center gap-3"><Fingerprint size={18} className={biometric ? 'text-cyan-300' : 'text-slate-500'} /><div><p className="text-xs font-semibold text-slate-200">Biometric unlock</p><p className="text-[11px] text-slate-500">Use your device after setup</p></div></div>
              <button type="button" onClick={() => onBiometric(!biometric)} className={`relative h-6 w-11 rounded-full transition-colors ${biometric ? 'bg-cyan-400' : 'bg-slate-700'}`} data-testid="button-biometric-toggle" aria-label="Toggle biometric unlock"><span className={`absolute top-1 h-4 w-4 rounded-full transition-transform ${biometric ? 'translate-x-6 bg-[#10182c]' : 'translate-x-1 bg-slate-400'}`} /></button>
            </div>
          </div>
          <button type="button" onClick={() => phone.length === 10 ? onStep('otp') : setError('Enter a valid 10-digit mobile number.')} className="rk-button rk-glow-red mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-red-500 text-sm font-bold text-white hover:bg-red-400" data-testid="button-send-otp">{text.sendOtp} <ArrowRight size={17} /></button>
          <div className="mt-8 flex items-start gap-3 text-xs leading-5 text-slate-600"><LockKeyhole size={15} className="mt-0.5 shrink-0 text-slate-500" /> Your number is only used to protect your donor identity. We never sell or publish it.</div>
        </div>
      </main>
    );
  }
  return (
    <main className="rk-app flex min-h-[100dvh] items-center justify-center px-5 py-8">
      <div className="w-full max-w-[460px]">
        <header className="mb-12 flex items-center justify-between"><BrandMark compact /><LanguageToggle language={language} onChange={onLanguage} /></header>
        <button type="button" onClick={() => onStep('phone')} className="mb-8 inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-200" data-testid="button-back-phone"><ArrowLeft size={14} /> Change mobile number</button>
        <span className="rk-mono text-[10px] uppercase tracking-[.23em] text-cyan-300">Secure onboarding / 02</span>
        <h1 className="rk-display mt-4 text-4xl font-bold leading-[1.06] tracking-[-.04em] text-white">{text.otpTitle}</h1>
        <p className="mt-4 text-sm leading-6 text-slate-400">{text.otpSub} <span className="font-semibold text-slate-200">+91 {phone}</span></p>
        <div className="rk-glass mt-10 rounded-2xl p-6">
          <input autoFocus value={otp} onChange={(event) => { setError(''); onOtp(event.target.value.replace(/\D/g, '').slice(0, 4)); }} inputMode="numeric" maxLength={4} placeholder="••••" className="rk-mono w-full border-b border-cyan-300/30 bg-transparent pb-4 text-center text-4xl tracking-[.55em] text-cyan-200 outline-none placeholder:text-slate-700" data-testid="input-otp" />
          <button type="button" onClick={() => onOtp('2468')} className="mx-auto mt-5 flex items-center gap-2 text-xs text-cyan-300 hover:text-cyan-200" data-testid="button-demo-otp"><Sparkles size={13} /> {text.demo}</button>
          {error && <p className="mt-4 text-center text-xs text-red-300" data-testid="status-otp-error">{error}</p>}
        </div>
        <button type="button" onClick={() => otp.length === 4 ? onComplete() : setError('Enter the 4-digit code to continue.')} className="rk-button rk-glow-red mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-red-500 text-sm font-bold text-white hover:bg-red-400" data-testid="button-verify-otp">{text.verify} <ShieldCheck size={17} /></button>
        <p className="mt-7 text-center text-xs text-slate-600">Code expires in 02:00 · <button type="button" className="text-slate-400 hover:text-white" data-testid="button-resend-otp">Resend code</button></p>
      </div>
    </main>
  );
}

function StatPill({ label, value, accent = 'red' }: { label: string; value: string; accent?: 'red' | 'blue' }) {
  return <div className={`rounded-2xl border p-4 ${accent === 'red' ? 'border-red-400/15 bg-red-400/[.06]' : 'border-blue-400/15 bg-blue-400/[.06]'}`}><div className="rk-mono text-[9px] uppercase tracking-[.17em] text-slate-500">{label}</div><div className={`rk-display mt-2 text-2xl font-bold ${accent === 'red' ? 'text-red-200' : 'text-blue-200'}`}>{value}</div></div>;
}

function DonorCard({ profile, onQr, onClose }: { profile: DonorProfile; onQr: () => void; onClose?: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-[25px] border border-red-300/25 bg-[linear-gradient(135deg,#241d35,#1c1930_45%,#112c4c)] p-6 shadow-[0_24px_60px_rgba(0,0,0,.3)]">
      <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[28px] border-red-400/10" />
      <div className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full border-[24px] border-cyan-300/10" />
      <div className="relative">
        <div className="flex items-start justify-between"><BrandMark compact /><div className="rounded-full border border-cyan-200/25 bg-cyan-200/10 px-2.5 py-1 text-[9px] font-bold tracking-[.14em] text-cyan-200">{profile.tier.toUpperCase()}</div></div>
        <div className="mt-9 flex items-end justify-between"><div><div className="rk-mono text-[9px] uppercase tracking-[.2em] text-slate-500">Donor identity</div><div className="rk-display mt-2 text-xl font-bold text-white">{profile.name}</div><div className="mt-1 text-xs text-slate-400">{profile.city} · Active since 2024</div></div><div className="grid h-16 w-16 place-items-center rounded-2xl border border-red-300/30 bg-red-400/10 text-3xl font-bold text-red-200">{profile.bloodGroup}</div></div>
        <div className="mt-8 flex items-end justify-between border-t border-white/10 pt-4"><div><div className="rk-mono text-[9px] uppercase tracking-[.18em] text-slate-500">Unique donor ID</div><div className="rk-mono mt-1 text-sm text-slate-200">{profile.donorId}</div></div><button type="button" onClick={onQr} className="rk-button flex items-center gap-2 rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-300/20" data-testid="button-open-qr"><QrCode size={15} /> QR pass</button></div>
      </div>
      {onClose && <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full bg-black/20 p-1.5 text-slate-400 hover:text-white" data-testid="button-close-card"><X size={16} /></button>}
    </div>
  );
}

function QrModal({ profile, onClose }: { profile: DonorProfile; onClose: () => void }) {
  const cells = useMemo(() => Array.from({ length: 81 }, (_, index) => {
    const x = index % 9; const y = Math.floor(index / 9);
    const finder = (x < 3 && y < 3) || (x > 5 && y < 3) || (x < 3 && y > 5);
    return finder ? (x === 1 || y === 1 || (x === 7 && y === 1) || (y === 7 && x === 1) || (x === 7 && y === 7) || (x === 1 && y === 7)) : ((index * 17 + x * 3 + y) % 5 < 2);
  }), []);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060913]/85 px-5 backdrop-blur-md"><div className="rk-glass rk-fade-up relative w-full max-w-sm rounded-[28px] p-6 text-center"><button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:text-white" data-testid="button-close-qr"><X size={18} /></button><div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300"><ScanLine size={23} /></div><p className="rk-mono text-[10px] uppercase tracking-[.2em] text-cyan-300">Live donor pass</p><h2 className="rk-display mt-2 text-2xl font-bold text-white">{profile.name}</h2><div className="rk-qr mx-auto mt-6 grid w-52 grid-cols-9 gap-1 rounded-xl p-3">{cells.map((active, index) => <span key={index} className={`aspect-square rounded-[1px] ${active ? 'opacity-100' : 'opacity-0'}`} />)}</div><p className="rk-mono mt-5 text-xs text-slate-300">{profile.donorId}</p><p className="mt-2 text-xs leading-5 text-slate-500">Show this code at any Rakt Kavach verified camp.</p></div></div>;
}

function Notice({ message, onClose }: { message: string | null; onClose: () => void }) {
  if (!message) return null;
  return <div className="fixed bottom-24 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-cyan-300/25 bg-[#17233d]/95 px-4 py-3 text-xs font-semibold text-cyan-100 shadow-[0_10px_35px_rgba(0,0,0,.35)] md:bottom-8" data-testid="status-notice"><Check size={15} className="text-cyan-300" /> {message}<button type="button" onClick={onClose} className="text-slate-500 hover:text-white" data-testid="button-dismiss-notice"><X size={14} /></button></div>;
}

function Dashboard({ profile, language, onCard, onLog, onNotice }: { profile: DonorProfile; language: Language; onCard: () => void; onLog: () => void; onNotice: (message: string) => void }) {
  const nextDate = new Date(profile.nextEligibleDate);
  const formattedNext = nextDate.toLocaleDateString(language === 'en' ? 'en-IN' : 'hi-IN', { day: 'numeric', month: 'short' });
  const creditProgress = Math.min(100, Math.round((profile.credits / 15) * 100));
  return <div className="rk-fade-up space-y-5">
    <section className="flex items-end justify-between"><div><p className="rk-mono text-[10px] uppercase tracking-[.2em] text-cyan-300/75">{language === 'en' ? 'Monday, 14 July 2025' : 'सोमवार, 14 जुलाई 2025'}</p><h1 className="rk-display mt-2 text-3xl font-bold tracking-[-.04em] text-white sm:text-4xl">{language === 'en' ? `Good evening, ${profile.name.split(' ')[0]}.` : `नमस्ते, ${profile.name.split(' ')[0]}.`}</h1><p className="mt-2 text-sm text-slate-400">{language === 'en' ? 'Your donor wallet is ready for the next call.' : 'आपका डोनर वॉलेट अगली पुकार के लिए तैयार है।'}</p></div><div className="hidden rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-[10px] font-bold tracking-[.16em] text-cyan-200 sm:block">PROFILE ACTIVE</div></section>
     <section className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]"><div className="rk-glass rk-grid-lines relative overflow-hidden rounded-[25px] p-6 sm:p-7"><div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border-[32px] border-red-400/[.07]" /><div className="relative"><div className="flex items-center justify-between"><div><span className="rk-mono text-[10px] uppercase tracking-[.2em] text-slate-500">Blood credits</span><div className="mt-2 flex items-baseline gap-2"><span className="rk-display text-6xl font-bold tracking-[-.08em] text-white">{profile.credits.toFixed(2)}</span><span className="text-sm font-semibold text-red-300">units</span></div><p className="mt-1 text-[11px] text-slate-500">1 Credit = 1 Unit of Blood</p></div><div className="grid h-14 w-14 place-items-center rounded-2xl border border-red-300/20 bg-red-400/10"><Droplets className="text-red-300" size={24} /></div></div><div className="mt-8 flex items-center justify-between text-xs"><span className="text-slate-400">Next tier: Super Donor</span><span className="rk-mono text-red-200">{creditProgress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-red-500 to-cyan-300" style={{ width: `${creditProgress}%` }} /></div><div className="mt-5 flex items-center justify-between"><span className="text-xs text-slate-500">{Math.max(0, 15 - profile.credits).toFixed(2)} credits to unlock city priority</span><button type="button" onClick={onNotice.bind(null, 'Super Donor tier unlocks at 15 credits.')} className="rk-button text-xs font-bold text-cyan-300 hover:text-cyan-100" data-testid="button-tier-details">Tier details <ChevronRight size={14} className="inline" /></button></div></div></div><div className="rk-glass relative flex flex-col justify-between overflow-hidden rounded-[25px] p-6"><div><div className="flex items-center justify-between"><span className="rk-mono text-[10px] uppercase tracking-[.2em] text-slate-500">Next eligible</span><CalendarDays size={18} className="text-cyan-300" /></div><div className="rk-display mt-6 text-4xl font-bold tracking-[-.06em] text-cyan-100">{formattedNext}</div><p className="mt-2 text-xs leading-5 text-slate-400">You can donate again in your city network.</p></div><button type="button" onClick={() => onNotice('Camp finder is scanning 18 verified locations near you.')} className="rk-button mt-7 flex items-center justify-between rounded-xl border border-cyan-300/20 bg-cyan-300/[.07] px-4 py-3 text-xs font-bold text-cyan-200 hover:bg-cyan-300/[.13]" data-testid="button-find-camp"><span className="flex items-center gap-2"><MapPin size={15} /> Find a camp</span><ArrowRight size={15} /></button></div></section>
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4"><StatPill label="Verified donations" value={String(profile.donations.filter((donation) => donation.status === 'verified').length)} /><StatPill label="Lives reached" value={String(profile.donations.length * 3)} accent="blue" /><StatPill label="Current tier" value={profile.tier} /><StatPill label="Grid standing" value="Top 18%" accent="blue" /></section>
    <section className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]"><div className="rk-glass rounded-[25px] p-6"><div className="flex items-start justify-between"><div><p className="rk-mono text-[10px] uppercase tracking-[.2em] text-slate-500">Your giving signal</p><h2 className="rk-display mt-2 text-xl font-bold text-white">Keep the chain alive.</h2></div><Award size={22} className="text-red-300" /></div><div className="mt-7 flex items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-full border border-red-300/25 bg-red-400/10 text-red-200"><HeartPulse size={25} /></div><p className="text-sm leading-6 text-slate-400">Your last donation was <span className="font-semibold text-slate-200">57 days ago</span>. A new donation keeps your city’s ready stock resilient.</p></div><button type="button" onClick={onLog} className="rk-button mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-xs font-bold text-white hover:bg-red-400" data-testid="button-log-donation"><Plus size={16} /> Log a donation</button></div><div className="rk-glass rounded-[25px] p-6"><div className="flex items-center justify-between"><div><p className="rk-mono text-[10px] uppercase tracking-[.2em] text-slate-500">Recent movement</p><h2 className="rk-display mt-2 text-xl font-bold text-white">Your donation history</h2></div><History size={21} className="text-cyan-300" /></div><div className="mt-5 space-y-3">{profile.donations.slice(0, 2).map((donation) => <DonationRow donation={donation} key={donation.id} />)}</div></div></section>
    <section className="rounded-[22px] border border-cyan-300/15 bg-cyan-300/[.045] p-5"><div className="flex gap-3"><MessageCircle size={18} className="mt-0.5 shrink-0 text-cyan-300" /><p className="text-xs leading-5 text-slate-400"><span className="font-semibold text-cyan-200">A note from the grid.</span> Blood can’t be manufactured. Your verified record helps a nearby hospital trust the next call faster.</p></div></section>
  </div>;
}

function DonationRow({ donation }: { donation: Donation }) {
  return <div className="flex items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.025] p-3" data-testid={`row-donation-${donation.id}`}><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-red-400/10 text-red-300"><Droplets size={16} /></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-200">{donation.location}</p><p className="mt-1 text-[11px] text-slate-500">{new Date(donation.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {donation.units} unit</p></div><div className="text-right"><p className="rk-mono text-xs text-cyan-200">+{donation.creditEarned}</p><p className="mt-1 text-[10px] text-emerald-300">{donation.status}</p></div></div>;
}

function HistoryView({ profile, onLog }: { profile: DonorProfile; onLog: () => void }) {
  return <div className="rk-fade-up"><div className="mb-6 flex items-end justify-between"><div><p className="rk-mono text-[10px] uppercase tracking-[.2em] text-cyan-300/75">The record</p><h1 className="rk-display mt-2 text-3xl font-bold tracking-[-.04em] text-white">Donation history</h1><p className="mt-2 text-sm text-slate-400">Every verified drop, held in your wallet.</p></div><button type="button" onClick={onLog} className="rk-button grid h-11 w-11 place-items-center rounded-xl bg-red-500 text-white hover:bg-red-400" data-testid="button-log-donation-history" aria-label="Log a donation"><Plus size={19} /></button></div><div className="rk-glass mb-5 flex items-center justify-between rounded-2xl p-5"><div><p className="text-xs text-slate-500">Total contribution</p><p className="rk-display mt-1 text-3xl font-bold text-white">{profile.donations.reduce((total, donation) => total + donation.units, 0)} <span className="text-sm font-medium text-slate-500">units</span></p></div><div className="text-right"><p className="text-xs text-slate-500">Credits earned</p><p className="rk-mono mt-2 text-lg text-cyan-200">+{profile.donations.reduce((total, donation) => total + donation.creditEarned, 0)}</p></div></div><div className="space-y-3">{profile.donations.map((donation) => <div key={donation.id} className="rk-glass rounded-2xl p-4"><DonationRow donation={donation} /><div className="mt-3 flex items-center gap-2 border-t border-white/[.06] pt-3 text-[11px] text-slate-500"><MapPin size={13} className="text-slate-600" /> Verified by Rakt Kavach partner network <Check size={13} className="ml-auto text-emerald-300" /></div></div>)}</div></div>;
}

function ProfileView({ profile, setProfile, language, onNotice, onLogout }: { profile: DonorProfile; setProfile: (profile: DonorProfile) => void; language: Language; onNotice: (message: string) => void; onLogout: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [city, setCity] = useState(profile.city);
  const [bloodGroup, setBloodGroup] = useState(profile.bloodGroup);
  const save = () => { setProfile({ ...profile, name: name.trim() || profile.name, city: city.trim() || profile.city, bloodGroup }); setEditing(false); onNotice(language === 'en' ? 'Profile updated on your device.' : 'प्रोफाइल आपके डिवाइस पर अपडेट हो गई।'); };
  return <div className="rk-fade-up"><div className="mb-6 flex items-end justify-between"><div><p className="rk-mono text-[10px] uppercase tracking-[.2em] text-cyan-300/75">Your identity</p><h1 className="rk-display mt-2 text-3xl font-bold tracking-[-.04em] text-white">Profile</h1></div><button type="button" onClick={() => setEditing(!editing)} className="rk-button rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-xs font-bold text-slate-200 hover:border-cyan-300/40" data-testid="button-edit-profile">{editing ? 'Close' : 'Edit profile'}</button></div><DonorCard profile={profile} onQr={() => onNotice('Open Donor card from the navigation to view your QR pass.')} /><div className="mt-5 grid gap-3 sm:grid-cols-2"><StatPill label="Member since" value="Apr 2024" /><StatPill label="Network rank" value="Top 18%" accent="blue" /></div>{editing && <div className="rk-glass rk-fade-up mt-5 rounded-[24px] p-5"><p className="rk-mono text-[10px] uppercase tracking-[.2em] text-slate-500">Update details</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-xs text-slate-400">Name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-3 text-sm text-white outline-none" data-testid="input-profile-name" /></label><label className="text-xs text-slate-400">City<input value={city} onChange={(event) => setCity(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-3 text-sm text-white outline-none" data-testid="input-profile-city" /></label><label className="text-xs text-slate-400">Blood group<select value={bloodGroup} onChange={(event) => setBloodGroup(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-3 text-sm text-white outline-none" data-testid="select-profile-blood"><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option></select></label></div><button type="button" onClick={save} className="rk-button mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3 text-sm font-bold text-[#10182c] hover:bg-cyan-300" data-testid="button-save-profile"><Check size={16} /> Save profile</button></div>}<div className="mt-5 space-y-2"><button type="button" onClick={() => onNotice('Your donor certificate is being prepared for download.')} className="rk-button flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-left text-sm font-semibold text-slate-300 hover:border-slate-600" data-testid="button-download-certificate"><FileText size={17} className="text-cyan-300" /> Download donor certificate <ChevronRight size={16} className="ml-auto text-slate-600" /></button><button type="button" onClick={onLogout} className="rk-button flex w-full items-center gap-3 rounded-xl border border-red-400/15 bg-red-400/[.04] p-4 text-left text-sm font-semibold text-red-200 hover:border-red-300/35" data-testid="button-logout"><LogOut size={17} /> Sign out of this device <ChevronRight size={16} className="ml-auto text-red-300/60" /></button></div></div>;
}

function DonationModal({ onClose, onSave }: { onClose: () => void; onSave: (donation: Omit<Donation, 'id'>) => void }) {
  const [location, setLocation] = useState('Ruby Hall Clinic, Pune');
  const [units, setUnits] = useState(1);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#060913]/80 px-3 backdrop-blur-sm sm:items-center"><div className="rk-glass rk-fade-up w-full max-w-md rounded-[26px] p-6"><div className="flex items-start justify-between"><div><p className="rk-mono text-[10px] uppercase tracking-[.2em] text-red-300">New contribution</p><h2 className="rk-display mt-2 text-2xl font-bold text-white">Log a donation</h2></div><button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:text-white" data-testid="button-close-donation"><X size={18} /></button></div><div className="mt-6 space-y-4"><label className="block text-xs text-slate-400">Donation location<input value={location} onChange={(event) => setLocation(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-3 text-sm text-white outline-none" data-testid="input-donation-location" /></label><div className="grid grid-cols-2 gap-3"><label className="block text-xs text-slate-400">Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-3 text-sm text-white outline-none" data-testid="input-donation-date" /></label><label className="block text-xs text-slate-400">Units<div className="mt-2 flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/50 px-2 py-1.5"><button type="button" onClick={() => setUnits(Math.max(1, units - 1))} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white" data-testid="button-decrease-units"><Minus size={15} /></button><span className="rk-mono text-sm text-white">{units}</span><button type="button" onClick={() => setUnits(Math.min(4, units + 1))} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white" data-testid="button-increase-units"><Plus size={15} /></button></div></label></div></div><button type="button" onClick={() => onSave({ location: location.trim() || 'Verified blood camp', date, units, creditEarned: units, status: 'verified' })} className="rk-button mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-400" data-testid="button-save-donation"><Check size={16} /> Add to wallet</button><p className="mt-3 text-center text-[11px] text-slate-600">Only add donations completed at a verified camp.</p></div></div>;
}

function NavItem({ active, icon: Icon, label, onClick, testId }: { active: boolean; icon: typeof Home; label: string; onClick: () => void; testId: string }) {
  return <button type="button" onClick={onClick} className={`rk-button flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold ${active ? 'bg-red-400/10 text-red-200' : 'text-slate-500 hover:bg-slate-900/70 hover:text-slate-200'}`} data-testid={testId}><Icon size={18} /> <span>{label}</span>{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-red-300" />}</button>;
}

function WalletApp({ profile, setProfile, language, onLanguage, onLogout }: { profile: DonorProfile; setProfile: (profile: DonorProfile) => void; language: Language; onLanguage: (language: Language) => void; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [showQr, setShowQr] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(null), 3000); };
  const text = copy[language];
  const addDonation = (donation: Omit<Donation, 'id'>) => { const next = { ...profile, credits: Number((profile.credits + donation.creditEarned).toFixed(2)), donations: [{ ...donation, id: `don-${Date.now()}` }, ...profile.donations] }; setProfile(next); setShowDonation(false); notify(language === 'en' ? 'Donation added to your wallet.' : 'डोनेशन आपके वॉलेट में जोड़ दिया गया।'); };
  const nav = [{ key: 'overview' as const, label: text.dashboard, icon: Home }, { key: 'card' as const, label: text.card, icon: QrCode }, { key: 'history' as const, label: text.history, icon: History }, { key: 'profile' as const, label: text.profile, icon: UserRound }];
  return <div className="rk-app min-h-[100dvh]"><div className="rk-desktop-shell flex min-h-[100dvh]"><aside className="rk-desktop-nav sticky top-0 flex h-[100dvh] w-[230px] shrink-0 flex-col border-r border-slate-800/60 px-5 py-7"><BrandMark /><div className="mt-14 space-y-2">{nav.map((item) => <NavItem key={item.key} active={tab === item.key} icon={item.icon} label={item.label} onClick={() => setTab(item.key)} testId={`nav-${item.key}`} />)}</div><div className="mt-auto rounded-2xl border border-cyan-300/15 bg-cyan-300/[.04] p-4"><div className="flex items-center gap-2 text-cyan-200"><ShieldCheck size={16} /><span className="text-xs font-bold">Grid verified</span></div><p className="mt-2 text-[11px] leading-5 text-slate-500">Your identity is private, portable and always yours.</p></div></aside><div className="min-w-0 flex-1"><header className="sticky top-0 z-30 border-b border-slate-800/50 bg-[#0a0f1c]/80 backdrop-blur-xl"><div className="flex h-[76px] items-center justify-between px-5 sm:px-8"><div className="md:hidden"><BrandMark compact /></div><div className="hidden md:block"><span className="rk-mono text-[10px] uppercase tracking-[.22em] text-slate-600">National blood grid / donor console</span></div><div className="flex items-center gap-2"><LanguageToggle language={language} onChange={onLanguage} /><button type="button" onClick={() => setTab('profile')} className="rk-button grid h-10 w-10 place-items-center rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 hover:border-cyan-300/35" data-testid="button-open-profile"><CircleUserRound size={18} /></button></div></div></header><main className="mx-auto max-w-[920px] px-5 pb-28 pt-8 sm:px-8 md:pb-10">{tab === 'overview' && <Dashboard profile={profile} language={language} onCard={() => setTab('card')} onLog={() => setShowDonation(true)} onNotice={notify} />}{tab === 'card' && <div className="rk-fade-up"><div className="mb-6"><p className="rk-mono text-[10px] uppercase tracking-[.2em] text-cyan-300/75">Always with you</p><h1 className="rk-display mt-2 text-3xl font-bold tracking-[-.04em] text-white">Your donor card</h1><p className="mt-2 text-sm text-slate-400">One scan tells the story you choose to share.</p></div><DonorCard profile={profile} onQr={() => setShowQr(true)} /><div className="mt-5 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setShowQr(true)} className="rk-button flex items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[.07] py-3 text-xs font-bold text-cyan-200 hover:bg-cyan-300/[.13]" data-testid="button-show-qr"><QrCode size={16} /> Open live QR pass</button><button type="button" onClick={() => notify('Donor card link copied to your clipboard.')} className="rk-button flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 py-3 text-xs font-bold text-slate-300 hover:border-slate-500" data-testid="button-share-card"><Copy size={16} /> Copy card link</button></div><div className="rk-glass mt-5 rounded-[22px] p-5"><div className="flex items-center gap-3"><TicketCheck size={19} className="text-red-300" /><div><p className="text-sm font-bold text-slate-200">Accepted across the grid</p><p className="mt-1 text-xs text-slate-500">Show your QR at verified partner camps to sync your history.</p></div></div></div></div>}{tab === 'history' && <HistoryView profile={profile} onLog={() => setShowDonation(true)} />}{tab === 'profile' && <ProfileView profile={profile} setProfile={setProfile} language={language} onNotice={notify} onLogout={onLogout} />}</main></div></div><nav className="rk-mobile-nav rk-safe-bottom fixed bottom-0 left-0 right-0 z-30 border-t border-slate-800/70 bg-[#0a0f1c]/90 px-3 pt-2 backdrop-blur-xl"><div className="mx-auto flex max-w-md items-center justify-around">{nav.map((item) => <button key={item.key} type="button" onClick={() => setTab(item.key)} className={`flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-semibold ${tab === item.key ? 'rk-tab-active' : 'text-slate-600'}`} data-testid={`mobile-nav-${item.key}`}><item.icon size={19} /><span>{item.label}</span></button>)}</div></nav>{showQr && <QrModal profile={profile} onClose={() => setShowQr(false)} />}{showDonation && <DonationModal onClose={() => setShowDonation(false)} onSave={addDonation} />}<Notice message={notice} onClose={() => setNotice(null)} /></div>;
}

function Router() {
  const [, setLocation] = useLocation();
  const [language, setLanguage] = useState<Language>(() => readStorage<Language>('rk-language', 'en'));
  const [profile, setProfile] = useState<DonorProfile | null>(() => readStorage<DonorProfile | null>('rk-profile', null));
  const [biometric, setBiometric] = useState(() => readStorage<boolean>('rk-biometric', false));
  const [step, setStep] = useState<AuthStep>(() => readStorage<boolean>('rk-seen', false) ? 'onboarding' : 'splash');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  useEffect(() => { window.localStorage.setItem('rk-language', JSON.stringify(language)); }, [language]);
  useEffect(() => { window.localStorage.setItem('rk-biometric', JSON.stringify(biometric)); }, [biometric]);
  useEffect(() => { if (profile) window.localStorage.setItem('rk-profile', JSON.stringify(profile)); else window.localStorage.removeItem('rk-profile'); }, [profile]);
  useEffect(() => { if (profile) setLocation('/home'); }, [profile, setLocation]);
  const complete = () => {
    const generated: DonorProfile = { ...defaultProfile, phone: phone || defaultProfile.phone, donorId: `RKT-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}` };
    setProfile(generated);
    window.localStorage.setItem('rk-seen', JSON.stringify(true));
  };
  const logout = () => { setProfile(null); setStep('phone'); setPhone(''); setOtp(''); setLocation('/'); };
  return <Switch><Route path="/home">{profile ? <WalletApp profile={profile} setProfile={setProfile} language={language} onLanguage={setLanguage} onLogout={logout} /> : <AuthFlow language={language} step="phone" phone={phone} otp={otp} biometric={biometric} onStep={setStep} onPhone={setPhone} onOtp={setOtp} onBiometric={setBiometric} onLanguage={setLanguage} onComplete={complete} />}</Route><Route path="/"><AuthFlow language={language} step={step} phone={phone} otp={otp} biometric={biometric} onStep={(next) => { setStep(next); if (next !== 'splash') window.localStorage.setItem('rk-seen', JSON.stringify(true)); }} onPhone={setPhone} onOtp={setOtp} onBiometric={setBiometric} onLanguage={setLanguage} onComplete={complete} /></Route><Route component={NotFound} /></Switch>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><ErrorBoundary resetKey={window.location.pathname}><Router /></ErrorBoundary></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;