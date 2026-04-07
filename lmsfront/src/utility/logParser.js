import { AlertCircle, AlertTriangle, Info, Clock } from 'lucide-react';

// ─── Конфигурация уровней логов ───────────────────────────────────────────────
export const LEVEL_CONFIG = {
  ERROR:   { cls: 'text-red-500',          bg: 'bg-red-500/10',    icon: AlertCircle,   label: 'ERROR' },
  WARNING: { cls: 'text-yellow-500',       bg: 'bg-yellow-500/10', icon: AlertTriangle, label: 'WARN'  },
  WARN:    { cls: 'text-yellow-500',       bg: 'bg-yellow-500/10', icon: AlertTriangle, label: 'WARN'  },
  INFO:    { cls: 'text-blue-400',         bg: 'bg-blue-500/10',   icon: Info,          label: 'INFO'  },
  DEBUG:   { cls: 'text-muted-foreground', bg: 'bg-muted',         icon: Clock,         label: 'DEBUG' },
};

export const getLevelConfig = (level) =>
  LEVEL_CONFIG[level?.toUpperCase()] || LEVEL_CONFIG.INFO;

// ─── Парсинг одной строки ─────────────────────────────────────────────────────
// Формат: "Log: 2026-04-02T05:44:28.331860+0000 -- INFO -- Сообщение -- file.py:12 func\n"
export const parseLogLine = (raw) => {
  try {
    const clean = raw.replace(/^Log:\s*/, '').trim();
    const parts = clean.split(' -- ');

    const timestamp = parts[0]?.trim() || '';
    const level     = parts[1]?.trim() || 'INFO';
    const message   = parts[2]?.trim() || clean;
    const source    = parts[3]?.trim() || '';

    const date = new Date(timestamp);
    const valid = !isNaN(date.getTime());

    const time = valid
      ? date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : timestamp;

    const dateStr = valid
      ? date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '';

    return { timestamp, time, date: dateStr, level, message, source, raw };
  } catch {
    return { timestamp: '', time: '', level: 'INFO', message: raw.trim(), source: '', raw };
  }
};

// ─── Парсинг массива строк ────────────────────────────────────────────────────
export const parseLogLines = (lines = []) => lines.map(parseLogLine);

// ─── Фильтры ──────────────────────────────────────────────────────────────────
export const isError   = (log) => ['ERROR', 'WARNING', 'WARN'].includes(log.level?.toUpperCase());
export const isInfo    = (log) => !isError(log);
export const filterByLevel = (logs, level) =>
  level === 'all' ? logs : logs.filter(l => l.level?.toUpperCase() === level.toUpperCase());
