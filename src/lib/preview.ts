import type { KbApiClient } from './api';
import type { FileListItem } from './types';
import { getConfig } from './config';

const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'];
const HTML_EXTS = ['html', 'htm'];
const MD_EXTS = ['md', 'markdown', 'mdown', 'mkd'];
const TEXT_EXTS = [
  'txt', 'log', 'json', 'js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'less',
  'xml', 'yml', 'yaml', 'toml', 'ini', 'csv', 'sql', 'sh', 'bash', 'py',
  'java', 'c', 'cpp', 'h', 'hpp', 'go', 'rs', 'rb', 'php',
];

export function inferPreviewMimeType(fileName: string, responseType: string): string {
  const normalized = responseType.split(';')[0].trim().toLowerCase();
  if (normalized && normalized !== 'application/octet-stream') return responseType;

  const suffix = fileName.split('.').pop()?.toLowerCase() || '';
  if (suffix === 'pdf') return 'application/pdf';
  if (suffix === 'svg') return 'image/svg+xml';
  if (suffix === 'png') return 'image/png';
  if (suffix === 'jpg' || suffix === 'jpeg') return 'image/jpeg';
  if (suffix === 'gif') return 'image/gif';
  if (suffix === 'webp') return 'image/webp';
  if (HTML_EXTS.includes(suffix)) return 'text/html;charset=utf-8';
  if (MD_EXTS.includes(suffix) || TEXT_EXTS.includes(suffix)) return 'text/plain;charset=utf-8';
  return responseType || 'application/octet-stream';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function renderInlineMarkdown(value: string): string {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

function renderMarkdownTable(lines: string[]): string | null {
  if (lines.length < 2 || !/^\s*\|?[\s:-]+\|[\s|:-]+\|?\s*$/.test(lines[1])) return null;
  const parseRow = (line: string) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
  const headers = parseRow(lines[0]);
  const rows = lines.slice(2).map(parseRow);
  return `<table><thead><tr>${headers.map((cell) => `<th>${renderInlineMarkdown(cell)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((_, index) => `<td>${renderInlineMarkdown(row[index] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function renderMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let index = 0;
  let inCode = false;
  let codeLang = '';
  let codeLines: string[] = [];

  const closeCode = () => {
    html.push(`<pre><span class="code-lang">${escapeHtml(codeLang || 'text')}</span><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
    inCode = false;
    codeLang = '';
    codeLines = [];
  };

  while (index < lines.length) {
    const line = lines[index];

    if (line.startsWith('```')) {
      if (inCode) {
        closeCode();
      } else {
        inCode = true;
        codeLang = line.slice(3).trim();
      }
      index += 1;
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      index += 1;
      continue;
    }

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const tableLines: string[] = [];
    let tableIndex = index;
    while (tableIndex < lines.length && lines[tableIndex].includes('|') && lines[tableIndex].trim()) {
      tableLines.push(lines[tableIndex]);
      tableIndex += 1;
    }
    const tableHtml = renderMarkdownTable(tableLines);
    if (tableHtml) {
      html.push(tableHtml);
      index = tableIndex;
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const content = renderInlineMarkdown(heading[2].trim());
      const id = slugify(heading[2]);
      html.push(`<h${level} id="${id}">${content}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ''));
        index += 1;
      }
      html.push(`<blockquote>${quoteLines.map(renderInlineMarkdown).join('<br>')}</blockquote>`);
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*+]\s+/, ''));
        index += 1;
      }
      html.push(`<ul>${items.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join('')}</ul>`);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, ''));
        index += 1;
      }
      html.push(`<ol>${items.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join('')}</ol>`);
      continue;
    }

    const paragraphLines: string[] = [line];
    index += 1;
    while (
      index < lines.length
      && lines[index].trim()
      && !/^(#{1,6})\s+/.test(lines[index])
      && !/^>\s?/.test(lines[index])
      && !/^\s*[-*+]\s+/.test(lines[index])
      && !/^\s*\d+\.\s+/.test(lines[index])
      && !lines[index].startsWith('```')
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    html.push(`<p>${paragraphLines.map((text) => renderInlineMarkdown(text.trim())).join('<br>')}</p>`);
  }

  if (inCode) closeCode();
  return html.join('\n');
}

export function buildMarkdownPreviewHtml(fileName: string, markdown: string): string {
  const content = renderMarkdown(markdown);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(fileName)}</title><style>:root{color-scheme:light;background:#F7F6F1}*{box-sizing:border-box}html,body{max-width:100%;overflow-x:hidden}body{margin:0;background:#F7F6F1;color:#24211D;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans SC",sans-serif}.shell{width:100%;max-width:940px;margin:0 auto;padding:56px 28px 96px}.doc{width:100%;max-width:100%;min-width:0;background:#fff;border:1px solid #E8E4DA;border-radius:10px;padding:44px 54px;box-shadow:0 18px 48px rgba(33,29,24,.08);overflow:hidden}.doc>*{max-width:100%}.meta{font-size:12px;color:#9A9488;margin-bottom:26px;display:flex;gap:8px;align-items:center;min-width:0;overflow-wrap:anywhere}.meta:before{content:"";width:7px;height:7px;border-radius:99px;background:#2563EB;flex:0 0 auto}h1,h2,h3,h4,h5,h6{font-family:Georgia,"Noto Serif SC",serif;color:#1F1D1A;line-height:1.28;margin:1.4em 0 .65em;font-weight:650;overflow-wrap:anywhere;word-break:break-word}h1{font-size:34px;margin-top:0;border-bottom:1px solid #ECE8DF;padding-bottom:18px}h2{font-size:25px;border-bottom:1px solid #EFECE5;padding-bottom:10px}h3{font-size:20px}p{font-size:16px;line-height:1.85;margin:1em 0;color:#34302A;overflow-wrap:anywhere;word-break:break-word}a{color:#1D4ED8;text-decoration:none;border-bottom:1px solid rgba(29,78,216,.22);overflow-wrap:anywhere;word-break:break-all}a:hover{border-bottom-color:currentColor}strong{font-weight:700;color:#1F1D1A}em{color:#575047}code{font-family:"SFMono-Regular",Consolas,"Liberation Mono",monospace;background:#F1EFE8;color:#8A3B12;border-radius:5px;padding:.14em .38em;font-size:.9em;white-space:normal;overflow-wrap:anywhere;word-break:break-word}pre{position:relative;max-width:100%;background:#202124;color:#F4F4F0;border-radius:10px;padding:42px 18px 18px;overflow-x:auto;overflow-y:hidden;margin:22px 0;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}pre code{background:transparent;color:inherit;padding:0;font-size:13px;line-height:1.65;display:block;min-width:0;width:max-content;max-width:none;white-space:pre;word-break:normal;overflow-wrap:normal}.code-lang{position:absolute;top:12px;left:16px;color:#A8A29A;font-size:11px;text-transform:uppercase;letter-spacing:.06em}blockquote{max-width:100%;margin:22px 0;padding:14px 18px;border-left:4px solid #2563EB;background:#F4F7FF;color:#4B5563;border-radius:0 8px 8px 0;overflow-wrap:anywhere}blockquote p{margin:0}ul,ol{padding-left:1.5em;margin:1em 0;max-width:100%}li{font-size:16px;line-height:1.8;margin:.25em 0;overflow-wrap:anywhere;word-break:break-word}table{border-collapse:collapse;width:max-content;min-width:100%;margin:24px 0;font-size:14px;border:1px solid #E5E1D8}table{display:table}thead{background:#F4F2EC}th,td{border:1px solid #E5E1D8;padding:10px 12px;text-align:left;vertical-align:top;max-width:360px;overflow-wrap:anywhere;word-break:break-word}th{font-weight:650;color:#2F2B25}table{border-radius:8px}table:where(:not(.x)){ }img{max-width:100%;height:auto;border-radius:8px;margin:16px 0}hr{border:0;border-top:1px solid #E8E4DA;margin:34px 0}@media(max-width:720px){.shell{padding:18px 12px 48px}.doc{padding:28px 22px;border-radius:8px}h1{font-size:28px}h2{font-size:22px}th,td{max-width:240px}}</style></head><body><main class="shell"><article class="doc"><div class="meta">${escapeHtml(fileName)}</div>${content}</article></main></body></html>`;
}

function openMarkdownPreview(target: Window, fileName: string, markdown: string): void {
  const html = buildMarkdownPreviewHtml(fileName, markdown);
  setBlobPreview(target, new Blob([html], { type: 'text/html;charset=utf-8' }), fileName);
}

function writeStatusPage(target: Window, title: string, message: string, downloadUrl?: string): void {
  target.document.open();
  target.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans SC",sans-serif;margin:0;background:#FAFAF7;color:#1A1A1A}.wrap{max-width:720px;margin:12vh auto;padding:0 28px}.panel{background:#fff;border:1px solid #ECECE6;border-radius:10px;padding:24px;box-shadow:0 8px 24px rgba(0,0,0,.06)}h1{font-size:18px;margin:0 0 10px}p{font-size:14px;line-height:1.7;color:#6B7280;margin:0 0 16px}a{color:#2563EB;text-decoration:none;font-size:14px}</style></head><body><div class="wrap"><div class="panel"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p>${downloadUrl ? `<a href="${escapeHtml(downloadUrl)}" target="_self" rel="noopener noreferrer">下载原文件</a>` : ''}</div></div></body></html>`);
  target.document.close();
}

function setBlobPreview(target: Window, blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  target.document.title = fileName;
  target.location.replace(url);
}

async function openBlobPreview(target: Window, downloadUrl: string, fileName: string): Promise<void> {
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  if (MD_EXTS.includes(fileName.split('.').pop()?.toLowerCase() || '')) {
    openMarkdownPreview(target, fileName, await response.text());
    return;
  }
  const blob = await response.blob();
  const previewType = inferPreviewMimeType(fileName, blob.type || contentType);
  setBlobPreview(target, new Blob([blob], { type: previewType }), fileName);
}

export async function createBlobPreviewUrl(downloadUrl: string, fileName: string): Promise<string> {
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  if (MD_EXTS.includes(fileName.split('.').pop()?.toLowerCase() || '')) {
    return URL.createObjectURL(new Blob([
      buildMarkdownPreviewHtml(fileName, await response.text()),
    ], { type: 'text/html;charset=utf-8' }));
  }

  const blob = await response.blob();
  const previewType = inferPreviewMimeType(fileName, blob.type || contentType);
  return URL.createObjectURL(new Blob([blob], { type: previewType }));
}

export async function openFileInNewTab(client: KbApiClient, item: FileListItem): Promise<void> {
  const suffix = (item.suffix || item.name.split('.').pop() || '').toLowerCase();
  const { previewMode } = getConfig();
  const target = window.open('', '_blank');
  if (!target) return;
  target.opener = null;

  writeStatusPage(target, item.name, '正在准备预览...');

  if (previewMode === 'kb' && (MD_EXTS.includes(suffix) || HTML_EXTS.includes(suffix))) {
    const format = MD_EXTS.includes(suffix) ? 'md' : 'html';
    const result = await client.getPreviewTicket(String(item.id), format, item.name);
    if (result.ok) target.location.replace(result.value.previewUrl);
    else writeStatusPage(target, '无法打开预览', result.error);
    return;
  }

  const result = await client.getDownloadInfo(String(item.id));
  if (!result.ok) {
    writeStatusPage(target, '无法获取文件地址', result.error);
    return;
  }

  if (!result.value.downloadUrl) {
    writeStatusPage(target, '无法打开预览', '接口没有返回 downloadUrl。');
    return;
  }

  try {
    await openBlobPreview(target, result.value.downloadUrl, result.value.fileName || item.name);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    writeStatusPage(
      target,
      '无法直接预览',
      `浏览器无法读取文件内容，可能是存储地址未允许跨域访问。${message}`,
      result.value.downloadUrl,
    );
  }
}

export function isImageFile(item: FileListItem): boolean {
  const suffix = (item.suffix || item.name.split('.').pop() || '').toLowerCase();
  return IMAGE_EXTS.includes(suffix);
}
