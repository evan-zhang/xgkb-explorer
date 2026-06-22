import { useState, useEffect, useCallback, useRef } from 'react';
import { Folder, FileText, ExternalLink, Link, Check, Share2 } from 'lucide-react';
import type { KbApiClient } from '../lib/api';
import type { FileListItem } from '../lib/types';
import { ContextMenu } from './ContextMenu';

interface FileExplorerProps {
  client: KbApiClient;
  folderId: string;
  projectId?: string;
  onFileSelect: (file: FileListItem) => void;
  onFolderNavigate: (folder: FileListItem) => void;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}/${mm}/${dd}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIconColor(suffix: string): string {
  if (['md', 'markdown', 'mdown', 'mkd'].includes(suffix)) return 'text-blue-500';
  if (['js', 'jsx', 'ts', 'tsx', 'json'].includes(suffix)) return 'text-yellow-500';
  if (['py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h'].includes(suffix)) return 'text-green-500';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(suffix)) return 'text-purple-400';
  if (['html', 'htm', 'css', 'scss', 'less'].includes(suffix)) return 'text-orange-500';
  return 'text-gray-400';
}

interface ExplorerCardProps {
  item: FileListItem;
  onClick: () => void;
  onContextMenu?: (item: FileListItem, x: number, y: number) => void;
}

function ExplorerCard({ item, onClick, onContextMenu }: ExplorerCardProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moved = useRef(false);
  const longPressTriggered = useRef(false);

  const isFolder = item.type === 1;
  const suffix = isFolder ? '' : (item.name.split('.').pop()?.toLowerCase() || '');
  const dateTs = item.updateTime ?? item.createTime;
  const updateDate = dateTs ? formatDate(dateTs) : null;

  const handleTouchStart = (e: React.TouchEvent) => {
    moved.current = false;
    longPressTriggered.current = false;
    const t = e.touches[0];
    timerRef.current = setTimeout(() => {
      if (!moved.current) {
        longPressTriggered.current = true;
        onContextMenu?.(item, t.clientX, t.clientY);
      }
    }, 500);
  };

  const handleTouchMove = () => { moved.current = true; };

  const handleTouchEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu?.(item, e.clientX, e.clientY);
  };

  const handleClick = () => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    onClick();
  };

  return (
    <div
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="group flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer
        transition-all duration-150 select-none
        bg-white border border-[#ECECE6]
        hover:border-[#C8C8C0] hover:bg-[#F5F3EE] hover:shadow-sm"
    >
      <div
        className="w-12 h-12 flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ background: isFolder ? '#FBF7EE' : '#F5F3EE' }}
      >
        {isFolder ? (
          <Folder style={{ width: 28, height: 28, color: '#B45309' }} />
        ) : (
          <FileText className={`w-6 h-6 ${getFileIconColor(suffix)}`} />
        )}
      </div>

      <p
        className="text-xs text-center line-clamp-2 leading-tight w-full break-all min-h-[2.5rem]"
        style={{ color: '#4B5563' }}
      >
        {item.name}
      </p>

      <div className="flex items-center gap-1 justify-center mt-auto flex-wrap">
        {!isFolder && item.size ? (
          <span className="text-[10px]" style={{ color: '#C0C0B8' }}>{formatSize(item.size)}</span>
        ) : null}
        {!isFolder && item.size && updateDate ? (
          <span style={{ fontSize: 9, color: '#D4D4CC' }}>·</span>
        ) : null}
        {updateDate && (
          <span className="text-[10px]" style={{ color: '#C0C0B8' }}>{updateDate}</span>
        )}
      </div>
    </div>
  );
}

export function FileExplorer({ client, folderId, projectId, onFileSelect, onFolderNavigate }: FileExplorerProps) {
  const [files, setFiles] = useState<FileListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ item: FileListItem; x: number; y: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  }, []);

  const handleContextMenu = useCallback((item: FileListItem, x: number, y: number) => {
    setMenu({ item, x, y });
  }, []);

  const menuItems = menu ? [
    ...(menu.item.type !== 1 ? [
      {
        label: '在新标签页打开',
        icon: <ExternalLink className="w-4 h-4" />,
        onClick: async () => {
          const r = await client.getDownloadInfo(String(menu.item.id), false);
          if (r.ok && r.value.downloadUrl) window.open(r.value.downloadUrl, '_blank', 'noopener,noreferrer');
          setMenu(null);
        },
      },
      {
        label: '复制文件链接',
        icon: <Link className="w-4 h-4" />,
        onClick: async () => {
          const r = await client.getDownloadInfo(String(menu.item.id), false);
          if (r.ok && r.value.downloadUrl) {
            await navigator.clipboard.writeText(r.value.downloadUrl);
            showToast('链接已复制');
          }
          setMenu(null);
        },
      },
    ] : []),
    {
      label: '分享',
      icon: <Share2 className="w-4 h-4" />,
      onClick: async () => {
        const r = await client.getShareUrl(String(menu.item.id));
        if (r.ok) {
          await navigator.clipboard.writeText(r.value.shareUrl);
          showToast('分享链接已复制');
        }
        setMenu(null);
      },
    },
  ] : [];

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const load = async () => {
      const result = await client.getChildFiles(folderId);
      if (cancelled) return;

      if (!result.ok) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      const sorted = [...result.value].sort((a, b) => {
        if (a.type === 1 && b.type !== 1) return -1;
        if (a.type !== 1 && b.type === 1) return 1;
        return 0;
      });
      setFiles(sorted);
      setIsLoading(false);

      // Enrich files with updateTime via batchGetMeta (getChildFiles doesn't include it)
      const fileIds = sorted.filter(f => f.type !== 1).map(f => String(f.id));
      if (fileIds.length === 0) return;
      const metaResult = await client.batchGetMeta(fileIds, projectId);
      if (cancelled || !metaResult.ok) return;
      const metaMap = new Map(metaResult.value.map(m => [String(m.fileId), m]));
      setFiles(prev => prev.map(f => {
        const meta = metaMap.get(String(f.id));
        if (!meta) return f;
        return {
          ...f,
          ...(meta.updateTime ? { updateTime: meta.updateTime } : {}),
          ...(meta.createTime ? { createTime: meta.createTime } : {}),
        };
      }));
    };

    load();
    return () => { cancelled = true; };
  }, [client, folderId, projectId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-6 w-6" style={{ borderWidth: 2, borderStyle: 'solid', borderColor: '#ECECE6', borderTopColor: '#6B7280' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-40 text-sm px-4 text-center" style={{ color: '#DC2626' }}>
        {error}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm" style={{ color: '#9CA3AF' }}>
        空文件夹
      </div>
    );
  }

  return (
    <>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {files.map((file) => (
          <ExplorerCard
            key={String(file.id)}
            item={file}
            onClick={() => (file.type === 1 ? onFolderNavigate(file) : onFileSelect(file))}
            onContextMenu={handleContextMenu}
          />
        ))}
      </div>

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menuItems}
          onClose={() => setMenu(null)}
        />
      )}

      {toast && (
        <div
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            background: '#1A1A1A', color: '#FFFFFF',
            padding: '10px 16px', borderRadius: 10, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
        >
          <Check className="w-4 h-4" style={{ color: '#4ADE80' }} />
          {toast}
        </div>
      )}
    </>
  );
}
