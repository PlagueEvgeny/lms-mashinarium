import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Clock, BookOpen, X, FileText } from 'lucide-react';
import { parseMarkdown, LESSON_CSS } from '../../utility/markdownParser';

const LectureLesson = ({ lesson, onPrev, onNext, hasPrev, hasNext, blockNext = false }) => {
  const [lightbox, setLightbox] = useState(null);
  const contentRef = useRef(null);
  const readTime = Math.max(1, Math.ceil((lesson.content || '').split(' ').length / 200));
  const materials = lesson?.materials || [];

  const handleContentClick = (e) => {
    if (e.target.tagName === 'IMG' && e.target.dataset.src) {
      setLightbox(e.target.dataset.src);
    }
  };

  return (
    <>
      <style>{LESSON_CSS}</style>

      <div className="flex flex-col gap-6">
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

        <div className="bg-card rounded-2xl border border-border p-8">
          <div
            ref={contentRef}
            onClick={handleContentClick}
            dangerouslySetInnerHTML={{ __html: parseMarkdown(lesson.content, 'lesson') }}
          />
        </div>

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
            disabled={!hasNext || blockNext}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition disabled:opacity-30 disabled:pointer-events-none"
          >
            Следующий <ChevronRight size={16} />
          </button>
        </div>
      </div>

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
