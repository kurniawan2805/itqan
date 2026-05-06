import { useEffect, useMemo, useState } from 'react';
import { BookOpen, BarChart3, Settings, Zap } from 'lucide-react';
import { db, getSettings, type ProgressRecord, type SettingsRecord } from '../lib/db';
import { calculateDailyTargets } from '../lib/scheduler';
import type { DailyTarget } from '../lib/scheduler';
import MushafView from './MushafView';
import OnboardingView from './OnboardingView';
import SettingsView from './SettingsView';
import StudyView from './StudyView';

type Tab = 'dashboard' | 'mushaf' | 'settings' | 'study';

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [page, setPage] = useState(() => Number(new URLSearchParams(location.search).get('page')) || 1);
  const [settings, setSettings] = useState<SettingsRecord | null>(null);
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [emergency, setEmergency] = useState(false);
  const [studyTarget, setStudyTarget] = useState<DailyTarget | null>(null);
  const [mushafTarget, setMushafTarget] = useState<DailyTarget | null>(null);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    const [nextSettings, nextProgress] = await Promise.all([getSettings(), db.progress.toArray()]);
    setSettings(nextSettings);
    setProgress(nextProgress);
  }

  function openPage(nextPage: number) {
    const safePage = Math.min(604, Math.max(1, nextPage));
    setPage(safePage);
    setMushafTarget(null);
    setTab('mushaf');
    history.replaceState(null, '', `?page=${safePage}`);
  }

  function changeMushafPage(nextPage: number) {
    const safePage = Math.min(604, Math.max(1, nextPage));
    setPage(safePage);
    history.replaceState(null, '', `?page=${safePage}`);
  }

  function openFullMushaf() {
    setMushafTarget(null);
    setTab('mushaf');
  }

  function openStudy(target: DailyTarget) {
    if (target.type !== 'sabaq') {
      setMushafTarget(target);
      setPage(target.pages[0] ?? page);
      setTab('mushaf');
      return;
    }

    setStudyTarget(target);
    setTab('study');
  }

  const targets = useMemo(() => (settings ? calculateDailyTargets(progress, settings, emergency) : []), [settings, progress, emergency]);

  return (
    <div className={`app-shell ${tab === 'mushaf' || tab === 'study' ? 'mushaf-mode' : ''}`}>
      <main className="main-panel">
        {settings && !settings.onboarding_complete && <OnboardingView settings={settings} onDone={refresh} />}
        {settings?.onboarding_complete && tab === 'dashboard' && settings && (
          <section className="dashboard">
            <header className="hero">
              <div>
                <p className="eyebrow">Itqan Flow</p>
                <h1>{settings.display_name ? `Assalamu alaikum, ${settings.display_name}` : 'Jadwal tahfidz hari ini'}</h1>
                <p>{new Intl.DateTimeFormat('id', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</p>
              </div>
              <button className={`icon-command ${emergency ? 'active' : ''}`} onClick={() => setEmergency((value) => !value)} aria-label="Emergency mode">
                <Zap size={20} />
              </button>
            </header>

            <div className="target-grid">
              {targets.map((target) => (
                <article className="target-card" key={target.type}>
                  <div>
                    <span className="badge">{target.type}</span>
                    <h2>{target.label}</h2>
                    <p className="target-description">{describeTarget(target.type)}</p>
                    <p>{target.pages.length ? `Halaman ${formatPages(target.pages)}` : 'Belum ada halaman hafalan.'}</p>
                  </div>
                  <button disabled={!target.pages.length} onClick={() => openStudy(target)}>
                    {target.type === 'sabaq' ? 'Mulai hafalan' : 'Mulai murajaah'}
                  </button>
                </article>
              ))}
            </div>

            <section className="source-note">
              <BookOpen size={18} />
              <p>Target hari ini dibuat dari jalur hafalan, range yang sudah dicatat, dan jadwal murajaah. Progres tetap tersimpan lokal di perangkat ini.</p>
            </section>
          </section>
        )}

        {settings?.onboarding_complete && tab === 'mushaf' && settings && <MushafView page={page} settings={settings} reviewTarget={mushafTarget} onPageChange={changeMushafPage} onHome={() => setTab('dashboard')} onMenu={() => setTab('settings')} onProgressChanged={refresh} />}
        {settings?.onboarding_complete && tab === 'study' && settings && studyTarget && <StudyView target={studyTarget} settings={settings} onBack={() => setTab('dashboard')} onDone={refresh} />}
        {settings?.onboarding_complete && tab === 'settings' && settings && <SettingsView settings={settings} onChanged={refresh} />}
      </main>

      {settings?.onboarding_complete && tab !== 'mushaf' && tab !== 'study' && (
        <nav className="bottom-nav">
          <button className={tab === 'dashboard' ? 'selected' : ''} onClick={() => setTab('dashboard')}>
            <BarChart3 size={20} />
            Dashboard
          </button>
          <button onClick={openFullMushaf}>
            <BookOpen size={20} />
            Mushaf
          </button>
          <button className={tab === 'settings' ? 'selected' : ''} onClick={() => setTab('settings')}>
            <Settings size={20} />
            Settings
          </button>
        </nav>
      )}
    </div>
  );
}

function formatPages(pages: number[]) {
  if (pages.length === 1) return String(pages[0]);
  return `${pages[0]}-${pages[pages.length - 1]}`;
}

function describeTarget(type: string) {
  if (type === 'sabaq') return 'Hafalan baru yang dikejar hari ini.';
  if (type === 'sabqi') return 'Ulangan hafalan baru agar cepat kuat.';
  if (type === 'manzil') return 'Murajaah hafalan lama supaya tetap lancar.';
  return '';
}
