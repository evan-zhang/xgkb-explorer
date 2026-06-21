import { useState, useCallback, Fragment } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [modalContent, setModalContent] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const openFile = useCallback(async (file: FileListItem) => {
    setModalFile(file);
    setModalContent(null);
    setModalError(null);
    setModalLoading(false);

    const suffix = file.name.split('.').pop()?.toLowerCase() || '';
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(suffix);
    if (!isImage) {
      setModalLoading(true);
      const result = await client.getFullFileContent(String(file.id));
      if (result.ok) setModalContent(result.value);
      else setModalError(result.error);
      setModalLoading(false);
    }
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
      <aside className="w-52 border-r border-gray-200 flex flex-col flex-shrink-0 overflow-hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-500
            hover:text-gray-800 hover:bg-gray-50 border-b border-gray-200 transition-colors flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
          我的项目
        </button>

        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
            {project.name}
          </p>
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

      {/* 右侧：文件/夹卡片网格（始终可见） */}
      <section className="flex-1 overflow-hidden flex flex-col min-w-0">
        {/* 面包屑 */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-200 bg-gray-50 flex-shrink-0 min-w-0 overflow-x-auto">
          {breadcrumb.map((crumb, i) => (
            <Fragment key={crumb.id}>
              {i > 0 && <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />}
              <button
                onClick={() => navigateToCrumb(i)}
                className={`text-sm whitespace-nowrap transition-colors flex-shrink-0 ${
                  i === breadcrumb.length - 1
                    ? 'text-gray-800 font-medium cursor-default'
                    : 'text-gray-500 hover:text-blue-600'
                }`}
              >
                {crumb.name}
              </button>
            </Fragment>
          ))}
        </div>

        {/* 文件/夹卡片网格 */}
        <div className="flex-1 overflow-y-auto">
          <FileExplorer
            client={client}
            folderId={currentFolderId}
            onFileSelect={openFile}
            onFolderNavigate={handleFolderNavigate}
          />
        </div>
      </section>

      {/* 文件内容图层（全屏 modal） */}
      {modalFile && (
        <FileViewerModal
          client={client}
          file={modalFile}
          content={modalContent}
          isLoading={modalLoading}
          error={modalError}
          onClose={() => setModalFile(null)}
        />
      )}
    </div>
  );
}
