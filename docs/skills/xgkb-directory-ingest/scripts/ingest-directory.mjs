#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_SERVER_URL = 'https://sg-al-cwork-web.mediportal.com.cn/';

const API_PATHS = {
  getChildFiles: 'document-database/file/getChildFiles',
  getLevel1Folders: 'document-database/file/getLevel1Folders',
  getDownloadInfo: 'document-database/upDownload/getDownloadInfo',
  getFullFileContent: 'document-database/file/getFullFileContent',
  batchGetContent: 'document-database/ai/batchGetContent',
  batchGetMeta: 'document-database/file/batchGetMeta',
  listDescendantFiles: 'document-database/file/listDescendantFiles',
};

const TEXT_SUFFIXES = new Set([
  'md', 'markdown', 'txt', 'text', 'json', 'jsonl', 'csv', 'tsv',
  'html', 'htm', 'xml', 'yaml', 'yml', 'ini', 'conf', 'log',
  'js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'less',
  'py', 'java', 'go', 'rs', 'c', 'cc', 'cpp', 'h', 'hpp',
  'sql', 'sh', 'bash', 'ps1', 'bat', 'cmd',
]);

function usage() {
  return `Usage:
  node ingest-directory.mjs --from-clipboard [options]
  node ingest-directory.mjs --url <xgkb-directory-url> [options]
  node ingest-directory.mjs --directory-id <id> [options]

Options:
  --server-url <url>        XGKB server root. Defaults to XGKB_SERVER_URL or ${DEFAULT_SERVER_URL}
  --token-env <name>        Environment variable containing access token. Default: XGKB_ACCESS_TOKEN
  --token <value>           Access token. Avoid this except for short local debugging.
  --out <dir>               Output directory. Default: .tmp/xgkb-ingest/<timestamp>
  --max-files <n>           Maximum readable files. Default: 300
  --max-depth <n>           Maximum folder depth for recursive fallback. Default: 8
  --max-total-chars <n>     Maximum merged content characters. Default: 1000000
  --max-file-bytes <n>      Maximum single file size for download fallback. Default: 2000000
  --include-suffix <list>   Comma-separated suffix allow-list, e.g. md,txt,json
  --parse-only              Parse input and print the detected ID without calling APIs
  --help                    Show help
`;
}

