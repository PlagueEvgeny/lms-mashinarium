// utils/markdownParser.js

const escHtml = (str) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const parseTables = (md, prefix) => {
  return md.replace(
    /^(\|.+\|)\n\|[\s|:-]+\|\n((?:\|.+\|\n?)*)/gm,
    (_, headerRow, bodyRows) => {
      const headers = headerRow.split('|').slice(1, -1).map(h => h.trim());
      const rows = bodyRows.trim().split('\n').map(row => {
        const cells = row.split('|').slice(1, -1).map(c => c.trim());
        return `<tr>${cells.map(c => `<td class="${prefix}-table-td">${c}</td>`).join('')}</tr>`;
      }).join('');
      
      return `
        <div class="${prefix}-table-wrap">
          <table class="${prefix}-table">
            <thead>
              <tr>${headers.map(h => `<th class="${prefix}-table-th">${h}</th>`).join('')}</tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    }
  );
};

const parseCodeBlocks = (md, prefix) => {
  return md.replace(/```([a-zA-Z0-9]*)\n([\s\S]*?)\n```/g, (_, lang, code) => {
    const escaped = escHtml(code);

    return `
      <div class="${prefix}-code-block">
        ${lang ? `<div class="${prefix}-code-lang">${lang}</div>` : ''}
        <pre><code class="${prefix}-code">${escaped}</code></pre>
      </div>
    `;
  });
};

export const parseMarkdown = (md, prefix = 'md') => {
  if (!md) return '';

  const codeBlocks = [];

  let r = md.replace(/```[\s\S]*?```/g, (match) => {
    const key = `@@CODE_BLOCK_${codeBlocks.length}@@`;
    codeBlocks.push(match);
    return key;
  });
  
  // Затем таблицы
  r = parseTables(r, prefix);

  // Заголовки
  r = r
    .replace(/^#### (.+)$/gm, `<h4 class="${prefix}-h4">$1</h4>`)
    .replace(/^### (.+)$/gm,  `<h3 class="${prefix}-h3">$1</h3>`)
    .replace(/^## (.+)$/gm,   `<h2 class="${prefix}-h2">$1</h2>`)
    .replace(/^# (.+)$/gm,    `<h1 class="${prefix}-h1">$1</h1>`);

  // Горизонтальная линия
  r = r.replace(/^---$/gm, `<hr class="${prefix}-hr" />`);

  // Блоки цитат
  r = r.replace(/^> (.+)$/gm, `<blockquote class="${prefix}-blockquote">$1</blockquote>`);
  r = r.replace(/(<\/blockquote>)\n(<blockquote)/g, '$1$2');

  // Инлайн-код (только незащищенный)
  r = r.replace(/`([^`]+)`/g, `<code class="${prefix}-inline-code">$1</code>`);

  // Изображения
  r = r.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    `<img src="$2" alt="$1" class="${prefix}-img" data-src="$2" />`
  );

  // Ссылки
  r = r.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    `<a href="$2" target="_blank" rel="noopener noreferrer" class="${prefix}-link">$1</a>`
  );

  // Форматирование текста
  r = r
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Обработка списков
  const lines = r.split('\n');
  const processedLines = [];
  let inList = false;
  let listType = null;
  let listItems = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isOrdered = /^\d+\.\s/.test(line);
    const isUnordered = /^-\s/.test(line);
    
    if (isOrdered || isUnordered) {
      const content = line.replace(/^\d+\.\s|^-\s/, '');
      const itemClass = isOrdered ? `${prefix}-oli` : `${prefix}-li`;
      
      if (!inList || (inList && ((isOrdered && listType !== 'ol') || (!isOrdered && listType !== 'ul')))) {
        if (inList) {
          const listTag = listType === 'ol' ? 'ol' : 'ul';
          processedLines.push(`<${listTag} class="${prefix}-${listType}">${listItems.join('')}</${listTag}>`);
          listItems = [];
        }
        inList = true;
        listType = isOrdered ? 'ol' : 'ul';
      }
      listItems.push(`<li class="${itemClass}">${content}</li>`);
    } else {
      if (inList) {
        const listTag = listType === 'ol' ? 'ol' : 'ul';
        processedLines.push(`<${listTag} class="${prefix}-${listType}">${listItems.join('')}</${listTag}>`);
        listItems = [];
        inList = false;
        listType = null;
      }
      processedLines.push(line);
    }
  }
  
  if (inList) {
    const listTag = listType === 'ol' ? 'ol' : 'ul';
    processedLines.push(`<${listTag} class="${prefix}-${listType}">${listItems.join('')}</${listTag}>`);
  }
  
  r = processedLines.join('\n');

  // Параграфы (защита от оборачивания блочных элементов)
  const blockElements = ['h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'table', 'pre', 'div', 'blockquote', 'hr', 'img'];
  const blockPattern = new RegExp(`^(<(${blockElements.join('|')})[^>]*>.*</\\2>|<(${blockElements.join('|')})[^>]*/?>|<hr[^>]*/>)`, 'i');
  
  const paragraphs = r.split('\n\n');
  const processedParagraphs = paragraphs.map(para => {
    const trimmed = para.trim();
    if (!trimmed) return '';
    if (blockPattern.test(trimmed)) return trimmed;
    return `<p class="${prefix}-p">${trimmed}</p>`;
  });
  
  r = processedParagraphs.join('\n');

  r = r.replace(/@@CODE_BLOCK_(\d+)@@/g, (_, i) => {
    return parseCodeBlocks(codeBlocks[i], prefix);
  });

  return r;
};

export const LESSON_CSS = `
  .lesson-h1{font-size:28px;font-weight:700;color:var(--foreground);margin:0 0 1.25rem;line-height:1.3}
  .lesson-h2{font-size:22px;font-weight:600;color:var(--foreground);margin:2.25rem 0 .75rem;padding-bottom:10px;border-bottom:1px solid hsl(var(--border))}
  .lesson-h3{font-size:17px;font-weight:600;color:var(--foreground);margin:1.75rem 0 .5rem}
  .lesson-h4{font-size:15px;font-weight:600;color:var(--foreground);margin:1.25rem 0 .4rem}
  .lesson-p{font-size:16px;line-height:1.85;color:var(--foreground);margin:0 0 1.1rem}

  .lesson-ul,.lesson-ol{padding:0;margin:.5rem 0 1rem;list-style:none}
  .lesson-ol{counter-reset:lesson-counter}
  .lesson-li{font-size:16px;line-height:1.75;color:var(--foreground);margin-bottom:4px;padding-left:1.25rem;position:relative}
  .lesson-li::before{content:'•';position:absolute;left:.25rem;color:hsl(var(--muted-foreground))}
  .lesson-oli{font-size:16px;line-height:1.75;color:var(--foreground);margin-bottom:4px;padding-left:1.6rem;position:relative;counter-increment:lesson-counter}
  .lesson-oli::before{content:counter(lesson-counter)'.';position:absolute;left:0;color:hsl(var(--muted-foreground));min-width:1.4rem}

  .lesson-blockquote{border-left:3px solid hsl(var(--primary));margin:1.25rem 0;padding:11px 16px;background:hsl(var(--primary)/.06);border-radius:0 10px 10px 0;color:hsl(var(--muted-foreground));font-size:15px;line-height:1.7}
  .lesson-hr{border:none;border-top:1px solid hsl(var(--border));margin:1.75rem 0}
  .lesson-link{color:hsl(var(--primary));text-decoration:underline;text-underline-offset:3px}

  /* Блоки кода */
  .lesson-code-block {
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 10px;
    margin: 1.25rem 0;
    overflow: hidden;
    position: relative;
  }
  
  .lesson-code-lang {
    position: absolute;
    top: 0;
    right: 0;
    font-size: 10px;
    font-family: ui-monospace, monospace;
    color: #8b949e;
    text-transform: uppercase;
    letter-spacing: .08em;
    user-select: none;
    background: #161b22;
    border-left: 1px solid #30363d;
    border-bottom: 1px solid #30363d;
    border-radius: 0 10px 0 5px;
    padding: 3px 11px;
    z-index: 1;
  }
  
  .lesson-code-block pre {
    margin: 0;
    padding: 16px 20px;
    overflow-x: auto;
    scrollbar-width: thin;
    scrollbar-color: #30363d transparent;    
    white-space: pre-wrap;   /* 🔥 ключевой фикс */
    word-break: break-word;
  }
  
  .lesson-code-block pre::-webkit-scrollbar {
    height: 4px;
  }
  
  .lesson-code-block pre::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .lesson-code-block pre::-webkit-scrollbar-thumb {
    background: #30363d;
    border-radius: 2px;
  }

  .lesson-code {
    font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', ui-monospace, monospace;
    font-size: 13.5px;
    line-height: 1.5;
    color: #e6edf3;
    display: block;

    white-space: pre-wrap;   /* ✅ сохраняет переносы строк */
    word-break: break-word;  /* ✅ не ломает layout длинными строками */
    overflow-wrap: anywhere;

    tab-size: 2;
  }
  
  .lesson-inline-code {
    font-family: 'Fira Code', 'JetBrains Mono', ui-monospace, monospace;
    font-size: 13px;
    background: rgba(175, 184, 193, .15);
    border: 0.5px solid rgba(175, 184, 193, .25);
    border-radius: 5px;
    padding: 2px 7px;
    color: var(--foreground);
  }

  /* Таблицы */
  .lesson-table-wrap {
    overflow-x: auto;
    margin: 1.25rem 0;
    border: 1px solid hsl(var(--border));
    border-radius: 10px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  
  .lesson-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 14px;
    background: var(--background);
  }
  
  .lesson-table-th {
    font-weight: 600;
    color: var(--foreground);
    padding: 12px 16px;
    background: hsl(var(--muted));
    border-bottom: 1px solid hsl(var(--border));
    text-align: left;
    white-space: nowrap;
    vertical-align: middle;
    font-size: 14px;
  }
  
  .lesson-table-th:first-child {
    border-top-left-radius: 10px;
  }
  
  .lesson-table-th:last-child {
    border-top-right-radius: 10px;
  }
  
  .lesson-table-td {
    padding: 12px 16px;
    border-bottom: 1px solid hsl(var(--border));
    color: var(--foreground);
    line-height: 1.6;
    text-align: left;
    vertical-align: top;
    background: var(--background);
  }
  
  .lesson-table tbody tr:last-child .lesson-table-td {
    border-bottom: none;
  }
  
  .lesson-table tbody tr:hover .lesson-table-td {
    background: hsl(var(--muted)/0.5);
  }
  
  .lesson-table tbody tr:nth-child(even) .lesson-table-td {
    background: hsl(var(--muted)/0.3);
  }
  
  .lesson-table tbody tr:nth-child(even):hover .lesson-table-td {
    background: hsl(var(--muted)/0.5);
  }

  .lesson-img {
    max-width: 100%;
    border-radius: 10px;
    margin: 1rem 0;
    display: block;
    cursor: zoom-in;
    border: 1px solid hsl(var(--border));
    transition: opacity .15s;
  }
  
  .lesson-img:hover {
    opacity: .88;
  }
`;

export default parseMarkdown;
