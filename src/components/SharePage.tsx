import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ChevronLeft, FileText, Folder, RefreshCw } from 'lucide-react';
import { TokenApiClient } from '../lib/api';
import type { DirectoryShareParams } from '../lib/share';
import type { DownloadInfoVO, FileListItem } from '../lib/types';

interface SharePageProps {
  share: DirectoryShareParams;
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

type PreviewState =
  | { phase: 'idle' }
  | { phase: 'loading'; file: FileListItem }
  | { phase: 'ready'; file: FileListItem; url: string; kind: 'image' | 'frame' }
  | { phase: 'error'; file: FileListItem; message: string };

function getFileSuffix(file: FileListItem): string {
  return (file.suffix || file.name.split('.').pop() || '').toLowerCase();
}

function isImageFile(file: FileListItem): boolean {
  return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(getFileSuffix(file));
}

function formatSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function resolvePreviewUrl(info: DownloadInfoVO): string {
  return info.previewUrl || info.downloadUrl || '';
}

function SharePreview({
  state,
  onClose,
}: {
  state: Exclude<PreviewState, { phase: 'idle' }>;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div
        className="flex items-center justify-between border-b px-6 py-3"
        style={{ background: '#F5F3EE', borderColor: '#ECECE6' }}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium" style={{ color: '#1A1A1A' }}>
            {state.file.name}
          </p>
          {state.file.size ? (
            <p className="mt-0.5 text-xs" style={{ color: '#9CA3AF' }}>{formatSize(state.file.size)}</p>
          ) : null}
        </div>
        <button
          onClick={onClose}
          className="rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-[#ECECE6]"
          style={{ borderColor: '#E8E8E5', color: '#4B5563', background: '#FFFFFF' }}
        >
          关闭
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {state.phase === 'loading' && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center" style={{ color: '#6B7280' }}>
              <div
                className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full"
                style={{ borderWidth: 2, borderStyle: 'solid', borderColor: '#ECECE6', borderTopColor: '#2563EB' }}
              />
              <p className="text-sm">正在加载预览...</p>
            </div>
          </div>
        )}

        {state.phase === 'error' && (
          <div className="flex h-full items-center justify-center px-8 text-center">
            <div>
              <AlertCircle className="mx-auto mb-3 h-10 w-10" style={{ color: '#DC2626' }} />
              <p className="mb-2 text-sm font-medium" style={{ color: '#DC2626' }}>预览失败</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>{state.message}</p>
            </div>
          </div>
        )}

        {state.phase === 'ready' && state.kind === 'image' && (
          <div className="flex h-full items-center justify-center p-8" style={{ background: '#1A1A1A' }}>
            <img src={state.url} alt={state.file.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
        )}

        {state.phase === 'ready' && state.kind === 'frame' && (
          <iframe src={state.url} title={state.file.name} className="h-full w-full border-0" />
        )}
      </div>
    </div>
  );
}

export function SharePage({ share }: SharePageProps) {
  const client = useMemo(
    () => new TokenApiClient(share.token, share.serverUrl),
    [share.token, share.serverUrl],
  );
  const [currentFolderId, setCurrentFolderId] = useState(share.directoryId);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([
    { id: share.directoryId, name: share.name || share.directoryId },
  ]);
  const [files, setFiles] = useState<FileListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [preview, setPreview] = useState<PreviewState>({ phase: 'idle' });

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    client.getChildFiles(currentFolderId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setFiles([]);
        setIsLoading(false);
        return;
      }
      setFiles([...result.value].sort((a, b) => {
        if (a.type === 1 && b.type !== 1) return -1;
        if (a.type !== 1 && b.type === 1) return 1;
        return 0;
      }));
      setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [client, currentFolderId, refreshKey]);

  const openFolder = useCallback((folder: FileListItem) => {
    setCurrentFolderId(String(folder.id));
    setBreadcrumb((prev) => [...prev, { id: String(folder.id), name: folder.name }]);
  }, []);

  const navigateToCrumb = useCallback((index: number) => {
    const crumb = breadcrumb[index];
    setCurrentFolderId(crumb.id);
    setBreadcrumb((prev) => prev.slice(0, index + 1));
  }, [breadcrumb]);

