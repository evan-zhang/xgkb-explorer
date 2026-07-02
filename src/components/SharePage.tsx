import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, FileText, X } from 'lucide-react';
import { TokenApiClient } from '../lib/api';
import { useProjectsHub } from '../lib/hooks';
import { createBlobPreviewUrl, isImageFile } from '../lib/preview';
import type { DirectoryShareParams } from '../lib/share';
import type { FileListItem } from '../lib/types';
import { ProjectDetail } from './ProjectDetail';
import { ProjectsHub } from './ProjectsHub';

interface SharePageProps {
  share: DirectoryShareParams;
}

type PreviewState =
  | { phase: 'idle' }
  | { phase: 'loading'; file: FileListItem }
  | { phase: 'ready'; file: FileListItem; url: string; kind: 'image' | 'frame'; blobUrl: string }
  | { phase: 'error'; file: FileListItem; message: string };

function formatSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
        className="flex flex-shrink-0 items-center justify-between border-b px-8 py-3"
        style={{ background: '#F5F3EE', borderColor: '#ECECE6' }}
      >
        <div className="mr-4 min-w-0 flex-1">
          <p
            className="truncate text-sm font-medium"
            style={{ fontFamily: 'Georgia, "Noto Serif SC", serif', color: '#1A1A1A' }}
          >
            {state.file.name}
          </p>
          {state.file.size ? (
            <p className="mt-0.5 text-[11px]" style={{ color: '#9CA3AF' }}>
              {formatSize(state.file.size)}
            </p>
          ) : null}
        </div>

        <button
          onClick={onClose}
          title="关闭 (Esc)"
          className="flex items-center justify-center transition-colors hover:bg-[#EDEBE4] hover:text-[#1A1A1A]"
          style={{ width: 32, height: 32, borderRadius: 8, color: '#6B7280' }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {state.phase === 'loading' && (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center" style={{ color: '#6B7280' }}>
              <div
                className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full"
                style={{ borderWidth: 2, borderStyle: 'solid', borderColor: '#ECECE6', borderTopColor: '#2563EB' }}
              />
              <p className="text-sm">加载中...</p>
            </div>
          </div>
        )}

        {state.phase === 'error' && (
          <div className="flex flex-1 items-center justify-center">
            <div className="px-8 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 opacity-70" style={{ color: '#DC2626' }} />
              <p className="mb-2" style={{ color: '#DC2626' }}>预览失败</p>
              <p className="text-[13px]" style={{ color: '#9CA3AF' }}>{state.message}</p>
            </div>
          </div>
        )}

        {state.phase === 'ready' && state.kind === 'image' && (
          <div className="flex flex-1 items-center justify-center p-8" style={{ background: '#1A1A1A' }}>
            <img
              src={state.url}
              alt={state.file.name}
              style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 120px)', objectFit: 'contain', borderRadius: 8 }}
            />
          </div>
        )}

        {state.phase === 'ready' && state.kind === 'frame' && (
          <iframe
            src={state.url}
            title={state.file.name}
            className="min-h-0 w-full flex-1 border-0"
          />
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
  const project = useMemo<FileListItem>(() => ({
    id: share.directoryId,
    name: share.name || share.directoryId,
    type: 1,
    entryKind: 'folder',
  }), [share.directoryId, share.name]);
  const sharedFile = useMemo<FileListItem>(() => ({
    id: share.itemId || share.directoryId,
    name: share.itemName || share.name || share.itemId || share.directoryId,
    type: 0,
  }), [share.directoryId, share.itemId, share.itemName, share.name]);
  const shareView = share.view ?? 'project';
  const {
    projects,
    isLoading: bookshelfLoading,
    error: bookshelfError,
    directoryName,
    load: loadBookshelf,
  } = useProjectsHub(client, shareView === 'bookshelf' ? share.directoryId : '');
  const visibleProjects = useMemo(() => {
    if (!share.itemId) return projects;
    return projects.filter((item) => String(item.id) === share.itemId);
  }, [projects, share.itemId]);
  const [selectedProject, setSelectedProject] = useState<FileListItem | null>(null);
  const [preview, setPreview] = useState<PreviewState>({ phase: 'idle' });

  const closePreview = useCallback(() => {
    setPreview({ phase: 'idle' });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePreview();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [closePreview]);

  useEffect(() => {
    if (preview.phase !== 'ready') return;
    return () => URL.revokeObjectURL(preview.blobUrl);
  }, [preview]);

  useEffect(() => {
    if (shareView === 'bookshelf') loadBookshelf();
  }, [shareView, loadBookshelf]);

  useEffect(() => {
    setSelectedProject(null);
  }, [share.directoryId, shareView]);

  const openFile = useCallback(async (file: FileListItem) => {
    closePreview();
    setPreview({ phase: 'loading', file });

    const result = await client.getDownloadInfo(String(file.id));
    if (!result.ok) {
      setPreview({ phase: 'error', file, message: result.error });
      return;
    }
    if (!result.value.downloadUrl) {
      setPreview({ phase: 'error', file, message: '接口没有返回可预览地址。' });
      return;
    }

    try {
      const fileName = result.value.fileName || file.name;
      const blobUrl = await createBlobPreviewUrl(result.value.downloadUrl, fileName);
      setPreview({
        phase: 'ready',
        file,
        url: blobUrl,
        blobUrl,
        kind: isImageFile(file) ? 'image' : 'frame',
      });
    } catch (e) {
      setPreview({ phase: 'error', file, message: e instanceof Error ? e.message : String(e) });
    }
  }, [client, closePreview]);

  useEffect(() => {
    if (shareView === 'file') void openFile(sharedFile);
  }, [shareView, sharedFile, openFile]);

  const handleBookshelfItemSelect = useCallback((item: FileListItem) => {
    if (item.type !== 1) {
      void openFile(item);
      return;
    }
    setSelectedProject(item);
  }, [openFile]);

  return (
    <div className="flex h-screen flex-col bg-[#FAFAF7]">
      <header
        className="flex flex-shrink-0 items-center justify-between border-b px-10 py-5"
        style={{ background: 'rgba(250,250,247,0.92)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderColor: '#ECECE6', position: 'relative', zIndex: 40 }}
      >
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex flex-shrink-0 items-center gap-2.5">
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                flexShrink: 0,
                background: 'linear-gradient(135deg, #1A1A1A 0%, #3A3A3A 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F5E6D3',
                fontFamily: 'Georgia, serif',
                fontWeight: 700,
                fontSize: 16,
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.15)',
              }}
            >
              玄
            </div>
            <span style={{ fontFamily: 'Georgia, "Noto Serif SC", serif', fontSize: 20, fontWeight: 600, letterSpacing: '0.5px', color: '#1A1A1A', whiteSpace: 'nowrap' }}>
              玄关知识库<span style={{ color: '#6B7280', fontWeight: 400, fontSize: 16 }}>/ Explorer</span>
            </span>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <span
              className="truncate"
              style={{ color: '#1A1A1A', fontSize: 13, fontWeight: 500, maxWidth: 220 }}
            >
              {project.name}
            </span>
            <span
              className="flex-shrink-0 rounded-md border px-2 py-1 text-xs"
              style={{ borderColor: '#E8E8E5', color: '#6B7280', background: '#FFFFFF' }}
            >
              只读预览
            </span>
          </div>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 overflow-hidden">
        {shareView === 'file' ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="w-full max-w-md text-center">
              <div
                className="mx-auto mb-4 flex items-center justify-center rounded-xl"
                style={{ width: 56, height: 56, background: '#F5F3EE', color: '#6B7280' }}
              >
                <FileText className="h-7 w-7" />
              </div>
              <h1
                className="break-words"
                style={{ color: '#1A1A1A', fontSize: 20, fontWeight: 650, lineHeight: 1.35 }}
              >
                {sharedFile.name}
              </h1>
              <p className="mt-2 text-sm" style={{ color: '#9CA3AF' }}>只读文件预览</p>
              <button
                onClick={() => void openFile(sharedFile)}
                className="mt-6 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: '#1A1A1A', color: '#FFFFFF' }}
              >
                打开预览
              </button>
            </div>
          </div>
        ) : shareView === 'bookshelf' && !selectedProject ? (
          <ProjectsHub
            client={client}
            projects={visibleProjects}
            isLoading={bookshelfLoading}
            error={bookshelfError}
            title={project.name || directoryName || '共享书架'}
            itemLabel="条目"
            emptyText={share.itemId ? '未找到被分享的条目' : '该书架暂无条目'}
            mode="projects"
            readOnly
            onSelectProject={handleBookshelfItemSelect}
            onReload={loadBookshelf}
          />
        ) : (
          <ProjectDetail
            client={client}
            project={selectedProject ?? project}
            readOnly
            onBack={shareView === 'bookshelf' && selectedProject ? () => setSelectedProject(null) : undefined}
            onFileOpen={openFile}
          />
        )}
      </main>

      {preview.phase !== 'idle' && (
        <SharePreview state={preview} onClose={closePreview} />
      )}
    </div>
  );
}
