/**
 * 项目看板：展示 projectsPath 目录下的所有项目文件夹（卡片网格）
 */

import { useCallback, useState, useEffect } from 'react';
import { Folder, RefreshCw, AlertCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import type { KbApiClient } from '../lib/api';
import type { FileListItem } from '../lib/types';
import { useReadmePreview } from '../lib/hooks';

const PAGE_SIZE = 12;

interface ProjectCardProps {
  project: FileListItem;
  client: KbApiClient;
  onClick: () => void;
}

function ProjectCard({ project, client, onClick }: ProjectCardProps) {
  const { preview, isLoading: previewLoading } = useReadmePreview(client, String(project.id));

  const updateDate = project.updateTime
    ? new Date(project.updateTime).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    : null;

  return (
    <div
      onClick={onClick}
      className="group bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all duration-150"
    >
      <div className="flex items-start gap-3 mb-3">
        <Folder className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 leading-tight line-clamp-2">
          {project.name}
        </h3>
      </div>

      <div className="min-h-[3.5rem] mb-3">
        {previewLoading ? (
          <div className="space-y-1.5">
            <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-4/5" />
          </div>
        ) : preview ? (
          <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">{preview}</p>
        ) : (
          <p className="text-sm text-gray-300 italic">暂无简介</p>
        )}
      </div>

      {updateDate && (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          <span>{updateDate}</span>
        </div>
      )}
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
      <div className="flex-1 p-8">
        <div className="mb-6">
          <div className="h-7 w-32 bg-gray-100 rounded animate-pulse mb-1" />
          <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="h-5 bg-gray-100 rounded animate-pulse mb-3 w-3/4" />
              <div className="space-y-1.5 mb-3">
                <div className="h-3 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-4/5" />
              </div>
              <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-red-500 px-8 max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-70" />
          <p className="font-medium mb-2">无法加载项目列表</p>
          <p className="text-sm opacity-80 mb-4">{error}</p>
          <button
            onClick={handleReload}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-sm mx-auto transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">我的项目</h2>
          <p className="text-sm text-gray-400 mt-0.5">共 {projects.length} 个</p>
        </div>
        <button
          onClick={handleReload}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          title="刷新"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center text-gray-400 py-16">
          <Folder className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>该目录下没有项目</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
                上一页
              </button>
              <span className="text-sm text-gray-400">第 {page} / {totalPages} 页</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                下一页
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
