import { useState, useRef, useCallback } from 'react';
import {
  Bold, Italic, Heading2, Heading3, List, Quote,
  Code, Image, Eye, EyeOff, Loader2, Minus, Table, ListOrdered, Link
} from 'lucide-react';
import { parseMarkdown } from '../utility/markdownParser';

const TOOLBAR = [
  { icon: Bold,        label: 'Жирный',          wrap: ['**', '**'],                       placeholder: 'текст' },
  { icon: Italic,      label: 'Курсив',           wrap: ['*', '*'],                         placeholder: 'текст' },
  { sep: true },
  { icon: Heading2,    label: 'Заголовок 2',      prefix: '## ',                            placeholder: 'Заголовок' },
  { icon: Heading3,    label: 'Заголовок 3',      prefix: '### ',                           placeholder: 'Заголовок' },
  { sep: true },
  { icon: List,        label: 'Маркированный список', prefix: '- ',                         placeholder: 'Пункт' },
  { icon: ListOrdered, label: 'Нумерованный список',  prefix: '1. ',                        placeholder: 'Пункт' },
  { icon: Quote,       label: 'Цитата',           prefix: '> ',                             placeholder: 'Цитата' },
  { sep: true },
  { icon: Code,        label: 'Блок кода',        wrap: ['```\n', '\n```'],                 placeholder: 'код' },
  { icon: Link,        label: 'Ссылка',           wrap: ['[', '](url)'],                    placeholder: 'текст' },
  { icon: Table,       label: 'Таблица',
    insert: '| Заголовок 1 | Заголовок 2 | Заголовок 3 |\n| --- | --- | --- |\n| Ячейка 1 | Ячейка 2 | Ячейка 3 |\n' },
  { icon: Minus,       label: 'Разделитель',      insert: '\n---\n' },
];

const MarkdownEditor = ({ value, onChange, onImageUpload, uploadingImage }) => {
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef(null);

  const insertAtCursor = useCallback((action) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start    = ta.selectionStart;
    const end      = ta.selectionEnd;
    const selected = value.slice(start, end) || action.placeholder || '';

    let newText, newStart, newEnd;

    if (action.insert) {
      // Вставка готового блока
      newText  = value.slice(0, start) + action.insert + value.slice(end);
      newStart = start + action.insert.length;
      newEnd   = newStart;
    } else if (action.wrap) {
      const [before, after] = action.wrap;
      newText  = value.slice(0, start) + before + selected + after + value.slice(end);
      newStart = start + before.length;
      newEnd   = newStart + selected.length;
    } else if (action.prefix) {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      newText  = value.slice(0, lineStart) + action.prefix + value.slice(lineStart);
      newStart = start + action.prefix.length;
      newEnd   = newStart;
    }

    onChange(newText);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(newStart, newEnd);
    });
  }, [value, onChange]);

  const insertImage = useCallback((url) => {
    const ta  = textareaRef.current;
    const pos = ta ? ta.selectionStart : value.length;
    const insert = `\n![Изображение](${url})\n`;
    onChange(value.slice(0, pos) + insert + value.slice(pos));
  }, [value, onChange]);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-border bg-muted/30 flex-wrap">
        {TOOLBAR.map((item, i) =>
          item.sep
            ? <div key={i} className="w-px h-5 bg-border mx-1" />
            : (
              <button
                key={i}
                type="button"
                title={item.label}
                onClick={() => insertAtCursor(item)}
                disabled={preview}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition disabled:opacity-30"
              >
                <item.icon size={15} />
              </button>
            )
        )}

        {/* Image upload */}
        <div className="w-px h-5 bg-border mx-1" />
        <label
          title="Загрузить изображение"
          className={`p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer ${
            preview || uploadingImage ? 'opacity-30 pointer-events-none' : ''
          }`}
        >
          {uploadingImage
            ? <Loader2 size={15} className="animate-spin" />
            : <Image size={15} />
          }
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              e.target.value = '';
              const url = await onImageUpload(file);
              if (url) insertImage(url);
            }}
          />
        </label>

        {/* Preview toggle */}
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setPreview(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              preview
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {preview ? <><EyeOff size={13} /> Редактор</> : <><Eye size={13} /> Предпросмотр</>}
          </button>
        </div>
      </div>

      {/* Editor / Preview */}
      {preview ? (
        <>
          <style>{`
            .md-h1{font-size:26px;font-weight:700;margin:0 0 1rem;color:var(--foreground)}
            .md-h2{font-size:20px;font-weight:600;margin:1.5rem 0 .75rem;color:var(--foreground)}
            .md-h3{font-size:16px;font-weight:600;margin:1.25rem 0 .5rem;color:var(--foreground)}
            .md-p{font-size:15px;line-height:1.8;color:var(--foreground);margin:0 0 1rem}
            .md-ul,.md-ol{padding-left:1.25rem;margin:.75rem 0}
            .md-li,.md-oli{font-size:15px;line-height:1.8;color:var(--foreground);margin-bottom:3px}
            .md-blockquote{border-left:3px solid hsl(var(--border));margin:1rem 0;padding:10px 16px;background:hsl(var(--muted));border-radius:0 8px 8px 0;color:hsl(var(--muted-foreground));font-size:14px}
            .md-hr{border:none;border-top:1px solid hsl(var(--border));margin:1.5rem 0}
            .md-link{color:hsl(var(--primary));text-decoration:underline}
            .md-code-block{background:hsl(220 14% 11%);border:1px solid hsl(220 14% 18%);border-radius:8px;margin:1rem 0;overflow:hidden;position:relative}
            .md-code-lang{position:absolute;top:8px;right:12px;font-size:11px;font-family:monospace;color:hsl(220 14% 55%);text-transform:uppercase;letter-spacing:.06em}
            .md-code-block pre{margin:0;padding:16px 18px;overflow-x:auto}
            .md-code{font-family:ui-monospace,monospace;font-size:13px;line-height:1.7;color:hsl(220 14% 88%);white-space:pre;display:block}
            .md-inline-code{font-family:ui-monospace,monospace;font-size:13px;background:hsl(var(--muted));border:1px solid hsl(var(--border));border-radius:4px;padding:2px 6px}
            .md-img{max-width:100%;border-radius:8px;margin:8px 0;display:block;border:1px solid hsl(var(--border))}
            .md-table{width:100%;border-collapse:collapse;margin:1rem 0;font-size:14px}
            .md-table th{background:hsl(var(--muted));font-weight:600;padding:8px 12px;border:1px solid hsl(var(--border));text-align:left}
            .md-table td{padding:7px 12px;border:1px solid hsl(var(--border));color:var(--foreground)}
            .md-table tr:nth-child(even) td{background:hsl(var(--muted)/.4)}
          `}</style>
          <div
            className="min-h-64 p-5 bg-background"
            dangerouslySetInnerHTML={{
              __html: parseMarkdown(value, 'md') ||
                '<p style="color:hsl(var(--muted-foreground));font-size:14px">Нет содержимого...</p>'
            }}
          />
        </>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={"# Заголовок урока\n\nНачните писать содержание..."}
          rows={14}
          className="w-full px-4 py-3 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none font-mono text-sm resize-y leading-relaxed"
          style={{ display: 'block' }}
        />
      )}
    </div>
  );
};

export default MarkdownEditor;
