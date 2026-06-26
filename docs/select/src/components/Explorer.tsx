import React from 'react';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FileText,
  ArrowLeft,
  RotateCw,
  MoreVertical,
  ExternalLink,
  Link,
  Share2
} from 'lucide-react';
import { Project, FolderItem, FileItem } from '../data';

interface ExplorerProps {
  project: Project;
  onBackToBookshelf: () => void;
  onActionToast: (message: string) => void;
  onViewFile: (file: FileItem) => void;
}

// Helper to format folder name by removing numeric prefixes with dash (e.g. "01-discovery" -> "discovery")
const formatFolderName = (name: string): string => {
  return name.replace(/^\d+-/, '');
};

export default function Explorer({
  project,
  onBackToBookshelf,
  onActionToast,
  onViewFile,
}: ExplorerProps) {
  // We want to default to the "CMS组织架构" folder if it exists in references/cms_org
  // to perfectly match Screenshot 3 on load!
  const findFolderByName = (
    folder: FolderItem,
    targetName: string
  ): FolderItem | null => {
    if (folder.name === targetName) return folder;
    for (const child of folder.children) {
      if (child.type === 'folder') {
        const found = findFolderByName(child, targetName);
        if (found) return found;
      }
    }
    return null;
  };

  const initialSelectedFolder = React.useMemo(() => {
    if (project.rootFolder) {
      const cmsOrgFolder = findFolderByName(project.rootFolder, 'CMS组织架构');
      if (cmsOrgFolder) return cmsOrgFolder;
      return project.rootFolder;
    }
    return null;
  }, [project]);

  const [selectedFolder, setSelectedFolder] = React.useState<FolderItem | null>(
    initialSelectedFolder
  );

  // Helper to recursively collect all folder IDs and return an object with all set to true
  const getInitialExpandedFolders = (proj: Project): Record<string, boolean> => {
    const ids: Record<string, boolean> = {};
    const collectIds = (folder: FolderItem) => {
      ids[folder.id] = true;
      folder.children?.forEach((child) => {
        if (child.type === 'folder') {
          collectIds(child);
        }
      });
    };
    if (proj.rootFolder) {
      collectIds(proj.rootFolder);
    }
    return ids;
  };

  // Maintain expanded folders - pre-expand all folders inside the project by default
  const [expandedFolders, setExpandedFolders] = React.useState<Record<string, boolean>>(() =>
    getInitialExpandedFolders(project)
  );

  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);
  const [activeSidebarMenuId, setActiveSidebarMenuId] = React.useState<string | null>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      onActionToast('当前文件夹已刷新！');
    }, 600);
  };

  const toggleFolderExpand = (folderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleFolderSelect = (folder: FolderItem) => {
    setSelectedFolder(folder);
    // Auto-expand when selecting
    setExpandedFolders((prev) => ({
      ...prev,
      [folder.id]: true,
    }));
  };

  const handleShareFolder = (folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    navigator.clipboard.writeText(`${window.location.origin}/share/folder/${folderName}`);
    onActionToast(`文件夹 [${folderName}] 分享链接已复制到剪贴板！`);
  };

  const handleShareFile = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    navigator.clipboard.writeText(`${window.location.origin}/share/file/${fileName}`);
    onActionToast(`文件 [${fileName}] 分享链接已复制到剪贴板！`);
  };

  const handleCopyFileLink = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    navigator.clipboard.writeText(`${window.location.origin}/file-link/${fileName}`);
    onActionToast(`已复制文件链接: /file-link/${fileName}`);
  };

  const handleOpenFileInNewTab = (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    onViewFile(file);
    onActionToast(`正在打开 [${file.name}] 的内容预览`);
  };

  // Build breadcrumb path
  const buildBreadcrumbs = (): { name: string; folder: FolderItem }[] => {
    if (!project.rootFolder) return [];
    if (!selectedFolder) return [{ name: project.name, folder: project.rootFolder }];
    if (selectedFolder.id === 'root') return [{ name: project.name, folder: project.rootFolder }];

    // Helper to find path to selected folder
    const findPath = (
      current: FolderItem,
      targetId: string,
      currentPath: { name: string; folder: FolderItem }[]
    ): { name: string; folder: FolderItem }[] | null => {
      const updatedPath = [...currentPath, { name: current.name, folder: current }];
      if (current.id === targetId) {
        return updatedPath;
      }
      for (const child of current.children) {
        if (child.type === 'folder') {
          const result = findPath(child, targetId, updatedPath);
          if (result) return result;
        }
      }
      return null;
    };

    const path = findPath(project.rootFolder, selectedFolder.id, []);
    if (path) {
      // The root element's name should be represented as project.name
      if (path.length > 0) {
        path[0].name = project.name;
      }
      return path;
    }
    return [
      { name: project.name, folder: project.rootFolder },
      { name: selectedFolder.name, folder: selectedFolder }
    ];
  };

  const breadcrumbs = buildBreadcrumbs();

  // Recursive Tree Node Renderer
  const renderSidebarTree = (folder: FolderItem, depth = 0) => {
    const isExpanded = !!expandedFolders[folder.id];
    const isSelected = selectedFolder?.id === folder.id;
    const hasSubfolders = folder.children.some((c) => c.type === 'folder');

    return (
      <div key={folder.id} className="w-full">
        <div
          onClick={() => handleFolderSelect(folder)}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          className={`group flex items-center justify-between h-8 pr-2 rounded-md cursor-pointer transition-colors text-[13px] ${
            isSelected
              ? 'bg-gray-200/70 text-gray-900 font-medium'
              : 'text-gray-600 hover:bg-gray-100/60 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center space-x-1.5 min-w-0">
            {/* Toggle expand chevron */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolderExpand(folder.id, e);
              }}
              className="p-0.5 text-gray-400 hover:text-gray-600 rounded-sm hover:bg-gray-200/50 transition-colors"
            >
              {hasSubfolders ? (
                isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )
              ) : (
                <span className="w-3.5" />
              )}
            </button>

            {/* Folder icon with orange style */}
            <Folder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-600 fill-amber-500/10' : 'text-amber-500/80'}`} />
            
            {/* Folder name */}
            <span className="truncate select-none">{formatFolderName(folder.name)}</span>
          </div>

          {/* Three-dots menu for sidebar folder - always visible */}
          <div className="relative shrink-0 flex items-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveSidebarMenuId(activeSidebarMenuId === folder.id ? null : folder.id);
              }}
              className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded-md transition-colors shrink-0"
              title="更多操作"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {activeSidebarMenuId === folder.id && (
              <>
                <div
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSidebarMenuId(null);
                  }}
                />
                <div className="absolute right-0 top-7 w-28 bg-white rounded-xl shadow-xl p-1 z-50 origin-top-right animate-in fade-in slide-in-from-top-1 duration-100 text-left font-normal">
                  <button
                    onClick={(e) => {
                      handleShareFolder(folder.name, e);
                      setActiveSidebarMenuId(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-blue-50/80 hover:text-blue-600 rounded-lg transition-colors flex items-center space-x-2 group/btn"
                  >
                    <Share2 className="w-3.5 h-3.5 text-gray-400 group-hover/btn:text-blue-500 transition-colors shrink-0" />
                    <span>分享</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Render child folders */}
        {isExpanded && hasSubfolders && (
          <div className="mt-0.5 space-y-0.5">
            {folder.children
              .filter((c): c is FolderItem => c.type === 'folder')
              .map((subFolder) => renderSidebarTree(subFolder, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Get active folders & files inside selectedFolder
  const gridFolders = selectedFolder
    ? (selectedFolder.children.filter((c) => c.type === 'folder') as FolderItem[])
    : [];
  const gridFiles = selectedFolder
    ? (selectedFolder.children.filter((c) => c.type === 'file') as FileItem[])
    : [];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-white select-none">
      {/* 1. Left Sidebar Tree */}
      <aside className="w-72 border-r border-gray-200/80 bg-[#f8f9fa] flex flex-col h-full shrink-0">
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-gray-100">
          <button
            onClick={onBackToBookshelf}
            className="flex items-center space-x-1.5 text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors focus:outline-hidden"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回书架</span>
          </button>
          <button
            onClick={handleRefresh}
            className={`p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all focus:outline-hidden ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            title="刷新左侧目录"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Project Bold Label */}
        <div className="px-5 pt-4 pb-2">
          <h2 className="text-lg font-semibold text-gray-800 tracking-tight font-sans">
            {project.name}
          </h2>
        </div>

        {/* Tree Container */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {project.rootFolder && renderSidebarTree(project.rootFolder)}
        </div>
      </aside>

      {/* 2. Right Explorer Main Grid Area */}
      <main className="flex-1 flex flex-col h-full bg-[#fafbfc]">
        {/* Explorer Content Header */}
        <div className="h-12 border-b border-gray-200/60 bg-white px-6 flex items-center justify-between shrink-0">
          {/* Breadcrumbs */}
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            {breadcrumbs.map((b, idx) => {
              const displayName = idx === 0 ? b.name : formatFolderName(b.name);
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-gray-300 font-light px-1">/</span>}
                  <button
                    onClick={() => {
                      if (b.folder) handleFolderSelect(b.folder);
                    }}
                    disabled={isLast}
                    className={`text-left transition-colors focus:outline-hidden ${
                      isLast
                        ? 'text-gray-900 font-semibold font-sans cursor-default'
                        : 'text-gray-400 hover:text-blue-600 font-normal hover:underline cursor-pointer'
                    }`}
                  >
                    {displayName}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Refresh Action */}
          <button
            onClick={handleRefresh}
            className={`p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-all focus:outline-hidden ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            title="刷新当前文件夹"
          >
            <RotateCw className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Grid Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* If folder is empty */}
          {gridFolders.length === 0 && gridFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-100 rounded-2xl bg-white p-8">
              <Folder className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-400 text-sm font-light">该文件夹为空</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Folders Section */}
              {gridFolders.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {gridFolders.map((folder) => {
                    const isMenuOpen = activeMenuId === folder.id;
                    return (
                      <div
                        key={folder.id}
                        onClick={() => handleFolderSelect(folder)}
                        className="group relative flex flex-col justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md hover:border-gray-200/80 transition-all duration-200 cursor-pointer h-28"
                      >
                        {/* Folder Top Row */}
                        <div className="flex items-start justify-between">
                          <div className="p-1.5 rounded-lg bg-amber-50">
                            <Folder className="w-6 h-6 text-amber-500 fill-amber-500/10 shrink-0" />
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(isMenuOpen ? null : folder.id);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Folder Name & Info */}
                        <div className="mt-2 min-w-0">
                          <p className="text-sm font-normal text-gray-800 truncate" title={folder.name}>
                            {formatFolderName(folder.name)}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5 font-light">
                            {folder.date}
                          </p>
                        </div>

                        {/* Floating share dropdown overlay for folder */}
                        {isMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-40 cursor-default"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(null);
                              }}
                            />
                            <div className="absolute right-3 top-10 w-28 bg-white rounded-xl shadow-xl p-1 z-50 origin-top-right animate-in fade-in slide-in-from-top-1 duration-100 text-left font-normal">
                              <button
                                onClick={(e) => {
                                  handleShareFolder(folder.name, e);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-blue-50/80 hover:text-blue-600 rounded-lg transition-colors flex items-center space-x-2 group/btn"
                              >
                                <Share2 className="w-3.5 h-3.5 text-gray-400 group-hover/btn:text-blue-500 transition-colors shrink-0" />
                                <span>分享</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Files Section */}
              {gridFiles.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">
                    文档列表
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {gridFiles.map((file) => {
                      const isMenuOpen = activeMenuId === file.id;
                      return (
                        <div
                          key={file.id}
                          onClick={() => onViewFile(file)}
                          className="group relative flex flex-col justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md hover:border-gray-200/80 transition-all duration-200 cursor-pointer h-28"
                        >
                          {/* File Top Row */}
                          <div className="flex items-start justify-between">
                            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-500">
                              <FileText className="w-6 h-6 shrink-0" />
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(isMenuOpen ? null : file.id);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>

                          {/* File Name & Info */}
                          <div className="mt-2 min-w-0">
                            <p className="text-sm font-normal text-gray-800 truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5 font-mono font-light truncate">
                              大小: {file.size} • {file.date}
                            </p>
                          </div>

                          {/* Floating dropdown overlay for file */}
                          {isMenuOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-40 cursor-default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                }}
                              />
                              <div className="absolute right-3 top-10 w-36 bg-white rounded-xl shadow-xl p-1 z-50 origin-top-right animate-in fade-in slide-in-from-top-1 duration-100 text-left font-normal">
                                <button
                                  onClick={(e) => handleOpenFileInNewTab(file, e)}
                                  className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-blue-50/80 hover:text-blue-600 rounded-lg transition-colors flex items-center space-x-2 group/btn"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover/btn:text-blue-500 transition-colors shrink-0" />
                                  <span>在新标签页打开</span>
                                </button>
                                <button
                                  onClick={(e) => handleCopyFileLink(file.name, e)}
                                  className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-blue-50/80 hover:text-blue-600 rounded-lg transition-colors flex items-center space-x-2 group/btn"
                                >
                                  <Link className="w-3.5 h-3.5 text-gray-400 group-hover/btn:text-blue-500 transition-colors shrink-0" />
                                  <span>复制文件链接</span>
                                </button>
                                <button
                                  onClick={(e) => handleShareFile(file.name, e)}
                                  className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-blue-50/80 hover:text-blue-600 rounded-lg transition-colors flex items-center space-x-2 group/btn"
                                >
                                  <Share2 className="w-3.5 h-3.5 text-gray-400 group-hover/btn:text-blue-500 transition-colors shrink-0" />
                                  <span>分享</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
