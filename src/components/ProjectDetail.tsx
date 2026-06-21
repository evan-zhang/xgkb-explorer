import { useState, useCallback, Fragment } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { FileTree } from './FileTree';
import { FileExplorer } from './FileExplorer';
import { FilePreview } from './FilePreview';
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

type RightMode = 'explorer' | 'file';

export function ProjectDetail({ client, projectId, project, onBack }: ProjectDetailProps) {
  const rootId = String(project.id);

  const [rightMode, setRightMode] = useState<RightMode>('explorer');
  const [currentFolderId, setCurrentFolderId] = useState(rootId);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([
    { id: rootId, name: project.name },
  ]);

  const [selectedFile, setSelectedFile] = useState<FileListItem | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const loadFile = useCallback(async (file: FileListItem) => {
    setSelectedFile(file);
    setRightMode('file');
    setFileContent(null);
    setFileError(null);

    const suffix = file.name.split('.').pop()?.toLowerCase() || '';
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(suffix);
    if (!isImage) {
      setFileLoading(true);
      const result = await client.getFullFileContent(String(file.id));
      if (result.ok) setFileContent(result.value);
      else setFileError(result.error);
      setFileLoading(false);
    }
  }, [client]);

  // Called when left tree file is clicked
  const handleTreeFileSelect = useCallback((file: FileListItem) => {
    loadFile(file);
  }, [loadFile]);

  // Called when left tree folder is clicked
  const handleTreeFolderSelect = useCallback((folder: FileListItem) => {
    setCurrentFolderId(String(folder.id));
    setRightMode('explorer');
    setBreadcrumb([
      { id: rootId, name: project.name },
      { id: String(folder.id), name: folder.name },
    ]);
  }, [rootId, project.name]);

  // Called when a folder card in the right panel is clicked
  const handleFolderNavigate = useCallback((folder: FileListItem) => {
    setCurrentFolderId(String(folder.id));
    setBreadcrumb((prev) => [...prev, { id: String(folder.id), name: folder.name }]);
    setRightMode('explorer');
  }, []);

  // Navigate to a breadcrumb level
  const navigateToCrumb = useCallback((index: number) => {
    const crumb = breadcrumb[index];
    setCurrentFolderId(crumb.id);
    setBreadcrumb((prev) => prev.slice(0, index + 1));
    setRightMode('explorer');
  }, [breadcrumb]);

  const handleOpenNewTab = useCallback(() => {
    if (!selectedFile) return;
    const params = new URLSearchParams({
      fileId: String(selectedFile.id),
      fileName: selectedFile.name,
    });
    window.open(`${location.pathname}?${params}`, '_blank');
  }, [selectedFile]);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* 左侧：目录树 */}
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
            onFileSelect={handleTreeFileSelect}
            onFolderSelect={handleTreeFolderSelect}
          />
        </div>
      </aside>

      {/* 右侧：资源浏览器 */}
      <section className="flex-1 overflow-hidden flex flex-col min-w-0">
        {rightMode === 'explorer' ? (
          <>
            {/* 面包屑导航 */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-200 bg-gray-50 flex-shrink-0 min-w-0">
              {breadcrumb.map((crumb, i) => (
                <Fragment key={crumb.id}>
                  {i > 0 && <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />}
                  <button
                    onClick={() => navigateToCrumb(i)}
                    className={`text-sm truncate max-w-[160px] transition-colors flex-shrink-0 ${
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

            {/* 文件卡片网格 */}
            <div className="flex-1 overflow-y-auto">
              <FileExplorer
                client={client}
                folderId={currentFolderId}
                onFileSelect={loadFile}
                onFolderNavigate={handleFolderNavigate}
              />
            </div>
          </>
        ) : (
          <>
            {/* 文件内容工具栏 */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50 flex-shrink-0 min-w-0">
              <button
                onClick={() => setRightMode('explorer')}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors flex-shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
                返回
              </button>
              <span className="text-sm text-gray-600 truncate mx-3 flex-1 text-center">
                {selectedFile?.name}
              </span>
              <button
                onClick={handleOpenNewTab}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-md
                  transition-colors flex-shrink-0"
                title="在新标签页全屏打开"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            {/* 文件内容预览（全高，可滚动） */}
            <div className="flex-1 overflow-hidden">
              <FilePreview
                content={fileContent}
                fileName={selectedFile?.name}
                filePath={undefined}
                isLoading={fileLoading}
                error={fileError}
                client={client}
                fileId={selectedFile ? String(selectedFile.id) : undefined}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
