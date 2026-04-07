import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { RefreshCw, Search, Terminal } from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';
import Sidebar from '../../components/Sidebar';
import { parseLogLines, getLevelConfig, LEVEL_CONFIG } from '../../utility/logParser';

const ROW_HEIGHT = 56;
const OVERSCAN   = 10;

const VirtualList = ({ items, rowHeight = ROW_HEIGHT, containerHeight = 600, renderRow }) => {
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight  = items.length * rowHeight;
  const startIndex   = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN);
  const visibleCount = Math.ceil(containerHeight / rowHeight) + OVERSCAN * 2;
  const endIndex     = Math.min(items.length - 1, startIndex + visibleCount);
  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetTop    = startIndex * rowHeight;

  return (
    <div
      style={{ height: containerHeight, overflowY: 'auto' }}
      onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ position: 'absolute', top: offsetTop, left: 0, right: 0 }}>
          {visibleItems.map((item, i) => renderRow(item, startIndex + i))}
        </div>
      </div>
    </div>
  );
};

// ─── Debounce хук ─────────────────────────────────────────────────────────────
const useDebounce = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const LogsAdminPage = () => {
  const { fetchListLogs } = useAdmin();

  const [logs, setLogs]               = useState([]);
  const [loading, setLoading]         = useState(false);
  const [search, setSearch]           = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchListLogs();
      const raw = Array.isArray(data?.logs) ? data.logs : [];
      setLogs(parseLogLines(raw).reverse());
    } catch {
      // toast уже показан внутри fetchListLogs
    } finally {
      setLoading(false);
    }
  }, [fetchListLogs]);

  useEffect(() => { loadLogs(); }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(loadLogs, 5000);
    return () => clearInterval(id);
  }, [autoRefresh, loadLogs]);

  const filtered = useMemo(() => {
    const q   = debouncedSearch.toLowerCase();
    const lvl = levelFilter === 'all' ? null : levelFilter;
    return logs.filter(log => {
      if (lvl && log.level?.toUpperCase() !== lvl) return false;
      if (q && !log.message?.toLowerCase().includes(q) && !log.source?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [logs, debouncedSearch, levelFilter]);

  const stats = useMemo(() => {
    const counts = { ERROR: 0, WARNING: 0, INFO: 0, DEBUG: 0 };
    for (const l of logs) {
      const key = l.level?.toUpperCase();
      if (key in counts) counts[key]++;
    }
    return counts;
  }, [logs]);

  const renderRow = useCallback((log, i) => {
    const cfg  = getLevelConfig(log.level);
    const Icon = cfg.icon;
    return (
      <div
        key={i}
        style={{ height: ROW_HEIGHT }}
        className="flex items-center gap-3 px-5 border-b border-border hover:bg-muted/20 transition"
      >
        <div className={`shrink-0 w-6 h-6 rounded-md ${cfg.bg} flex items-center justify-center`}>
          <Icon size={12} className={cfg.cls} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground truncate">{log.message}</p>
          {log.source && (
            <p className="text-xs text-muted-foreground font-mono truncate">{log.source}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground font-mono">{log.time}</p>
          <p className="text-xs text-muted-foreground font-mono">{log.date}</p>
        </div>
      </div>
    );
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      <Helmet><title>Журнал событий</title></Helmet>
      <Sidebar />
      <Toaster position="top-center" />
      <main className="md:ml-64 flex-1 overflow-auto">
        <div className="p-8">

          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Журнал событий</h1>
              <p className="text-muted-foreground mt-1">Свежие записи сверху</p>
            </div>
            <button
              onClick={loadLogs}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-foreground hover:bg-muted/40 transition disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Обновить
            </button>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Object.entries(stats).map(([level, count]) => {
              const cfg    = getLevelConfig(level);
              const Icon   = cfg.icon;
              const active = levelFilter === level;
              return (
                <button
                  key={level}
                  onClick={() => setLevelFilter(active ? 'all' : level)}
                  className={`bg-card rounded-xl border p-4 text-left transition hover:border-primary/30 ${
                    active ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                      <Icon size={14} className={cfg.cls} />
                    </div>
                    <span className={`text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{count}</p>
                </button>
              );
            })}
          </div>

          {/* Toolbar */}
          <div className="bg-card rounded-xl border border-border p-4 mb-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Поиск по сообщению или файлу..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>

            <select
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value)}
              className="px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
            >
              <option value="all">Все уровни</option>
              {Object.keys(LEVEL_CONFIG).filter(k => k !== 'WARN').map(k => (
                <option key={k} value={k}>{LEVEL_CONFIG[k].label}</option>
              ))}
            </select>

            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer select-none shrink-0">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
                className="accent-primary"
              />
              Авто (5с)
            </label>
          </div>

          {/* Log viewer */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
              <Terminal size={14} className="text-primary" />
              <span className="text-sm font-semibold text-foreground">log.txt</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {filtered.length} / {logs.length} записей
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw size={20} className="animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">Записей не найдено</p>
            ) : (
              <VirtualList
                items={filtered}
                rowHeight={ROW_HEIGHT}
                containerHeight={600}
                renderRow={renderRow}
              />
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default LogsAdminPage;
