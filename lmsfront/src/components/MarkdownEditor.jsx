import { useState, useRef, useCallback } from 'react';
import {
  Bold, Italic, Heading2, Heading3, List, Quote,
  Code, Image, Eye, EyeOff, Upload, X, Loader2
} from 'lucide-react';

const parseMarkdown = (md) => {
  if (!md) return '';
  return md
    // Заголовки
    .replace(/^### (.+)$/gm, '<h3 style="font-size:16px;font-weight:600;margin:1.25rem 0 .5rem;color:var(--foreground)">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 style="font-size:20px;font-weight:600;margin:1.5rem 0 .75rem;color:var(--foreground)">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 style="font-size:26px;font-weight:700;margin:0 0 1rem;color:var(--foreground)">$1</h1>')

    // Код
    .replace(/```(\w+)?\n([\s\S]*?)```/gm, (_, lang, code) =>
      `<pre style="background:hsl(var(--muted));border:1px solid hsl(var(--border));border-radius:8px;padding:14px 16px;overflow-x:auto;margin:1rem 0;position:relative">` +
      `${lang ? `<span style="position:absolute;top:8px;right:12px;font-size:11px;font-family:monospace;opacity:.5;text-transform:uppercase">${lang}</span>` : ''}` +
      `<code style="font-family:monospace;font-size:13px;line-height:1.7">${code.trim().replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code></pre>`
    )
    .replace(/`([^`]+)`/g, '<code style="font-family:monospace;font-size:13px;background:hsl(var(--muted));border:1px solid hsl(var(--border));border-radius:4px;padding:2px 6px">$1</code>')

    // Цитаты и списки
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid hsl(var(--border));margin:1rem 0;padding:10px 16px;background:hsl(var(--muted));border-radius:0 8px 8px 0;color:hsl(var(--muted-foreground));font-size:15px">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li style="margin-bottom:4px;line-height:1.7">$1</li>')
    .replace(/(<li[\s\S]*?<\/li>\n?)+/g, m => `<ul style="padding-left:1.25rem;margin:.75rem 0">${m}</ul>`)

    // Жирный, курсив, подчёркнутый
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/__(.+?)__/g, '<u>$1</u>')

    // Горизонтальная линия
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid hsl(var(--border));margin:1rem 0">')

    // Ссылки
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:var(--primary)">$1</a>')

    // Таблицы
    .replace(/\|(.+)\|\n\|(?:[-\s|:]+)\|\n((?:\|.*\|\n?)*)/gm, (_, header, rows) => {
      const headers = header.split('|').map(h => h.trim());
      const rowHtml = rows.trim().split('\n').map(r => {
        const cells = r.split('|').map(c => c.trim());
        return `<tr>${cells.map(c => `<td style="border:1px solid hsl(var(--border));padding:4px 8px">${c}</td>`).join('')}</tr>`;
      }).join('');
      return `<table style="border-collapse:collapse;margin:1rem 0;width:100%"><thead><tr>${headers.map(h => `<th style="border:1px solid hsl(var(--border));padding:4px 8px;text-align:left">${h}</th>`).join('')}</tr></thead><tbody>${rowHtml}</tbody></table>`;
    })

    // Изображения
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:8px 0;display:block">')

    // Параграфы
    .replace(/\n\n/g, '</p><p style="margin:0 0 1rem;line-height:1.8">')
    .replace(/^(?!<[h|p|u|c|b|i|t|u])(.+)$/gm, '<p style="margin:0 0 1rem;line-height:1.8">$1</p>')
    .replace(/<p style="[^"]+"><\/p>/g, '');
};

const TOOLBAR = [
  { icon: Bold,     label: 'Жирный',        wrap: ['**', '**'],     placeholder: 'текст' },
  { icon: Italic,   label: 'Курсив',        wrap: ['*', '*'],       placeholder: 'текст' },
  { sep: true },
  { icon: Heading2, label: 'Заголовок 2',   prefix: '## ',          placeholder: 'Заголовок' },
  { icon: Heading3, label: 'Заголовок 3',   prefix: '### ',         placeholder: 'Заголовок' },
  { sep: true },
  { icon: List,     label: 'Список',        prefix: '- ',           placeholder: 'Пункт' },
  { icon: Quote,    label: 'Цитата',        prefix: '> ',           placeholder: 'Цитата' },
  { icon: Code,     label: 'Код',           wrap: ['```\n', '\n```'], placeholder: 'код' },
  { sep: true },
  { icon: Upload,   label: 'Горизонтальная линия', prefix: '---\n' },
  { icon: X,        label: 'Таблица',       wrap: ['| Заголовок1 | Заголовок2 |\n| --- | --- |\n', ''], placeholder: '| Ячейка1 | Ячейка2 |' },
];

const MarkdownEditor = ({ value, onChange, onImageUpload, uploadingImage }) => {
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef(null);

  const insertAtCursor = useCallback((action) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const selected = value.slice(start, end) || action.placeholder || '';

    let newText, newStart, newEnd;

    if (action.wrap) {
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
    const ta = textareaRef.current;
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
          className={`p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer ${preview || uploadingImage ? 'opacity-30 pointer-events-none' : ''}`}
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
        <div
          className="min-h-[280px] p-5 prose max-w-none text-foreground bg-background"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(value) || '<p style="color:hsl(var(--muted-foreground))">Нет содержимого...</p>' }}
        />
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
