import { useEffect, useState } from 'react';
import { X, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { FilePreview } from './FilePreview';
import type { KbApiClient } from '../lib/api';
import type { FileListItem } from '../lib/types';

interface FileViewerModalProps {
  client: KbApiClient;
  file: FileListItem;
  onClose: () => void;
}

const MD_EXTS = ['md', 'markdown', 'mdown', 'mkd'];
const HTML_EXTS = ['html', 'htm'];
const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'];

type PreviewState =
  | { phase: 'loading' }
  | { phase: 'iframe'; url: string }
  | { phase: 'image'; url: string }
  | { phase: 'content'; content: string }
  | { phase: 'error'; message: string };

export function FileViewerModal({ client, file, onClose }: FileViewerModalProps) {
  const [state, setState] = useState<PreviewState>({ phase: 'loading' });

  useEffect(() => {
    setState({ phase: 'loading' });
    const suffix = (file.name.split('.').pop() ?? '').toLowerCase();
    const fileId = String(file.id);

    if (IMAGE_EXTS.includes(suffix)) {
      client.getDownloadInfo(fileId).then((r) => {
        if (r.ok && r.value.downloadUrl) setState({ phase: 'image', url: r.value.downloadUrl });
        else setState({ phase: 'error', message: r.ok ? '无法获取图片链接' : r.error });
      });
      return;
    }

    if (MD_EXTS.includes(suffix) || HTML_EXTS.includes(suffix)) {
      const format = MD_EXTS.includes(suffix) ? 'md' : 'html';
      client.getPreviewTicket(fileId, format, file.name).then((r) => {
        if (r.ok) setState({ phase: 'iframe', url: r.value.previewUrl });
        else setState({ phase: 'error', message: r.error });
      });
      return;
    }

    // 其他类型（代码、纯文本等）— 下载原始内容渲染
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
              <p className="text-sm">正在生成预览...</p>
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

      case 'iframe':
        return (
          <iframe
            src={state.url}
            title={file.name}
            className="flex-1 w-full border-0"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
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

  const noImagePreview = state.phase === 'error' && IMAGE_EXTS.includes((file.name.split('.').pop() ?? '').toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* 顶部工具栏 */}
      <div
        className="flex items-center justify-between px-8 py-3 border-b flex-shrink-0"
        style={{ background: '#F5F3EE', borderColor: '#ECECE6' }}
      >
        <span
          className="text-sm font-medium truncate"
          style={{ fontFamily: 'Georgia, "Noto Serif SC", serif', color: '#1A1A1A' }}
        >{file.name}</span>

        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {noImagePreview && (
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>
              <ImageIcon style={{ width: 14, height: 14, display: 'inline', marginRight: 4 }} />
              无法预览
            </span>
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
