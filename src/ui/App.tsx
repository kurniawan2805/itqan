import { useEffect, useMemo, useState } from 'react';
import { BookOpen, BarChart3, Settings, Zap } from 'lucide-react';
import { db, getSettings, type ProgressRecord, type SettingsRecord } from '../lib/db';
import { calculateDailyTargets } from '../lib/scheduler';
import MushafView from './MushafView';
import SettingsView from './SettingsView';

type Tab = 'dashboard' | 'mushaf' | 'settings';

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [page, setPage] = useState(() => Number(new URLSearchParams(location.search).get('page')) || 1);
  const [settings, setSettings] = useState<SettingsRecord | null>(null);
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [emergency, setEmergency] = useState(false);

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
    setTab('mushaf');
    history.replaceState(null, '', `?page=${safePage}`);
  }

  const targets = useMemo(() => (settings ? calculateDailyTargets(progress, settings, emergency) : []), [settings, progress, emergency]);

  return (
    <div className="app-shell">
      <main className="main-panel">
        {tab === 'dashboard' && settings && (
          <section className="dashboard">
            <header className="hero">
              <div>
                <p className="eyebrow">Itqan Flow</p>
                <h1>Jadwal tahfidz hari ini</h1>
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
                    <p>{target.pages.length ? `Halaman ${formatPages(target.pages)}` : 'Belum ada halaman hafalan.'}</p>
                  </div>
                  <button disabled={!target.pages.length} onClick={() => openPage(target.pages[0])}>
                    Mulai
                  </button>
                </article>
              ))}
            </div>

            <section className="source-note">
              <BookOpen size={18} />
              <p>Mushaf menggunakan data statis QuranWBW dan cache lokal Itqan. Data progres pribadi tetap tersimpan hanya di perangkat ini.</p>
            </section>
          </section>
        )}

        {tab === 'mushaf' && settings && <MushafView page={page} settings={settings} onPageChange={openPage} onProgressChanged={refresh} />}
        {tab === 'settings' && settings && <SettingsView settings={settings} onChanged={refresh} />}
      </main>

      <nav className="bottom-nav">
        <button className={tab === 'dashboard' ? 'selected' : ''} onClick={() => setTab('dashboard')}>
          <BarChart3 size={20} />
          Dashboard
        </button>
        <button className={tab === 'mushaf' ? 'selected' : ''} onClick={() => setTab('mushaf')}>
          <BookOpen size={20} />
          Mushaf
        </button>
        <button className={tab === 'settings' ? 'selected' : ''} onClick={() => setTab('settings')}>
          <Settings size={20} />
          Settings
        </button>
      </nav>
    </div>
  );
}

function formatPages(pages: number[]) {
  if (pages.length === 1) return String(pages[0]);
  return `${pages[0]}-${pages[pages.length - 1]}`;
}
