import { useEffect, useState } from 'react';
import { X, AlertCircle, ExternalLink, Link, Check } from 'lucide-react';
import { FilePreview } from './FilePreview';
import { getConfig } from '../lib/config';
import type { KbApiClient } from '../lib/api';
import type { FileListItem } from '../lib/types';

interface FileViewerModalProps {
  client: KbApiClient;
  file: FileListItem;
  onClose: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}/${mm}/${dd}`;
}

const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'];
const HTML_EXTS = ['html', 'htm'];
const MD_EXTS = ['md', 'markdown', 'mdown', 'mkd'];

type PreviewState =
  | { phase: 'loading' }
  | { phase: 'image'; url: string }
  | { phase: 'html'; url: string }      // 真实 HTML 文件，iframe src 加载
  | { phase: 'iframe'; url: string }    // KB 预览服务外链
  | { phase: 'content'; content: string }
  | { phase: 'error'; message: string };

export function FileViewerModal({ client, file, onClose }: FileViewerModalProps) {
  const [state, setState] = useState<PreviewState>({ phase: 'loading' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setState({ phase: 'loading' });
    const suffix = (file.name.split('.').pop() ?? '').toLowerCase();
    const fileId = String(file.id);

    const { previewMode } = getConfig();

    // 图片：始终自渲染
    if (IMAGE_EXTS.includes(suffix)) {
      client.getDownloadInfo(fileId).then((r) => {
        if (r.ok && r.value.downloadUrl) setState({ phase: 'image', url: r.value.downloadUrl });
        else setState({ phase: 'error', message: r.ok ? '无法获取图片链接' : r.error });
      });
      return;
    }

    // KB 预览模式：MD / HTML 走外部预览服务
    if (previewMode === 'kb' && (MD_EXTS.includes(suffix) || HTML_EXTS.includes(suffix))) {
      const format = MD_EXTS.includes(suffix) ? 'md' : 'html';
      client.getPreviewTicket(fileId, format, file.name).then((r) => {
        if (r.ok) setState({ phase: 'iframe', url: r.value.previewUrl });
        else setState({ phase: 'error', message: r.error });
      });
      return;
    }

    // HTML 文件（自渲染模式）：用下载 URL 在 iframe 中加载真实文件
    if (HTML_EXTS.includes(suffix)) {
      client.getDownloadInfo(fileId, false).then((r) => {
        if (r.ok && r.value.downloadUrl) setState({ phase: 'html', url: r.value.downloadUrl });
        else setState({ phase: 'error', message: r.ok ? '无法获取 HTML 文件链接' : r.error });
      });
      return;
    }

    // MD、代码、文本 — 走 FilePreview 自渲染
    client.getFullFileContent(fileId).then((r) => {
      if (r.ok) setState({ phase: 'content', content: r.value });
      else setState({ phase: 'error', message: r.error });
    });
  }, [file, client]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const copyKbLink = async () => {
    const suffix = (file.name.split('.').pop() ?? '').toLowerCase();
    const format = MD_EXTS.includes(suffix) ? 'md' : 'html';
    const r = await client.getPreviewTicket(String(file.id), format, file.name);
    if (r.ok) {
      await navigator.clipboard.writeText(r.value.previewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const openInNewTab = async () => {
    const escapeHtml = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    if (state.phase === 'content') {
      // 自渲染内容：在新窗口中用同样的渲染方式打开
      const w = window.open('', '_blank');
      if (!w) return;
      w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(file.name)}</title><style>body{font-family:-apple-system,Noto Sans SC,sans-serif;max-width:860px;margin:40px auto;padding:0 24px;line-height:1.8;color:#1A1A1A}pre{background:#f5f5f2;padding:16px;border-radius:8px;overflow-x:auto;font-size:14px}code{background:#f0efe9;padding:2px 6px;border-radius:3px;font-size:14px}pre code{background:none;padding:0}h1,h2,h3{font-family:Georgia,serif}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px 12px}th{background:#f5f5f2}blockquote{border-left:4px solid #ddd;margin:0;padding-left:16px;color:#666}img{max-width:100%}a{color:#2563EB}</style></head><body><pre>${escapeHtml(state.content)}</pre></body></html>`);
      w.document.close();
      return;
    }
    // 其他阶段直接用当前 URL
    if (state.phase === 'iframe' || state.phase === 'image' || state.phase === 'html') {
      if (state.url) window.open(state.url, '_blank', 'noopener,noreferrer');
    }
  };

  const renderBody = () => {
    switch (state.phase) {
      case 'loading':
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center" style={{ color: '#6B7280' }}>
              <div
                className="animate-spin rounded-full h-10 w-10 mx-auto mb-3"
                style={{ borderWidth: 2, borderStyle: 'solid', borderColor: '#ECECE6', borderTopColor: '#2563EB' }}
              />
              <p className="text-sm">加载中...</p>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-8">
              <AlertCircle style={{ width: 48, height: 48, color: '#DC2626', margin: '0 auto 16px', opacity: 0.7 }} />
              <p style={{ color: '#DC2626', marginBottom: 8 }}>预览失败</p>
              <p style={{ fontSize: 13, color: '#9CA3AF' }}>{state.message}</p>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="flex-1 flex items-center justify-center p-8" style={{ background: '#1A1A1A' }}>
            <img
              src={state.url}
              alt={file.name}
              style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 120px)', objectFit: 'contain', borderRadius: 8 }}
              onError={() => setState({ phase: 'error', message: '图片加载失败' })}
            />
          </div>
        );

      case 'html':
      case 'iframe':
        return (
          <iframe
            src={state.url}
            title={file.name}
            className="flex-1 w-full border-0"
            style={{ minHeight: 0 }}
          />
        );

      case 'content':
        return (
          <div className="flex-1 overflow-hidden">
            <FilePreview
              content={state.content}
              fileName={file.name}
              filePath={undefined}
              isLoading={false}
              error={null}
              client={client}
              fileId={String(file.id)}
            />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* 顶部工具栏 */}
      <div
        className="flex items-center justify-between px-8 py-3 border-b flex-shrink-0"
        style={{ background: '#F5F3EE', borderColor: '#ECECE6' }}
      >
        <div className="min-w-0 flex-1 mr-4">
          <p className="text-sm font-medium truncate" style={{ fontFamily: 'Georgia, "Noto Serif SC", serif', color: '#1A1A1A' }}>{file.name}</p>
          {(file.size || file.updateTime || file.createTime) && (
            <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>
              {[
                file.size ? formatSize(file.size) : null,
                (file.updateTime ?? file.createTime)
                  ? formatDate((file.updateTime ?? file.createTime)!)
                  : null,
              ].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={copyKbLink}
            title="复制 KB 预览链接"
            className="flex items-center justify-center hover:bg-[#EDEBE4] transition-colors"
            style={{ width: 32, height: 32, borderRadius: 8, color: copied ? '#16A34A' : '#6B7280' }}
          >
            {copied ? <Check className="w-4 h-4" /> : <Link className="w-4 h-4" />}
          </button>
          {state.phase !== 'loading' && state.phase !== 'error' && (
            <button
              onClick={openInNewTab}
              title="在新标签页打开"
              className="flex items-center justify-center hover:bg-[#EDEBE4] hover:text-[#1A1A1A] transition-colors"
              style={{ width: 32, height: 32, borderRadius: 8, color: '#6B7280' }}
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            title="关闭 (Esc)"
            className="flex items-center justify-center hover:bg-[#EDEBE4] hover:text-[#1A1A1A] transition-colors"
            style={{ width: 32, height: 32, borderRadius: 8, color: '#6B7280' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderBody()}
      </div>
    </div>
  );
}
