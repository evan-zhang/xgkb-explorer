import { useCallback, useState, useEffect, useRef } from 'react';
import { ArrowLeft, BookMarked, Boxes, FolderPlus, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, Star, Share2, MoreHorizontal } from 'lucide-react';
import type { KbApiClient } from '../lib/api';
import type { FileListItem } from '../lib/types';
import { useReadmePreview } from '../lib/hooks';
import { ContextMenu } from './ContextMenu';

const PAGE_SIZE = 12;

const COVER_GRADIENTS: [string, string][] = [
  ['#1E3A5F', '#2D5B8E'],
  ['#4A2D6B', '#6B3FA0'],
  ['#1B4332', '#2D6A4F'],
  ['#B7542E', '#D77A4E'],
  ['#2A2A2A', '#4A4A4A'],
  ['#0F4C81', '#1D7FBF'],
  ['#7C2D12', '#B45309'],
  ['#1F2937', '#374151'],
];

function nameToGradient(name: string): [string, string] {
  let h = 0;
  for (let i = 0; i < name.length; i++) { h = (h << 5) - h + name.charCodeAt(i); h |= 0; }
  return COVER_GRADIENTS[Math.abs(h) % COVER_GRADIENTS.length];
}

interface ProjectCardProps {
  project: FileListItem;
  client: KbApiClient;
  isStarred: boolean;
  onClick: () => void;
  onToggleStar?: (e: React.MouseEvent) => void;
  onContextMenu?: (item: FileListItem, x: number, y: number) => void;
  readOnly?: boolean;
}

