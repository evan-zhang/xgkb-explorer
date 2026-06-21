import { useState, useEffect } from 'react';
import { Folder, FileText } from 'lucide-react';
import type { KbApiClient } from '../lib/api';
import type { FileListItem } from '../lib/types';

interface FileExplorerProps {
  client: KbApiClient;
  folderId: string;
  onFileSelect: (file: FileListItem) => void;
  onFolderNavigate: (folder: FileListItem) => void;
}

function getFileIconColor(suffix: string): string {
  if (['md', 'markdown', 'mdown', 'mkd'].includes(suffix)) return 'text-blue-500';
  if (['js', 'jsx', 'ts', 'tsx', 'json'].includes(suffix)) return 'text-yellow-500';
  if (['py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h'].includes(suffix)) return 'text-green-500';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(suffix)) return 'text-purple-400';
  if (['html', 'htm', 'css', 'scss', 'less'].includes(suffix)) return 'text-orange-500';
  return 'text-gray-400';
}

function ExplorerCard({ item, onClick }: { item: FileListItem; onClick: () => void }) {
  const isFolder = item.type === 1;
  const suffix = isFolder ? '' : (item.name.split('.').pop()?.toLowerCase() || '');
  const updateDate = item.updateTime
    ? new Date(item.updateTime).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    : null;

  return (
    <div
      onClick={onClick}
      className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100
        cursor-pointer hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-sm
        transition-all duration-150 select-none"
    >
      <div className={`w-12 h-12 flex items-center justify-center rounded-xl flex-shrink-0
        ${isFolder ? 'bg-blue-50' : 'bg-gray-50'}`}
      >
        {isFolder ? (
          <Folder className="w-7 h-7 text-blue-400" />
        ) : (
          <FileText className={`w-6 h-6 ${getFileIconColor(suffix)}`} />
        )}
      </div>

      <p className="text-xs text-center text-gray-700 group-hover:text-blue-700
        line-clamp-2 leading-tight w-full break-all min-h-[2.5rem]"
      >
        {item.name}
      </p>

      <div className="flex flex-col items-center gap-0.5 mt-auto">
        {!isFolder && suffix && (
          <span className="text-[10px] uppercase tracking-wider text-gray-300 font-semibold">
            {suffix}
          </span>
        )}
        {updateDate && (
          <span className="text-[10px] text-gray-300">{updateDate}</span>
        )}
      </div>
    </div>
  );
}

export function FileExplorer({ client, folderId, onFileSelect, onFolderNavigate }: FileExplorerProps) {
  const [files, setFiles] = useState<FileListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    client.getChildFiles(folderId).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        const sorted = [...result.value].sort((a, b) => {
          if (a.type === 1 && b.type !== 1) return -1;
          if (a.type !== 1 && b.type === 1) return 1;
          return 0;
        });
        setFiles(sorted);
      } else {
        setError(result.error);
      }
      setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [client, folderId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-300" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-40 text-red-400 text-sm px-4 text-center">
        {error}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        空文件夹
      </div>
    );
  }

  return (
    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {files.map((file) => (
        <ExplorerCard
          key={String(file.id)}
          item={file}
          onClick={() => (file.type === 1 ? onFolderNavigate(file) : onFileSelect(file))}
        />
      ))}
    </div>
  );
}
