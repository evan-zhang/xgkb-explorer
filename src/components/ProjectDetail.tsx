import { useState, useCallback, Fragment } from 'react';
import { ChevronLeft, RefreshCw } from 'lucide-react';
import { FileTree } from './FileTree';
import { FileExplorer } from './FileExplorer';
import type { KbApiClient } from '../lib/api';
import type { FileListItem } from '../lib/types';
import { openFileInNewTab } from '../lib/preview';

interface ProjectDetailProps {
  client: KbApiClient;
  projectId?: string;
  project: FileListItem;
  onBack: () => void;
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

export function ProjectDetail({ client, projectId, project, onBack }: ProjectDetailProps) {
  const rootId = String(project.id);
  const isProjectRoot = project.entryKind === 'project';
  const effectiveProjectId = isProjectRoot ? rootId : projectId;

  const [currentFolderId, setCurrentFolderId] = useState(rootId);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([
    { id: rootId, name: project.name },
  ]);
  const [treeRefreshKey, setTreeRefreshKey] = useState(0);
  const [explorerRefreshKey, setExplorerRefreshKey] = useState(0);

  const openFile = useCallback((file: FileListItem) => {
    void openFileInNewTab(client, file);
  }, [client]);

  const handleFolderNavigate = useCallback((folder: FileListItem) => {
    setCurrentFolderId(String(folder.id));
    setBreadcrumb((prev) => [...prev, { id: String(folder.id), name: folder.name }]);
  }, []);

  const handleTreeFolderSelect = useCallback((folder: FileListItem) => {
    setCurrentFolderId(String(folder.id));
    setBreadcrumb([
      { id: rootId, name: project.name },
      { id: String(folder.id), name: folder.name },
    ]);
  }, [rootId, project.name]);

  const navigateToCrumb = useCallback((index: number) => {
    const crumb = breadcrumb[index];
    setCurrentFolderId(crumb.id);
    setBreadcrumb((prev) => prev.slice(0, index + 1));
  }, [breadcrumb]);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* 左侧：仅显示文件夹的目录树 */}
      <aside
        className="w-[280px] border-r flex flex-col flex-shrink-0 overflow-hidden"
        style={{ background: '#F5F3EE', borderColor: '#ECECE6' }}
      >
        <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid #ECECE6' }}>
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 hover:text-[#2563EB] transition-colors"
              style={{ fontSize: 13, color: '#6B7280', paddingBottom: 12 }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              返回列表
            </button>
            <button
              onClick={() => setTreeRefreshKey(k => k + 1)}
              className="p-1.5 rounded-md hover:bg-[#EDEBE4] transition-colors"
              style={{ color: '#6B7280' }}
              title="刷新目录树"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div style={{ fontFamily: 'Georgia, "Noto Serif SC", serif', fontSize: 18, fontWeight: 600, lineHeight: 1.3, color: '#1A1A1A' }}>
            {project.name}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <FileTree
            client={client}
            projectId={effectiveProjectId}
            rootFileId={isProjectRoot ? undefined : rootId}
            onFileSelect={openFile}
            onFolderSelect={handleTreeFolderSelect}
            foldersOnly
            refreshKey={treeRefreshKey}
          />
        </div>
      </aside>

      {/* 右侧：文件/夹卡片网格 */}
      <section className="flex-1 overflow-hidden flex flex-col min-w-0">
        {/* 面包屑 */}
        <div
          className="flex items-center gap-1.5 px-8 py-3 border-b flex-shrink-0 min-w-0 bg-white"
          style={{ borderColor: '#ECECE6' }}
        >
          <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto flex-1">
            {breadcrumb.map((crumb, i) => (
              <Fragment key={crumb.id}>
                {i > 0 && <span className="flex-shrink-0" style={{ color: '#C0C0B8', fontSize: 12 }}>/</span>}
                <button
                  onClick={() => navigateToCrumb(i)}
                  className={`whitespace-nowrap transition-colors flex-shrink-0 rounded px-1 py-0.5 ${
                    i === breadcrumb.length - 1
                      ? 'font-medium cursor-default'
                      : 'hover:bg-[#F0EFEA]'
                  }`}
                  style={{
                    fontSize: 13,
                    color: i === breadcrumb.length - 1 ? '#1A1A1A' : '#6B7280',
                  }}
                >
                  {crumb.name}
                </button>
              </Fragment>
            ))}
          </div>
          <button
            onClick={() => setExplorerRefreshKey(k => k + 1)}
            className="p-1.5 rounded-md hover:bg-[#F0EFEA] transition-colors flex-shrink-0"
            style={{ color: '#6B7280' }}
            title="刷新列表"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* 文件/夹卡片网格 */}
        <div className="flex-1 overflow-y-auto bg-[#FAFAF7]">
          <FileExplorer
            client={client}
            folderId={currentFolderId}
            projectId={effectiveProjectId}
            isProjectRoot={isProjectRoot && currentFolderId === rootId}
            onFileSelect={openFile}
            onFolderNavigate={handleFolderNavigate}
            refreshKey={explorerRefreshKey}
          />
        </div>
      </section>
    </div>
  );
}