  const openFile = useCallback(async (file: FileListItem) => {
    setPreview({ phase: 'loading', file });
    const result = await client.getDownloadInfo(String(file.id));
    if (!result.ok) {
      setPreview({ phase: 'error', file, message: result.error });
      return;
    }
    const url = resolvePreviewUrl(result.value);
    if (!url) {
      setPreview({ phase: 'error', file, message: '接口没有返回可预览地址。' });
      return;
    }
    setPreview({ phase: 'ready', file, url, kind: isImageFile(file) ? 'image' : 'frame' });
  }, [client]);

  return (
    <div className="flex h-screen flex-col bg-[#FAFAF7]">
      <header
        className="flex flex-shrink-0 items-center justify-between border-b px-6 py-4"
        style={{ background: 'rgba(250,250,247,0.96)', borderColor: '#ECECE6' }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: '#1A1A1A', color: '#F5E6D3', fontFamily: 'Georgia, serif', fontWeight: 700 }}
            >
              玄
            </span>
            <span className="truncate text-base font-semibold" style={{ color: '#1A1A1A' }}>
              {share.name || '共享目录'}
            </span>
          </div>
          <p className="mt-1 text-xs" style={{ color: '#9CA3AF' }}>只读预览</p>
        </div>
        <button
          onClick={() => setRefreshKey((value) => value + 1)}
          title="刷新"
          className="rounded-lg p-2 transition-colors hover:bg-[#ECECE6]"
          style={{ color: '#6B7280' }}
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </header>

      <div
        className="flex flex-shrink-0 items-center gap-1.5 overflow-x-auto border-b bg-white px-6 py-3"
        style={{ borderColor: '#ECECE6' }}
      >
        {breadcrumb.length > 1 && (
          <button
            onClick={() => navigateToCrumb(breadcrumb.length - 2)}
            className="mr-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors hover:bg-[#F0EFEA]"
            style={{ color: '#6B7280' }}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            返回
          </button>
        )}
        {breadcrumb.map((crumb, index) => (
          <Fragment key={`${crumb.id}-${index}`}>
            {index > 0 && <span className="text-xs" style={{ color: '#C0C0B8' }}>/</span>}
            <button
              onClick={() => navigateToCrumb(index)}
              className={`whitespace-nowrap rounded px-1 py-0.5 text-xs transition-colors ${
                index === breadcrumb.length - 1 ? 'font-medium' : 'hover:bg-[#F0EFEA]'
              }`}
              style={{ color: index === breadcrumb.length - 1 ? '#1A1A1A' : '#6B7280' }}
            >
              {crumb.name}
            </button>
          </Fragment>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-56 items-center justify-center">
            <div
              className="h-7 w-7 animate-spin rounded-full"
              style={{ borderWidth: 2, borderStyle: 'solid', borderColor: '#ECECE6', borderTopColor: '#2563EB' }}
            />
          </div>
        ) : error ? (
          <div className="flex h-56 items-center justify-center px-6 text-center text-sm" style={{ color: '#DC2626' }}>
            {error}
          </div>
        ) : files.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-sm" style={{ color: '#9CA3AF' }}>
            空文件夹
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
            {files.map((file) => {
              const isFolder = file.type === 1;
              return (
                <button
                  key={String(file.id)}
                  onClick={() => (isFolder ? openFolder(file) : void openFile(file))}
                  className="flex min-h-[132px] flex-col items-center gap-2 rounded-xl border bg-white p-3 text-center transition-colors hover:bg-[#F5F3EE]"
                  style={{ borderColor: '#ECECE6' }}
                >
                  <span
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ background: isFolder ? '#FBF7EE' : '#F5F3EE' }}
                  >
                    {isFolder ? (
                      <Folder className="h-7 w-7" style={{ color: '#B45309' }} />
                    ) : (
                      <FileText className="h-6 w-6" style={{ color: '#6B7280' }} />
                    )}
                  </span>
                  <span className="line-clamp-2 w-full break-all text-xs leading-5" style={{ color: '#4B5563' }}>
                    {file.name}
                  </span>
                  {!isFolder && file.size ? (
                    <span className="mt-auto text-[10px]" style={{ color: '#C0C0B8' }}>{formatSize(file.size)}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </main>

      {preview.phase !== 'idle' && (
        <SharePreview state={preview} onClose={() => setPreview({ phase: 'idle' })} />
      )}
    </div>
  );
}