function parseArgs(argv) {
  const args = {
    tokenEnv: 'XGKB_ACCESS_TOKEN',
    serverUrl: process.env.XGKB_SERVER_URL || DEFAULT_SERVER_URL,
    maxFiles: 300,
    maxDepth: 8,
    maxTotalChars: 1_000_000,
    maxFileBytes: 2_000_000,
    includeSuffix: null,
    parseOnly: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const next = argv[i + 1];
    switch (key) {
      case '--from-clipboard':
        args.fromClipboard = true;
        break;
      case '--url':
        args.url = requireValue(key, next);
        i += 1;
        break;
      case '--directory-id':
        args.directoryId = requireValue(key, next);
        i += 1;
        break;
      case '--server-url':
        args.serverUrl = requireValue(key, next);
        i += 1;
        break;
      case '--token-env':
        args.tokenEnv = requireValue(key, next);
        i += 1;
        break;
      case '--token':
        args.token = requireValue(key, next);
        i += 1;
        break;
      case '--out':
        args.out = requireValue(key, next);
        i += 1;
        break;
      case '--max-files':
        args.maxFiles = parsePositiveInt(key, requireValue(key, next));
        i += 1;
        break;
      case '--max-depth':
        args.maxDepth = parsePositiveInt(key, requireValue(key, next));
        i += 1;
        break;
      case '--max-total-chars':
        args.maxTotalChars = parsePositiveInt(key, requireValue(key, next));
        i += 1;
        break;
      case '--max-file-bytes':
        args.maxFileBytes = parsePositiveInt(key, requireValue(key, next));
        i += 1;
        break;
      case '--include-suffix':
        args.includeSuffix = new Set(requireValue(key, next).split(',').map((v) => normalizeSuffix(v)).filter(Boolean));
        i += 1;
        break;
      case '--parse-only':
        args.parseOnly = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${key}\n\n${usage()}`);
    }
  }

  return args;
}

function requireValue(key, value) {
  if (!value || value.startsWith('--')) throw new Error(`${key} requires a value`);
  return value;
}

function parsePositiveInt(key, value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new Error(`${key} must be a positive integer`);
  return n;
}

function normalizeServerUrl(value) {
  const trimmed = String(value || '').trim() || DEFAULT_SERVER_URL;
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

function normalizeSuffix(value) {
  return String(value || '').trim().replace(/^\./, '').toLowerCase();
}

function readClipboard() {
  const platform = process.platform;
  try {
    if (platform === 'win32') {
      return execFileSync('powershell.exe', ['-NoProfile', '-Command', 'Get-Clipboard -Raw'], { encoding: 'utf8' }).trim();
    }
    if (platform === 'darwin') {
      return execFileSync('pbpaste', { encoding: 'utf8' }).trim();
    }
    try {
      return execFileSync('xclip', ['-selection', 'clipboard', '-o'], { encoding: 'utf8' }).trim();
    } catch {
      return execFileSync('xsel', ['--clipboard', '--output'], { encoding: 'utf8' }).trim();
    }
  } catch (error) {
    throw new Error(`Failed to read clipboard: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function getInput(args) {
  if (args.directoryId) return { raw: args.directoryId, kind: 'directory-id' };
  if (args.url) return { raw: args.url, kind: 'url' };
  if (args.fromClipboard) return { raw: readClipboard(), kind: 'clipboard' };
  throw new Error(`No input provided.\n\n${usage()}`);
}

function parseDirectoryInput(input) {
  const raw = String(input || '').trim();
  if (!raw) throw new Error('Input is empty');

  if (!looksLikeUrl(raw)) {
    return { id: raw, source: 'raw-id', input: raw };
  }

  const url = new URL(raw);
  const keys = ['directoryId', 'rootFileId', 'folderId', 'parentId', 'fileId', 'bizId', 'id'];

  for (const key of keys) {
    const value = url.searchParams.get(key);
    if (value) return { id: value.trim(), source: `query:${key}`, input: raw };
  }

  const hash = url.hash.replace(/^#/, '');
  const hashQuery = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : hash;
  const hashParams = new URLSearchParams(hashQuery);
  for (const key of keys) {
    const value = hashParams.get(key);
    if (value) return { id: value.trim(), source: `hash:${key}`, input: raw };
  }

  const pathSegments = url.pathname.split('/').map((v) => decodeURIComponent(v)).filter(Boolean);
  for (let i = 0; i < pathSegments.length - 1; i += 1) {
    if (['directory', 'folder', 'file', 'rootFileId', 'directoryId'].includes(pathSegments[i])) {
      return { id: pathSegments[i + 1], source: `path:${pathSegments[i]}`, input: raw };
    }
  }

  const last = pathSegments[pathSegments.length - 1];
  if (last && /^[A-Za-z0-9_-]{6,}$/.test(last)) {
    return { id: last, source: 'path:last-segment', input: raw };
  }

  throw new Error('Could not find a directory/file id in the URL. Add a rule in references/link-parsing.md for this URL shape.');
}

function looksLikeUrl(value) {
  return /^https?:\/\//i.test(value);
}

class XgkbClient {
  constructor({ serverUrl, token }) {
    this.serverUrl = normalizeServerUrl(serverUrl);
    this.token = token;
  }

  async get(pathname, params = {}) {
    return this.request('GET', pathname, params);
  }

  async post(pathname, body = {}) {
    return this.request('POST', pathname, body);
  }

  async request(method, pathname, params) {
    const base = new URL(pathname, this.serverUrl);
    const init = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'access-token': this.token,
      },
    };

    if (method === 'GET') {
      for (const [key, value] of Object.entries(params || {})) {
        if (value !== undefined && value !== null && value !== '') {
          base.searchParams.set(key, String(value));
        }
      }
    } else {
      init.body = JSON.stringify(params || {});
    }

    const response = await fetch(base, init);
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}: ${text.slice(0, 300)}`);
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`Response is not JSON: ${text.slice(0, 300)}`);
    }

    if (parsed.resultCode !== 1) {
      throw new Error(`API error ${parsed.resultCode}: ${parsed.resultMsg || 'unknown error'}`);
    }

    return parsed.data;
  }
}

async function detectRoot(client, id) {
  try {
    const children = await client.get(API_PATHS.getChildFiles, { parentId: id });
    return { kind: 'folder', id, children: Array.isArray(children) ? children : [] };
  } catch (folderError) {
    try {
      const children = await client.get(API_PATHS.getLevel1Folders, { projectId: id });
      return { kind: 'project', id, children: Array.isArray(children) ? children : [] };
    } catch (projectError) {
      throw new Error(`Input id did not resolve as folder or project. folder=${folderError.message}; project=${projectError.message}`);
    }
  }
}

async function listFiles(client, root, limits, errors) {
  if (root.kind === 'folder') {
    try {
      const result = await client.get(API_PATHS.listDescendantFiles, {
        rootFileId: root.id,
        includePath: true,
        includeFolders: true,
      });
      const files = Array.isArray(result?.files) ? result.files : [];
      if (files.length > 0) return normalizeDescendantFiles(files, limits);
    } catch (error) {
      errors.push({ phase: 'listDescendantFiles', message: error.message });
    }
  }

  return walkRecursively(client, root, limits, errors);
}

function normalizeDescendantFiles(items, limits) {
  const folders = [];
  const files = [];
  for (const item of items) {
    const normalized = normalizeItem(item, item.relativePath || item.path || item.name);
    if (normalized.type === 1) folders.push(normalized);
    else if (files.length < limits.maxFiles) files.push(normalized);
  }
  return { folders, files, truncated: files.length >= limits.maxFiles };
}

async function walkRecursively(client, root, limits, errors) {
  const folders = [];
  const files = [];
  const stack = root.children.map((item) => ({
    item,
    depth: 1,
    itemPath: item.name || String(item.id),
  })).reverse();

  while (stack.length > 0) {
    const { item, depth, itemPath } = stack.pop();
    const normalized = normalizeItem(item, itemPath);
    if (normalized.type !== 1) {
      if (files.length < limits.maxFiles) files.push(normalized);
      continue;
    }

    folders.push(normalized);
    if (depth >= limits.maxDepth) {
      errors.push({ phase: 'walk', fileId: String(normalized.id), path: normalized.path, message: 'max depth reached' });
      continue;
    }

    try {
      const children = await client.get(API_PATHS.getChildFiles, { parentId: normalized.id });
      for (const child of [...children].reverse()) {
        stack.push({
          item: child,
          depth: depth + 1,
          itemPath: `${itemPath}/${child.name || child.id}`,
        });
      }
    } catch (error) {
      errors.push({ phase: 'getChildFiles', fileId: String(normalized.id), path: normalized.path, message: error.message });
    }
  }

  return { folders, files, truncated: files.length >= limits.maxFiles };
}

function normalizeItem(item, itemPath) {
  return {
    id: String(item.id ?? item.fileId ?? ''),
    name: item.name || String(item.id ?? item.fileId ?? ''),
    type: Number(item.type ?? 0),
    parentId: item.parentId ?? null,
    suffix: normalizeSuffix(item.suffix || path.extname(item.name || '').slice(1)),
    size: typeof item.size === 'number' ? item.size : null,
    createTime: item.createTime,
    updateTime: item.updateTime,
    path: itemPath || item.relativePath || item.name || String(item.id ?? item.fileId ?? ''),
  };
}

async function readFileContents(client, files, limits, errors) {
  const contents = [];
  let totalChars = 0;

  for (const file of files) {
    if (!shouldReadFile(file, limits)) {
      contents.push({ file, status: 'skipped', reason: skipReason(file, limits), content: '' });
      continue;
    }

    if (totalChars >= limits.maxTotalChars) {
      contents.push({ file, status: 'skipped', reason: 'max_total_chars_reached', content: '' });
      continue;
    }

    try {
      const content = await readOneFile(client, file, limits);
      const remaining = limits.maxTotalChars - totalChars;
      const clipped = content.length > remaining ? content.slice(0, remaining) : content;
      totalChars += clipped.length;
      contents.push({
        file,
        status: clipped.length < content.length ? 'partial' : 'ok',
        reason: clipped.length < content.length ? 'max_total_chars_reached' : null,
        content: clipped,
      });
    } catch (error) {
      errors.push({ phase: 'readFileContent', fileId: file.id, path: file.path, message: error.message });
      contents.push({ file, status: 'error', reason: error.message, content: '' });
    }
  }

  return contents;
}

function shouldReadFile(file, limits) {
  if (!file.id) return false;
  if (limits.includeSuffix && !limits.includeSuffix.has(file.suffix)) return false;
  if (!TEXT_SUFFIXES.has(file.suffix)) return false;
  if (file.size !== null && file.size > limits.maxFileBytes) return false;
  return true;
}

function skipReason(file, limits) {
  if (!file.id) return 'missing_file_id';
  if (limits.includeSuffix && !limits.includeSuffix.has(file.suffix)) return 'suffix_not_included';
  if (!TEXT_SUFFIXES.has(file.suffix)) return 'unsupported_suffix';
  if (file.size !== null && file.size > limits.maxFileBytes) return 'file_too_large';
  return 'skipped';
}

async function readOneFile(client, file, limits) {
  try {
    const data = await client.get(API_PATHS.getFullFileContent, { fileId: file.id });
    if (typeof data === 'string' && data.trim()) return data;
  } catch {
    // Fall through to download URL for text files.
  }

  const info = await client.get(API_PATHS.getDownloadInfo, { fileId: file.id, forceDownload: false });
  const url = info.downloadUrl || info.previewUrl;
  if (!url) throw new Error('downloadUrl/previewUrl missing');

  const response = await fetch(url);
  if (!response.ok) throw new Error(`download HTTP ${response.status}`);

  const length = Number(response.headers.get('content-length') || '0');
  if (length > limits.maxFileBytes) throw new Error('download file too large');

  return response.text();
}

async function writeOutput(runDir, source, root, folders, files, contents, errors, limits) {
  await mkdir(path.join(runDir, 'contents'), { recursive: true });

  const manifestFiles = contents.map((entry) => ({
    fileId: entry.file.id,
    name: entry.file.name,
    path: entry.file.path,
    suffix: entry.file.suffix,
    size: entry.file.size,
    contentStatus: entry.status,
    reason: entry.reason,
    contentFile: entry.content ? `contents/${safeFileName(entry.file.id)}.md` : null,
  }));

  for (const entry of contents) {
    if (!entry.content) continue;
    await writeFile(
      path.join(runDir, 'contents', `${safeFileName(entry.file.id)}.md`),
      renderSingleContent(entry),
      'utf8',
    );
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    source,
    root: { kind: root.kind, id: root.id },
    limits,
    stats: {
      folderCount: folders.length,
      fileCount: files.length,
      contentReadCount: contents.filter((entry) => entry.status === 'ok' || entry.status === 'partial').length,
      skippedCount: contents.filter((entry) => entry.status === 'skipped').length,
      errorCount: errors.length + contents.filter((entry) => entry.status === 'error').length,
    },
    files: manifestFiles,
    errors,
  };

  await writeFile(path.join(runDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await writeFile(path.join(runDir, 'tree.md'), renderTree(root, folders, files), 'utf8');
  await writeFile(path.join(runDir, 'content.md'), renderMergedContent(contents), 'utf8');
}

function safeFileName(value) {
  return String(value).replace(/[^A-Za-z0-9_.-]/g, '_');
}

function renderTree(root, folders, files) {
  const lines = [`# XGKB Directory Tree`, '', `Root: ${root.kind} ${root.id}`, ''];
  for (const folder of [...folders].sort(byPath)) lines.push(`- [D] ${folder.path}`);
  for (const file of [...files].sort(byPath)) lines.push(`- [F] ${file.path}`);
  return `${lines.join('\n')}\n`;
}

function renderSingleContent(entry) {
  return [
    `# ${entry.file.path}`,
    '',
    `File ID: ${entry.file.id}`,
    `Status: ${entry.status}`,
    '',
    '```text',
    entry.content.replace(/```/g, '``\\`'),
    '```',
    '',
  ].join('\n');
}

function renderMergedContent(contents) {
  const lines = ['# XGKB Directory Content', ''];
  for (const entry of contents) {
    if (!entry.content) continue;
    lines.push(`## ${entry.file.path}`);
    lines.push('');
    lines.push(`File ID: ${entry.file.id}`);
    lines.push(`Status: ${entry.status}`);
    lines.push('');
    lines.push('```text');
    lines.push(entry.content.replace(/```/g, '``\\`'));
    lines.push('```');
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

function byPath(a, b) {
  return String(a.path).localeCompare(String(b.path));
}

function defaultRunDir() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(process.cwd(), '.tmp', 'xgkb-ingest', stamp);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(usage());
    return;
  }

  const input = getInput(args);
  const parsed = parseDirectoryInput(input.raw);

  if (args.parseOnly) {
    process.stdout.write(`${JSON.stringify(parsed, null, 2)}\n`);
    return;
  }

  const token = args.token || process.env[args.tokenEnv];
  if (!token) {
    throw new Error(`Missing access token. Set ${args.tokenEnv} or pass --token-env <env-name>.`);
  }

  const limits = {
    maxFiles: args.maxFiles,
    maxDepth: args.maxDepth,
    maxTotalChars: args.maxTotalChars,
    maxFileBytes: args.maxFileBytes,
    includeSuffix: args.includeSuffix ? [...args.includeSuffix] : null,
  };

  const errors = [];
  const client = new XgkbClient({ serverUrl: args.serverUrl, token });
  const root = await detectRoot(client, parsed.id);
  const { folders, files, truncated } = await listFiles(client, root, limits, errors);
  if (truncated) errors.push({ phase: 'listFiles', message: `file list truncated at ${limits.maxFiles}` });

  const contents = await readFileContents(client, files, limits, errors);
  const runDir = path.resolve(args.out || defaultRunDir());
  await writeOutput(runDir, { inputKind: input.kind, parseSource: parsed.source, directoryId: parsed.id }, root, folders, files, contents, errors, limits);

  process.stdout.write(`XGKB ingest complete\n`);
  process.stdout.write(`Output: ${runDir}\n`);
  process.stdout.write(`Files: ${files.length}, folders: ${folders.length}, content: ${contents.filter((entry) => entry.content).length}, errors: ${errors.length}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
