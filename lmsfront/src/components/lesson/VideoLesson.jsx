// VideoLesson.jsx
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Clock, Video, FileText } from 'lucide-react';
import HLSPlayer from '../HLSPlayer';
import BigBlueButtonPlayer from '../BigBlueButtonPlayer';

const getEmbedUrl = (url) => {
  if (!url) return null;
  try {
    const u = new URL(url);

    if (u.hostname.includes('youtube.com'))
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}?rel=0&modestbranding=1`;
    if (u.hostname.includes('youtu.be'))
      return `https://www.youtube.com/embed${u.pathname}?rel=0&modestbranding=1`;
    if (u.hostname.includes('vimeo.com'))
      return `https://player.vimeo.com/video/${u.pathname.replace('/', '')}`;
    if (u.hostname.includes('rutube.ru')) {
      const id = u.pathname.split('/video/')[1]?.split('/')[0] ?? u.searchParams.get('video_id');
      return id ? `https://rutube.ru/play/embed/${id}` : null;
    }
    if (u.hostname.includes('vkvideo.ru') || u.hostname.includes('vk.com')) {
      const m = u.pathname.match(/video(-?\d+_\d+)/);
      if (m) {
        const [oid, id] = m[1].split('_');
        return `https://vk.com/video_ext.php?oid=${oid}&id=${id}&hd=2`;
      }
    }
    return url;
  } catch {
    return url;
  }
};

const isBBB = (url) =>
  !!url && (url.includes('bigbluebutton') || url.includes('/playback/presentation/') || url.includes('education45.ru/playback'));

const formatDuration = (s) => {
  if (!s) return '';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}:${m.toString().padStart(2, '0')}` : `${m} мин`;
};

const VideoLesson = ({ lesson, onPrev, onNext, hasPrev, hasNext, blockNext = false, isLast = false, onFinish }) => {
  const [fallbackPlaying, setFallbackPlaying] = useState(false);
  const [bbbStatus, setBbbStatus] = useState(null); // null | 'ready' | 'error'

  const materials = lesson?.materials || [];
  const url = lesson.video_url;
  const embedUrl = getEmbedUrl(url);
  const isBbbUrl = isBBB(url);

  const isYoutube  = embedUrl?.includes('youtube.com/embed');
  const isVimeo    = embedUrl?.includes('vimeo.com/video');
  const isRutube   = embedUrl?.includes('rutube.ru/play/embed');
  const isVKVideo  = embedUrl?.includes('vk.com/video_ext.php');
  const isEmbed    = isYoutube || isVimeo || isRutube || isVKVideo;
  const isHLS      = url?.includes('.m3u8');
  const isDirect   = url?.match(/\.(mp4|webm|ogg)(\?|$)/i);

  const playerLabel = isYoutube ? 'YouTube'
    : isVimeo    ? 'Vimeo'
    : isRutube   ? 'Rutube'
    : isVKVideo  ? 'VK Video'
    : isBbbUrl   ? 'BigBlueButton'
    : isDirect   ? 'Видеофайл'
    : isHLS      ? 'HLS стрим'
    : 'Внешний плеер';

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
            <Video size={17} className="text-primary" />
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Видеоурок</span>
          {lesson.duration && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock size={13} /> {formatDuration(lesson.duration)}
              </span>
            </>
          )}
          <span className="text-muted-foreground">·</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            bbbStatus === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-muted/50 text-muted-foreground'
          }`}>
            {playerLabel}{bbbStatus === 'ready' ? ' ✓' : ''}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">{lesson.name}</h1>
      </div>

      {/* Player */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {isBbbUrl && (
          <BigBlueButtonPlayer
            url={url}
            title={lesson.name}
            onReady={() => setBbbStatus('ready')}
            onError={() => setBbbStatus('error')}
          />
        )}

        {isEmbed && (
          <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            <iframe
              src={embedUrl}
              title={lesson.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
              style={{ border: 'none' }}
            />
          </div>
        )}

        {isDirect && !isEmbed && !isBbbUrl && (
          <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            <video src={url} controls controlsList="nodownload"
              className="absolute inset-0 w-full h-full bg-black">
              Ваш браузер не поддерживает воспроизведение видео
            </video>
          </div>
        )}

        {isHLS && !isEmbed && !isBbbUrl && !isDirect && (
          <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            <HLSPlayer src={url} />
          </div>
        )}

        {!isEmbed && !isDirect && !isBbbUrl && !isHLS && (
          <div
            className="relative w-full flex flex-col items-center justify-center gap-4 bg-muted/30 cursor-pointer group"
            style={{ minHeight: 320 }}
            onClick={() => setFallbackPlaying(true)}
          >
            {!fallbackPlaying ? (
              <>
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Play size={28} className="text-primary-foreground translate-x-0.5" />
                </div>
                <p className="text-sm text-muted-foreground">Нажмите для воспроизведения</p>
                <p className="text-xs text-muted-foreground/60 max-w-md text-center px-4 break-all">{url}</p>
              </>
            ) : (
              <iframe src={url} title={lesson.name} allowFullScreen
                className="w-full h-full absolute inset-0" style={{ border: 'none', minHeight: 320 }} />
            )}
          </div>
        )}

        {url && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground truncate max-w-sm" title={url}>{url}</p>
            {lesson.duration && (
              <span className="text-sm text-muted-foreground shrink-0 ml-4">{formatDuration(lesson.duration)}</span>
            )}
          </div>
        )}
      </div>

      {/* Materials */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} className="text-primary" />
          <h2 className="text-base font-semibold">Материалы</h2>
        </div>

        {materials.length === 0 ? (
          <p className="text-sm text-muted-foreground">Материалы не прикреплены.</p>
        ) : (
          <ul className="space-y-2">
            {materials.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3">
                <a
                  href={m.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary hover:underline truncate"
                  title={m.title}
                >
                  {m.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={onPrev} disabled={!hasPrev}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm hover:bg-muted/40 transition disabled:opacity-30 disabled:pointer-events-none">
          <ChevronLeft size={16} /> Предыдущий
        </button>
        {isLast ? (
          <button
            onClick={onFinish}
            disabled={blockNext}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-600/90 transition disabled:opacity-30 disabled:pointer-events-none"
          >
            Завершить курс ✓
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={!hasNext || blockNext}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition disabled:opacity-30 disabled:pointer-events-none"
          >
            Следующий <ChevronRight size={16} />
          </button>
          )}
      </div>
    </div>
  );
};

export default VideoLesson;
