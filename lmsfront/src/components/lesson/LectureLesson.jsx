import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Clock, BookOpen, ZoomIn, X } from 'lucide-react';

const parseMarkdown = (md) => {
  if (!md) return '';
  return md
    .replace(/^### (.+)$/gm, '<h3 class="lesson-h3">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 class="lesson-h2">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 class="lesson-h1">$1</h1>')
    .replace(/```(\w+)?\n([\s\S]*?)```/gm, (_, lang, code) =>
      `<div class="lesson-code-block"><div class="lesson-code-lang">${lang || 'code'}</div>` +
      `<pre><code>${code.trim().replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code></pre></div>`
    )
    .replace(/`([^`]+)`/g, '<code class="lesson-inline-code">$1</code>')
    .replace(/^> (.+)$/gm,  '<blockquote class="lesson-blockquote">$1</blockquote>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1" class="lesson-img" data-src="$2" />'
    )
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,    '<em>$1</em>')
    .replace(/^- (.+)$/gm,  '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, m => `<ul class="lesson-ul">${m}</ul>`)
    .replace(/\n\n/g, '</p><p class="lesson-p">')
    .replace(/^(?!<[hulbcpi])(.+\S.*)$/gm, '<p class="lesson-p">$1</p>')
    .replace(/<p class="lesson-p"><\/p>/g, '');
};

const LectureLesson = ({ lesson, onPrev, onNext, hasPrev, hasNext }) => {
  const [lightbox, setLightbox] = useState(null);
  const contentRef = useRef(null);
  const readTime = Math.max(1, Math.ceil((lesson.content || '').split(' ').length / 200));

  const handleContentClick = (e) => {
    if (e.target.tagName === 'IMG' && e.target.dataset.src) {
      setLightbox(e.target.dataset.src);
    }
  };

  return (
    <>
      <style>{`
        .lesson-h1{font-size:28px;font-weight:600;color:var(--foreground);margin:0 0 1.25rem;line-height:1.3}
        .lesson-h2{font-size:21px;font-weight:600;color:var(--foreground);margin:2.25rem 0 .75rem;padding-bottom:10px;border-bottom:1px solid hsl(var(--border))}
        .lesson-h3{font-size:17px;font-weight:600;color:var(--foreground);margin:1.75rem 0 .5rem}
        .lesson-p{font-size:16px;line-height:1.85;color:var(--foreground);margin:0 0 1.1rem}
        .lesson-ul{padding-left:1.5rem;margin:.75rem 0 1.1rem}
        .lesson-ul li{font-size:16px;line-height:1.85;color:var(--foreground);margin-bottom:5px}
        .lesson-blockquote{border-left:3px solid hsl(var(--primary));margin:1.25rem 0;padding:12px 18px;background:hsl(var(--primary)/.06);border-radius:0 10px 10px 0;color:hsl(var(--muted-foreground));font-size:15px;line-height:1.7}
        .lesson-code-block{background:hsl(var(--muted));border:1px solid hsl(var(--border));border-radius:10px;margin:1.25rem 0;overflow:hidden;position:relative}
        .lesson-code-block pre{margin:0;padding:16px 20px;overflow-x:auto}
        .lesson-code-block code{font-family:ui-monospace,monospace;font-size:13.5px;line-height:1.75;color:var(--foreground)}
        .lesson-code-lang{position:absolute;top:10px;right:14px;font-size:11px;font-family:ui-monospace,monospace;color:hsl(var(--muted-foreground));text-transform:uppercase;letter-spacing:.06em}
        .lesson-inline-code{font-family:ui-monospace,monospace;font-size:13.5px;background:hsl(var(--muted));border:1px solid hsl(var(--border));border-radius:4px;padding:2px 7px}
        .lesson-img{max-width:100%;border-radius:10px;margin:1rem 0;display:block;cursor:zoom-in;border:1px solid hsl(var(--border));transition:opacity .2s}
        .lesson-img:hover{opacity:.9}
      `}</style>

      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
              <BookOpen size={17} className="text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Лекция</span>
            <span className="text-muted-foreground">·</span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock size={13} />
              {readTime} мин
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{lesson.name}</h1>
        </div>

        {/* Content */}
        <div className="bg-card rounded-2xl border border-border p-8">
          <div
            ref={contentRef}
            onClick={handleContentClick}
            dangerouslySetInnerHTML={{ __html: parseMarkdown(lesson.content) }}
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm text-foreground hover:bg-muted/40 transition disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft size={16} /> Предыдущий
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition disabled:opacity-30 disabled:pointer-events-none"
          >
            Следующий <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
          >
            <X size={20} />
          </button>
          <img
            src={lightbox}
            alt=""
            onClick={e => e.stopPropagation()}
            className="max-w-full max-h-[85vh] rounded-xl object-contain"
          />
        </div>
      )}
    </>
  );
};

export default LectureLesson;
