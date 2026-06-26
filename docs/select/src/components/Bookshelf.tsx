import React from 'react';
import { RotateCw, MoreHorizontal, Star, Search, FileText, ChevronRight } from 'lucide-react';
import { Project, FileItem, FolderItem } from '../data';

interface BookshelfProps {
  projects: Project[];
  onProjectSelect: (project: Project) => void;
  onToggleStar: (projectId: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onActionToast: (message: string) => void;
  onViewFile: (file: FileItem) => void;
  searchQuery: string;
  onRenameProject: (projectId: string, newName: string) => void;
}

export default function Bookshelf({
  projects,
  onProjectSelect,
  onToggleStar,
  onRefresh,
  isRefreshing,
  onActionToast,
  onViewFile,
  searchQuery,
  onRenameProject,
}: BookshelfProps) {
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);
  const [renamingProject, setRenamingProject] = React.useState<Project | null>(null);
  const [newName, setNewName] = React.useState('');

  const handleStartRename = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setRenamingProject(project);
    const initialName = project.name.replace(/^\[目录\]\s*/, '');
    setNewName(initialName);
  };

  const handleConfirmRename = () => {
    if (!newName.trim()) {
      onActionToast('名称不能为空');
      return;
    }
    if (renamingProject) {
      onRenameProject(renamingProject.id, newName.trim());
      onActionToast(`目录已成功重命名为 [${newName.trim()}]`);
      setRenamingProject(null);
    }
  };

  // Divide filtered projects into Starred and Others
  const starredProjects = projects.filter((p) => p.starred);
  const otherProjects = projects.filter((p) => !p.starred);

  // Helper to recursively collect files for global cross-space search
  const collectFilesFromFolder = (
    folder: FolderItem,
    project: Project,
    currentPath: string[] = []
  ): { file: FileItem; project: Project; pathStr: string }[] => {
    let results: { file: FileItem; project: Project; pathStr: string }[] = [];
    if (!folder.children) return results;

    folder.children.forEach((child) => {
      if (child.type === 'file') {
        results.push({
          file: child,
          project,
          pathStr: [...currentPath, folder.name].join(' / '),
        });
      } else if (child.type === 'folder') {
        results.push(...collectFilesFromFolder(child, project, [...currentPath, folder.name]));
      }
    });
    return results;
  };

  // Perform Global Multi-Space search on files and folder names
  const globalSearchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase().trim();
    const matches: {
      type: 'file' | 'folder';
      name: string;
      project: Project;
      pathStr: string;
      fileRef?: FileItem;
      folderRef?: FolderItem;
    }[] = [];

    projects.forEach((proj) => {
      if (!proj.rootFolder) return;

      // 1. Collect all files and search in name and content
      const allFiles = collectFilesFromFolder(proj.rootFolder, proj);
      allFiles.forEach(({ file, pathStr }) => {
        const nameMatch = file.name.toLowerCase().includes(query);
        const contentMatch = file.content?.toLowerCase().includes(query);
        if (nameMatch || contentMatch) {
          matches.push({
            type: 'file',
            name: file.name,
            project: proj,
            pathStr,
            fileRef: file,
          });
        }
      });

      // 2. Recursively search folder names
      const searchFolders = (folder: FolderItem, path: string[]) => {
        if (folder.name.toLowerCase().includes(query) && folder.id !== 'root') {
          matches.push({
            type: 'folder',
            name: folder.name,
            project: proj,
            pathStr: path.join(' / '),
            folderRef: folder,
          });
        }
        folder.children?.forEach((child) => {
          if (child.type === 'folder') {
            searchFolders(child, [...path, folder.name]);
          }
        });
      };
      searchFolders(proj.rootFolder, []);
    });

    return matches;
  }, [projects, searchQuery]);

  const handleShare = (projectCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    navigator.clipboard.writeText(`${window.location.origin}/project/${projectCode}`);
    onActionToast(`已成功复制项目 [${projectCode}] 的分享链接到剪贴板！`);
  };

  const handleToggleStarClick = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleStar(projectId);
  };

  const handleSearchResultClick = (match: typeof globalSearchResults[0]) => {
    if (match.type === 'file' && match.fileRef) {
      onViewFile(match.fileRef);
      onActionToast(`正在直接预览跨空间搜索结果: ${match.name}`);
    } else {
      onProjectSelect(match.project);
      onActionToast(`正在进入目录所在空间: [${match.project.name}]`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 select-none font-sans">
      {/* Bookshelf Title and Meta */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-normal text-gray-900 tracking-tight font-serif">我的书架</h1>
          <p className="text-sm text-gray-400 mt-1.5 font-light">
            共 {projects.length} 个项目
          </p>
        </div>
        <button
          onClick={onRefresh}
          className={`p-2.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-all focus:outline-hidden ${
            isRefreshing ? 'animate-spin' : ''
          }`}
          title="刷新列表"
        >
          <RotateCw className="w-5 h-5" />
        </button>
      </div>

      {searchQuery.trim() !== '' ? (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 font-sans">
              全局搜索结果 <span className="text-sm font-normal text-gray-400 ml-2">找到 {globalSearchResults.length} 个匹配项</span>
            </h2>
          </div>

          {globalSearchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-gray-100 rounded-2xl shadow-xs">
              <Search className="w-10 h-10 text-gray-200 mb-2" />
              <p className="text-gray-400 text-sm font-light">未找到匹配的文件或目录</p>
              <p className="text-gray-300 text-xs font-light mt-1">请尝试更换关键字重新搜索</p>
            </div>
          ) : (
            <div className="space-y-3">
              {globalSearchResults.map((match, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSearchResultClick(match)}
                  className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md hover:border-gray-200/80 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${match.type === 'file' ? 'bg-blue-50' : 'bg-amber-50'}`}>
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                          {match.name}
                        </span>
                        <span className="text-[10px] text-gray-400 font-light font-mono bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">
                          {match.type === 'file' ? '文件' : '目录'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-gray-400 font-light mt-1">
                        <span className="font-semibold text-gray-600 max-w-[120px] truncate">
                          [{match.project.name}]
                        </span>
                        <span>/</span>
                        <span className="truncate">{match.pathStr}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-all pr-2 font-light">
                      {match.type === 'file' ? '点击立即阅读' : '点击定位到该空间'}
                    </span>
                    <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 1. Starred Section */}
          <div className="mb-10">
            <div className="flex items-center space-x-2 mb-6">
              <h2 className="text-lg font-medium text-gray-900 font-sans">特别关注</h2>
              <span className="flex items-center justify-center px-2 py-0.5 text-xs text-gray-500 bg-gray-100 rounded-full font-medium min-w-[20px] text-center">
                {starredProjects.length}
              </span>
            </div>

            {starredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 bg-gray-50/50 border border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-400 text-sm font-light">暂无特别关注项目。如果您想让特定的目录置顶显示在最上方，请点击卡片右上角的星标（⭐）。</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {starredProjects.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    activeMenuId={activeMenuId}
                    setActiveMenuId={setActiveMenuId}
                    onSelect={() => onProjectSelect(p)}
                    onToggleStar={(e) => handleToggleStarClick(p.id, e)}
                    onShare={(e) => handleShare(p.code, e)}
                    onRename={(proj, e) => handleStartRename(proj, e)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 2. Other Projects Section */}
          <div className="mb-10">
            <div className="flex items-center space-x-2 mb-6">
              <h2 className="text-lg font-medium text-gray-900 font-sans">其他项目</h2>
              <span className="flex items-center justify-center px-2 py-0.5 text-xs text-gray-500 bg-gray-100 rounded-full font-medium min-w-[20px] text-center">
                {otherProjects.length}
              </span>
            </div>

            {otherProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 bg-gray-50/50 border border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-400 text-sm font-light">无其他项目</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {otherProjects.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    activeMenuId={activeMenuId}
                    setActiveMenuId={setActiveMenuId}
                    onSelect={() => onProjectSelect(p)}
                    onToggleStar={(e) => handleToggleStarClick(p.id, e)}
                    onShare={(e) => handleShare(p.code, e)}
                    onRename={(proj, e) => handleStartRename(proj, e)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Rename Folder Dialog Modal */}
      {renamingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-150 shadow-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-medium text-gray-900 mb-2 font-sans">重命名特别关注目录</h3>
            <p className="text-xs text-gray-400 mb-4 font-light">请输入新的目录名称：</p>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="目录名称"
              className="w-full px-3 py-2 text-xs border border-gray-250 focus:border-blue-500 focus:outline-hidden rounded-lg mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirmRename();
                }
              }}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setRenamingProject(null)}
                className="px-3.5 py-1.5 text-xs text-gray-500 hover:bg-gray-50 border border-gray-150 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleConfirmRename}
                className="px-3.5 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Internal ProjectCard Sub-Component */
interface CardProps {
  key?: string;
  project: Project;
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
  onSelect: () => void;
  onToggleStar: (e: React.MouseEvent) => void;
  onShare: (e: React.MouseEvent) => void;
  onRename: (project: Project, e: React.MouseEvent) => void;
}

function ProjectCard({
  project,
  activeMenuId,
  setActiveMenuId,
  onSelect,
  onToggleStar,
  onShare,
  onRename,
}: CardProps) {
  const isMenuOpen = activeMenuId === project.id;

  const headerBgClass = project.color === 'charcoal' ? 'bg-[#2d3139]' : 'bg-[#1d4272]';

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMenuOpen) {
      setActiveMenuId(null);
    } else {
      setActiveMenuId(project.id);
    }
  };

  return (
    <div
      onClick={onSelect}
      className="group relative flex flex-col bg-white rounded-xl border border-gray-100 shadow-xs hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer overflow-hidden h-[330px]"
    >
      {/* Header Block */}
      <div className={`relative flex flex-col justify-center items-center h-[140px] text-white p-4 transition-all duration-200 ${headerBgClass}`}>
        {/* Large initial letter */}
        <span className="text-[44px] font-normal font-serif leading-none opacity-90 select-none">
          {project.letter}
        </span>
        
        {/* Project code */}
        <span className="text-xs font-normal tracking-wide text-gray-200 mt-2 text-center select-all">
          {project.code}
        </span>

        {/* Action Controls in Header */}
        <div className="absolute top-3 right-3 flex items-center space-x-1.5 z-10">
          {/* Three-dot menu */}
          <button
            onClick={toggleMenu}
            className="p-1 text-white/70 hover:text-white rounded hover:bg-white/10 transition-colors focus:outline-hidden"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Favorite Star */}
          <button
            onClick={onToggleStar}
            className="p-1 rounded text-white/70 hover:text-white hover:bg-white/10 transition-all focus:outline-hidden"
          >
            <Star className={`w-4 h-4 ${project.starred ? 'text-amber-400 fill-amber-400' : ''}`} />
          </button>
        </div>

        {/* Floating Dropdown Overlay */}
        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-20 cursor-default"
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuId(null);
              }}
            />
            <div className="absolute top-9 right-3 bg-white border border-gray-100 rounded-lg shadow-lg z-30 py-1 w-28 origin-top-right">
              <button
                onClick={onShare}
                className="w-full text-left px-4 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                分享项目
              </button>
              {project.id.startsWith('imp-folder-') && (
                <button
                  onClick={(e) => onRename(project, e)}
                  className="w-full text-left px-4 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                >
                  重命名目录
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Content Block */}
      <div className="flex-1 p-5 overflow-hidden">
        {/* Project summary description with standard custom citation blockquote */}
        <p className="text-xs text-gray-500 font-normal leading-relaxed line-clamp-6 text-justify">
          {project.summary}
        </p>
      </div>
    </div>
  );
}