function ProjectCard({ project, client, isStarred, onClick, onToggleStar, onContextMenu, readOnly = false }: ProjectCardProps) {
  const { preview, isLoading: previewLoading } = useReadmePreview(client, String(project.id));
  const [c1, c2] = nameToGradient(project.name);
  const initial = project.name.charAt(0);

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer transition-all duration-200 hover:-translate-y-1.5"
      style={{
        height: 276,
        borderRadius: 12,
        overflow: 'hidden',
        background: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 8px rgba(0,0,0,0.05), 0 16px 32px rgba(0,0,0,0.10)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'; }}
    >
      {/* Gradient cover */}
      <div style={{
        height: 128,
        background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color: '#FFFFFF', padding: '0 16px', position: 'relative',
      }}>
        <div style={{ fontSize: 30, marginBottom: 6, fontFamily: 'Georgia, serif', fontWeight: 600, opacity: 0.9 }}>{initial}</div>
        <div style={{ fontSize: 13, fontWeight: 600, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', opacity: 0.95 }}>
          {project.name}
        </div>

        {!readOnly && (
          <>
            {/* More button */}
            <button
              onClick={(e) => { e.stopPropagation(); onContextMenu?.(project, e.clientX, e.clientY); }}
              className="transition-all duration-150"
              style={{
                position: 'absolute', top: 8, right: 40,
                width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.85)',
                border: 'none', cursor: 'pointer',
              }}
            >
              <MoreHorizontal style={{ width: 14, height: 14 }} />
            </button>

            {/* Star button */}
            <button
              onClick={onToggleStar}
              title={isStarred ? '取消收藏' : '收藏此项目'}
              className="transition-all duration-150"
              style={{
                position: 'absolute', top: 8, right: 8,
                width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 6,
                background: isStarred ? 'rgba(252,211,77,0.2)' : 'rgba(255,255,255,0.12)',
                color: isStarred ? '#FCD34D' : 'rgba(255,255,255,0.65)',
                border: 'none', cursor: 'pointer',
              }}
            >
              <Star style={{ width: 14, height: 14 }} fill={isStarred ? 'currentColor' : 'none'} />
            </button>
          </>
        )}
      </div>

      {/* Info section */}
      <div style={{ height: 148, padding: '12px 16px 14px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, fontSize: 13, color: '#4B5563', lineHeight: 1.55, overflow: 'hidden' }}>
          {previewLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div className="animate-pulse" style={{ height: 9, background: '#ECECE6', borderRadius: 2 }} />
              <div className="animate-pulse" style={{ height: 9, background: '#ECECE6', borderRadius: 2, width: '80%' }} />
              <div className="animate-pulse" style={{ height: 9, background: '#ECECE6', borderRadius: 2, width: '92%' }} />
              <div className="animate-pulse" style={{ height: 9, background: '#ECECE6', borderRadius: 2, width: '70%' }} />
            </div>
          ) : preview ? (
            <div style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical', textOverflow: 'ellipsis', wordBreak: 'break-word' } as React.CSSProperties}>
              {preview}
            </div>
          ) : (
            <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>暂无简介</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface SpaceCardProps {
  space: FileListItem;
  onClick: () => void;
}

function SpaceCard({ space, onClick }: SpaceCardProps) {
  const [c1, c2] = nameToGradient(space.name);
  const initial = space.name.charAt(0);
  const updateDate = space.updateTime
    ? new Date(space.updateTime).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    : null;

  return (
    <button
      onClick={onClick}
      className="group text-left transition-all duration-200 hover:-translate-y-1"
      style={{
        minHeight: 176,
        borderRadius: 10,
        overflow: 'hidden',
        background: '#FFFFFF',
        border: '1px solid #E8E8E5',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; }}
    >
      <div style={{ height: 8, background: `linear-gradient(90deg, ${c1} 0%, ${c2} 100%)` }} />
      <div style={{ padding: '18px 18px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
              color: '#FFFFFF',
              fontFamily: 'Georgia, serif',
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            {initial}
          </div>
          <span
            className="inline-flex items-center gap-1.5"
            style={{
              padding: '4px 8px',
              borderRadius: 999,
              background: '#F5F3EE',
              color: '#6B7280',
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            <Boxes className="w-3 h-3" />
            空间
          </span>
        </div>

        <div>
          <h3
            style={{
              color: '#1A1A1A',
              fontSize: 17,
              fontWeight: 650,
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            } as React.CSSProperties}
          >
            {space.name}
          </h3>
          <p style={{ color: '#9CA3AF', fontSize: 12, marginTop: 8 }}>
            {updateDate ? `更新于 ${updateDate}` : `ID: ${space.id}`}
          </p>
        </div>
      </div>
    </button>
  );
}

interface DirectoryCardProps {
  directory: FileListItem;
  onClick: () => void;
}

function DirectoryCard({ directory, onClick }: DirectoryCardProps) {
  const updateDate = directory.updateTime
    ? new Date(directory.updateTime).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    : null;

  return (
    <button
      onClick={onClick}
      className="group text-left transition-all duration-150"
      style={{
        minHeight: 132,
        borderRadius: 10,
        background: '#FFFFFF',
        border: '1px solid #E8E8E5',
        padding: 16,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#B8C7E6';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 20px rgba(37,99,235,0.10)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#E8E8E5';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: 42, height: 42, borderRadius: 10, background: '#FBF7EE', color: '#B45309' }}
        >
          <BookMarked className="w-5 h-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              color: '#1A1A1A',
              fontSize: 15,
              fontWeight: 650,
              lineHeight: 1.35,
            } as React.CSSProperties}
          >
            {directory.name}
          </span>
          <span style={{ display: 'block', color: '#9CA3AF', fontSize: 12, marginTop: 6 }}>
            {updateDate ? `更新于 ${updateDate}` : `目录 ID: ${directory.id}`}
          </span>
        </span>
      </div>
      <span
        className="inline-flex items-center gap-1.5"
        style={{
          marginTop: 18,
          color: '#2563EB',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <FolderPlus className="w-4 h-4" />
        放入书架
      </span>
    </button>
  );
}

interface ProjectsHubProps {
  client: KbApiClient;
  projects: FileListItem[];
  isLoading: boolean;
  error: string | null;
  title?: string;
  itemLabel?: string;
  emptyText?: string;
  preserveOrder?: boolean;
  mode?: 'spaces' | 'directories' | 'projects';
  starredProjectIds?: string[];
  onBack?: () => void;
  onAddDirectory?: (directory: FileListItem) => void;
  onSelectProject: (project: FileListItem) => void;
  onToggleStar?: (projectId: string) => void;
  onShareProject?: (project: FileListItem) => boolean | Promise<boolean>;
  onReload: () => void;
  readOnly?: boolean;
}

export function ProjectsHub({
  client,
  projects,
  isLoading,
  error,
  title = '我的书架',
  itemLabel = '项目',
  emptyText = '该目录下没有项目',
  preserveOrder = false,
  mode = 'projects',
  starredProjectIds = [],
  onBack,
  onAddDirectory,
  onSelectProject,
  onToggleStar,
  onShareProject,
  onReload,
  readOnly = false,
}: ProjectsHubProps) {
  const handleReload = useCallback(() => onReload(), [onReload]);
  const [page, setPage] = useState(1);
  const starred = readOnly ? new Set<string>() : new Set(starredProjectIds);
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

  useEffect(() => { setPage(1); }, [projects]);

  const toggleStar = useCallback((projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleStar?.(projectId);
    setPage(1);
  }, [onToggleStar]);

  const byUpdateTime = (a: FileListItem, b: FileListItem) => {
    if (!a.updateTime && !b.updateTime) return 0;
    if (!a.updateTime) return 1;
    if (!b.updateTime) return -1;
    return b.updateTime - a.updateTime;
  };

  const sortedAll = preserveOrder ? projects : [...projects].sort(byUpdateTime);
  const starredProjects = preserveOrder || readOnly ? [] : sortedAll.filter(p => starred.has(String(p.id)));
  const unstarredProjects = preserveOrder ? sortedAll : sortedAll.filter(p => !starred.has(String(p.id)));

  const totalPages = Math.max(1, Math.ceil(unstarredProjects.length / PAGE_SIZE));
  const paged = unstarredProjects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const isSpacesMode = mode === 'spaces';
  const isDirectoriesMode = mode === 'directories';

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto" style={{ padding: '32px 40px 64px' }}>
        <div style={{ marginBottom: 24 }}>
          <div className="animate-pulse" style={{ height: 32, width: 160, background: '#ECECE6', borderRadius: 6, marginBottom: 8 }} />
          <div className="animate-pulse" style={{ height: 16, width: 80, background: '#ECECE6', borderRadius: 4 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(196px, 1fr))', gap: 20 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse" style={{ height: 276, borderRadius: 12, background: '#ECECE6' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-8 max-w-md">
          <AlertCircle style={{ width: 48, height: 48, color: '#DC2626', margin: '0 auto 16px', opacity: 0.7 }} />
          <p style={{ color: '#DC2626', fontWeight: 500, marginBottom: 8 }}>无法加载{itemLabel}列表</p>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>{error}</p>
          <button
            onClick={handleReload}
            className="flex items-center gap-2 mx-auto transition-colors"
            style={{ padding: '8px 16px', background: '#FEF2F2', color: '#DC2626', borderRadius: 8, fontSize: 13, border: '1px solid #FECACA' }}
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </button>
        </div>
      </div>
    );
  }

  const SectionHead = ({ title, count, action }: { title: string; count: number; action?: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
      <div>
        <h2 style={{ fontFamily: 'Georgia, "Noto Serif SC", serif', fontSize: 22, fontWeight: 600, color: '#1A1A1A', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: 10 }}>
          {title}
          <span style={{ fontFamily: 'inherit', fontSize: 12, fontWeight: 500, background: '#F0EFEA', color: '#6B7280', padding: '2px 9px', borderRadius: 10, letterSpacing: '0.3px' }}>
            {count}
          </span>
        </h2>
      </div>
      {action}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: '32px 40px 64px' }}>
      {/* 顶部大标题 + 刷新 */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 hover:text-[#2563EB] transition-colors"
              style={{ color: '#6B7280', fontSize: 13, marginBottom: 10 }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              返回空间
            </button>
          )}
          <h1 style={{ fontFamily: 'Georgia, "Noto Serif SC", serif', fontSize: 28, fontWeight: 600, color: '#1A1A1A', letterSpacing: '0.3px' }}>
            {title}
          </h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>共 {projects.length} 个{itemLabel}</p>
        </div>
        <button
          onClick={handleReload}
          className="flex items-center justify-center hover:bg-[#F0EFEA] hover:text-[#1A1A1A] transition-colors"
          style={{ width: 38, height: 38, borderRadius: 10, color: '#6B7280' }}
          title="刷新"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#9CA3AF' }}>
          <p>{emptyText}</p>
        </div>
      ) : (
        <>
          {isSpacesMode && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 }}>
                {paged.map((space) => (
                  <SpaceCard
                    key={String(space.id)}
                    space={space}
                    onClick={() => onSelectProject(space)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination page={page} totalPages={totalPages} setPage={setPage} />
              )}
            </>
          )}

          {isDirectoriesMode && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {paged.map((directory) => (
                  <DirectoryCard
                    key={String(directory.id)}
                    directory={directory}
                    onClick={() => onAddDirectory?.(directory)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination page={page} totalPages={totalPages} setPage={setPage} />
              )}
            </>
          )}

          {/* 收藏分区 */}
          {!isSpacesMode && !isDirectoriesMode && starredProjects.length > 0 && (
            <div style={{ marginBottom: 48 }}>
              <SectionHead
                title="收藏"
                count={starredProjects.length}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(196px, 1fr))', gap: 20 }}>
                {starredProjects.map((project) => (
                  <ProjectCard
                    key={String(project.id)}
                    project={project}
                    client={client}
                    isStarred={true}
                    onClick={() => onSelectProject(project)}
                    onToggleStar={(e) => toggleStar(String(project.id), e)}
                    onContextMenu={handleContextMenu}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 其他项目分区 */}
          {!isSpacesMode && !isDirectoriesMode && unstarredProjects.length > 0 && (
            <div>
              <SectionHead
                title={starredProjects.length > 0 ? `其他${itemLabel}` : `所有${itemLabel}`}
                count={unstarredProjects.length}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(196px, 1fr))', gap: 20 }}>
                {paged.map((project) => (
                  <ProjectCard
                    key={String(project.id)}
                    project={project}
                    client={client}
                    isStarred={false}
                    onClick={() => onSelectProject(project)}
                    onToggleStar={(e) => toggleStar(String(project.id), e)}
                    onContextMenu={handleContextMenu}
                    readOnly={readOnly}
                  />
                ))}
              </div>

              {totalPages > 1 && <Pagination page={page} totalPages={totalPages} setPage={setPage} />}
            </div>
          )}
        </>
      )}

      {!readOnly && menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={[
            {
              label: '分享',
              icon: <Share2 className="w-4 h-4" />,
              onClick: async () => {
                if (onShareProject) {
                  const copied = await onShareProject(menu.item);
                  if (copied) showToast('分享链接已复制');
                  setMenu(null);
                  return;
                }
                const r = await client.getShareUrl(String(menu.item.id));
                if (r.ok) {
                  await navigator.clipboard.writeText(r.value.shareUrl);
                  showToast('分享链接已复制');
                }
                setMenu(null);
              },
            },
          ]}
          onClose={() => setMenu(null)}
        />
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: '#1A1A1A', color: '#FFFFFF',
          padding: '10px 16px', borderRadius: 10, fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>
          <Share2 className="w-4 h-4" style={{ color: '#4ADE80' }} />
          {toast}
        </div>
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  setPage,
}: {
  page: number;
  totalPages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, paddingTop: 32, paddingBottom: 8 }}>
      <button
        onClick={() => setPage((p) => p - 1)}
        disabled={page === 1}
        className="hover:border-[#2563EB] hover:text-[#2563EB] disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1"
        style={{ padding: '8px 14px', border: '1px solid #E8E8E5', background: '#FFFFFF', borderRadius: 8, fontSize: 14, cursor: 'pointer', color: '#4B5563' }}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        上一页
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => setPage(p)}
          className={p !== page ? 'hover:border-[#2563EB] hover:text-[#2563EB] transition-colors' : ''}
          style={p === page
            ? { padding: '8px 14px', background: '#1A1A1A', color: '#FFFFFF', borderRadius: 8, fontSize: 14 }
            : { padding: '8px 14px', border: '1px solid #E8E8E5', background: '#FFFFFF', color: '#4B5563', borderRadius: 8, fontSize: 14, cursor: 'pointer' }
          }
        >{p}</button>
      ))}

      <button
        onClick={() => setPage((p) => p + 1)}
        disabled={page === totalPages}
        className="hover:border-[#2563EB] hover:text-[#2563EB] disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1"
        style={{ padding: '8px 14px', border: '1px solid #E8E8E5', background: '#FFFFFF', borderRadius: 8, fontSize: 14, cursor: 'pointer', color: '#4B5563' }}
      >
        下一页
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
