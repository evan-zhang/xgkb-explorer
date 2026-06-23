import { useState, useCallback, Fragment } from 'react';
import { ChevronLeft } from 'lucide-react';
import { FileTree } from './FileTree';
import { FileExplorer } from './FileExplorer';
import { FileViewerModal } from './FileViewerModal';
import type { KbApiClient } from '../lib/api';
import type { FileListItem } from '../lib/types';

interface ProjectDetailProps {
  client: KbApiClient;
  projectId: string;
  project: FileListItem;
  onBack: () => void;
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

export function ProjectDetail({ client, projectId, project, onBack }: ProjectDetailProps) {
  const rootId = String(project.id);

  const [currentFolderId, setCurrentFolderId] = useState(rootId);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([
    { id: rootId, name: project.name },
  ]);
  const [modalFile, setModalFile] = useState<FileListItem | null>(null);

  const openFile = useCallback((file: FileListItem) => {
    setModalFile(file);
  }, []);

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
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 hover:text-[#2563EB] transition-colors"
            style={{ fontSize: 13, color: '#6B7280', paddingBottom: 12 }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            返回书架
          </button>
          <div style={{ fontFamily: 'Georgia, "Noto Serif SC", serif', fontSize: 18, fontWeight: 600, lineHeight: 1.3, color: '#1A1A1A' }}>
            {project.name}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <FileTree
            client={client}
            projectId={projectId}
            rootFileId={rootId}
            onFileSelect={openFile}
            onFolderSelect={handleTreeFolderSelect}
            foldersOnly
          />
        </div>
      </aside>

      {/* 右侧：文件/夹卡片网格 */}
      <section className="flex-1 overflow-hidden flex flex-col min-w-0">
        {/* 面包屑 */}
        <div
          className="flex items-center gap-1.5 px-8 py-3 border-b flex-shrink-0 min-w-0 overflow-x-auto bg-white"
          style={{ borderColor: '#ECECE6' }}
        >
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

        {/* 文件/夹卡片网格 */}
        <div className="flex-1 overflow-y-auto bg-[#FAFAF7]">
          <FileExplorer
            client={client}
            folderId={currentFolderId}
            projectId={projectId}
            onFileSelect={openFile}
            onFolderNavigate={handleFolderNavigate}
          />
        </div>
      </section>

      {/* 文件预览图层 */}
      {modalFile && (
        <FileViewerModal
          client={client}
          file={modalFile}
          onClose={() => setModalFile(null)}
        />
      )}
    </div>
  );
}
