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
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <span className="text-sm font-medium text-gray-700 truncate">{file.name}</span>
        <button
          onClick={onClose}
          title="关闭 (Esc)"
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors flex-shrink-0 ml-4"
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
