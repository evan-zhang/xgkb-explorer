import { useEffect } from 'react';
import { X } from 'lucide-react';
import { FilePreview } from './FilePreview';
import type { KbApiClient } from '../lib/api';
import type { FileListItem } from '../lib/types';

interface FileViewerModalProps {
  client: KbApiClient;
  file: FileListItem;
  content: string | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

export function FileViewerModal({ client, file, content, isLoading, error, onClose }: FileViewerModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div
        className="flex items-center justify-between px-8 py-3 border-b flex-shrink-0"
        style={{ background: '#F5F3EE', borderColor: '#ECECE6' }}
      >
        <span
          className="text-sm font-medium truncate"
          style={{ fontFamily: 'Georgia, "Noto Serif SC", serif', color: '#1A1A1A' }}
        >{file.name}</span>
        <button
          onClick={onClose}
          title="关闭 (Esc)"
          className="flex items-center justify-center hover:bg-[#EDEBE4] hover:text-[#1A1A1A] transition-colors flex-shrink-0 ml-4"
          style={{ width: 32, height: 32, borderRadius: 8, color: '#6B7280' }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <FilePreview
          content={content}
          fileName={file.name}
          filePath={undefined}
          isLoading={isLoading}
          error={error}
          client={client}
          fileId={String(file.id)}
        />
      </div>
    </div>
  );
}
