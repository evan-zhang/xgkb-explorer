import { useCallback, useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import type { KbApiClient } from '../lib/api';
import type { FileListItem } from '../lib/types';
import { useReadmePreview } from '../lib/hooks';

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
  onClick: () => void;
}

function ProjectCard({ project, client, onClick }: ProjectCardProps) {
  const { preview, isLoading: previewLoading } = useReadmePreview(client, String(project.id));
  const [c1, c2] = nameToGradient(project.name);
  const initial = project.name.charAt(0);

  const updateDate = project.updateTime
    ? new Date(project.updateTime).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    : null;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer transition-all duration-200 hover:-translate-y-1.5"
      style={{
        height: 256,
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
      </div>

      {/* Info section */}
      <div style={{ height: 128, padding: '12px 16px 14px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, fontSize: 13, color: '#4B5563', lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
          {previewLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div className="animate-pulse" style={{ height: 9, background: '#ECECE6', borderRadius: 2 }} />
              <div className="animate-pulse" style={{ height: 9, background: '#ECECE6', borderRadius: 2, width: '80%' }} />
            </div>
          ) : preview ? preview : (
            <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>暂无简介</span>
          )}
        </div>
        {updateDate && (
          <div style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, flexShrink: 0 }}>
            <Clock style={{ width: 11, height: 11 }} />
            {updateDate}
          </div>
        )}
      </div>
    </div>
  );
}

interface ProjectsHubProps {
  client: KbApiClient;
  projects: FileListItem[];
  isLoading: boolean;
  error: string | null;
  onSelectProject: (project: FileListItem) => void;
  onReload: () => void;
}

export function ProjectsHub({ client, projects, isLoading, error, onSelectProject, onReload }: ProjectsHubProps) {
  const handleReload = useCallback(() => onReload(), [onReload]);
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [projects]);

  const sorted = [...projects].sort((a, b) => {
    if (!a.updateTime && !b.updateTime) return 0;
    if (!a.updateTime) return 1;
    if (!b.updateTime) return -1;
    return b.updateTime - a.updateTime;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto" style={{ padding: '32px 40px 64px' }}>
        <div style={{ marginBottom: 24 }}>
          <div className="animate-pulse" style={{ height: 32, width: 160, background: '#ECECE6', borderRadius: 6, marginBottom: 8 }} />
          <div className="animate-pulse" style={{ height: 16, width: 80, background: '#ECECE6', borderRadius: 4 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(196px, 1fr))', gap: 20 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse" style={{ height: 256, borderRadius: 12, background: '#ECECE6' }} />
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
          <p style={{ color: '#DC2626', fontWeight: 500, marginBottom: 8 }}>无法加载项目列表</p>
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

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: '32px 40px 64px' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'Georgia, "Noto Serif SC", serif', fontSize: 28, fontWeight: 600, color: '#1A1A1A', letterSpacing: '0.3px' }}>
            我的书架
          </h2>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>共 {projects.length} 个项目</p>
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
          <p>该目录下没有项目</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(196px, 1fr))', gap: 20 }}>
            {paged.map((project) => (
              <ProjectCard
                key={String(project.id)}
                project={project}
                client={client}
                onClick={() => onSelectProject(project)}
              />
            ))}
          </div>

          {totalPages > 1 && (
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
          )}
        </>
      )}
    </div>
  );
}
