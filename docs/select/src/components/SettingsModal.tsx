import React from 'react';
import { X, Folder, FileText, Check, ChevronRight, ChevronDown, ArrowLeft, Bookmark, MoreVertical, Wind, Layers } from 'lucide-react';
import { Project, FolderItem } from '../data';

interface SettingsModalProps {
  onClose: () => void;
  currentProjects: Project[];
  onImportProject: (project: Project) => void;
  onRemoveProject: (projectId: string) => void;
  onActionToast: (message: string) => void;
}

// Structured catalog of workspaces representing OpenAPI `/document-database/project/list`
const systemWorkspaces = [
  {
    id: 'space-1',
    code: 'CRM-2026',
    name: '客户关系系统重构项目',
    letter: '客',
    type: 'TPR' as const,
    starred: false,
    color: 'blue',
    summary: '此项目是CMS系统与前端CRM工具的互通性改造。包含核心客户管辖权规则迁移、商机智能分配引擎等。',
    filesCount: 8,
    rootFolder: {
      id: 'crm-root',
      name: '客户关系系统重构项目',
      type: 'folder' as const,
      date: '12/05/26',
      children: [
        {
          id: 'crm-folder-1',
          name: '01-核心需求规范',
          type: 'folder' as const,
          date: '12/05/26',
          children: [
            {
              id: 'crm-folder-1-1',
              name: 'CRM管辖权判定',
              type: 'folder' as const,
              date: '12/05/26',
              children: [
                {
                  id: 'crm-file-1-1-1',
                  name: 'CRM管辖权及分配规则设计.md',
                  type: 'file' as const,
                  size: '34 KB',
                  date: '12/05/26',
                  content: '# CRM管辖权及分配规则设计\n\n## 一、核心业务原则\n- 客户数据全生命周期追踪\n- 智能派单分配策略：根据销售能力及区域属性多维度加权判定'
                },
                {
                  id: 'crm-file-1-1-2',
                  name: '销售区域归属细则.md',
                  type: 'file' as const,
                  size: '15 KB',
                  date: '12/05/26',
                  content: '# 销售区域归属细则\n\n详细说明全国销售分公司在各省区的客户归属原则。'
                }
              ]
            },
            {
              id: 'crm-folder-1-2',
              name: '业务流转时序',
              type: 'folder' as const,
              date: '13/05/26',
              children: [
                {
                  id: 'crm-file-1-2-1',
                  name: '业务时序流转与鉴权规范.md',
                  type: 'file' as const,
                  size: '18 KB',
                  date: '13/05/26',
                  content: '# 业务时序流转与鉴权规范\n\n主要用于各系统微服务之间的时序图与授权规则说明。'
                }
              ]
            }
          ]
        },
        {
          id: 'crm-folder-2',
          name: '02-产品交互方案',
          type: 'folder' as const,
          date: '14/05/26',
          children: [
            {
              id: 'crm-file-2-1',
              name: 'PC端原型设计说明.md',
              type: 'file' as const,
              size: '22 KB',
              date: '14/05/26',
              content: '# PC端原型设计说明\n\n包括商机跟进、客户看板、销售漏斗组件交互规范。'
            }
          ]
        }
      ]
    }
  },
  {
    id: 'space-2',
    code: 'FIN-2026',
    name: '2026年第二季度财经分析',
    letter: '财',
    type: 'FINA' as const,
    starred: false,
    color: 'charcoal',
    summary: '针对集团第二季度各项子项目的预算消耗情况、跨境费用流转合规性、以及各业务板块销售回款率进行的专项审计。',
    filesCount: 6,
    rootFolder: {
      id: 'fin-root',
      name: '2026年第二季度财经分析',
      type: 'folder' as const,
      date: '02/06/26',
      children: [
        {
          id: 'fin-folder-1',
          name: '01-财经运行分析',
          type: 'folder' as const,
          date: '02/06/26',
          children: [
            {
              id: 'fin-folder-1-1',
              name: '审计工作底稿',
              type: 'folder' as const,
              date: '02/06/26',
              children: [
                {
                  id: 'fin-file-1-1-1',
                  name: 'Q2财经运行分析与风险管控.md',
                  type: 'file' as const,
                  size: '42 KB',
                  date: '02/06/26',
                  content: '# Q2财经运行分析与风险管控\n\n## 一、主要指标概要\n- Q2 集团总预算执行率: 87.2%\n- 跨境流转违规率: 0%\n- 坏账及存货周转风险评级: 极低'
                }
              ]
            }
          ]
        },
        {
          id: 'fin-folder-2',
          name: '02-收支结算数据',
          type: 'folder' as const,
          date: '03/06/26',
          children: [
            {
              id: 'fin-folder-2-1',
              name: '5月份数据汇总',
              type: 'folder' as const,
              date: '03/06/26',
              children: [
                {
                  id: 'fin-file-2-1-1',
                  name: '5月份收支结算表.md',
                  type: 'file' as const,
                  size: '12 KB',
                  date: '03/06/26',
                  content: '# 5月份收支结算表\n\n主要包含各子项目的详细报销比例和资金流出分析。'
                }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    id: 'space-3',
    code: 'HR-2026',
    name: '集团薪资绩效制度体系设计',
    letter: '绩',
    type: 'TPR' as const,
    starred: false,
    color: 'blue',
    summary: '关于下一代考核体系、奖金系数计算、以及360度多维评估手段在战略规划部、生产与质量中心的实战应用。',
    filesCount: 5,
    rootFolder: {
      id: 'hr-root',
      name: '集团薪资绩效制度体系设计',
      type: 'folder' as const,
      date: '15/06/26',
      children: [
        {
          id: 'hr-folder-1',
          name: '01-绩效算法模型',
          type: 'folder' as const,
          date: '15/06/26',
          children: [
            {
              id: 'hr-folder-1-1',
              name: '绩效系数白皮书',
              type: 'folder' as const,
              date: '15/06/26',
              children: [
                {
                  id: 'hr-file-1-1-1',
                  name: '绩效奖金算力模型白皮书.md',
                  type: 'file' as const,
                  size: '28 KB',
                  date: '15/06/26',
                  content: '# 绩效奖金算力模型白皮书\n\n## 一、算力模型核心算法\n- 绩效系数 = 0.4 * 个人产出 + 0.3 * 协作力 + 0.3 * 合规分\n- 最终奖金 = 基数 * 绩效系数'
                }
              ]
            }
          ]
        }
      ]
    }
  }
];

// Helper to format folder name by removing numeric prefixes with dash (e.g. "01-discovery" -> "discovery")
const formatFolderName = (name: string): string => {
  return name.replace(/^\d+-/, '');
};

export default function SettingsModal({
  onClose,
  currentProjects,
  onImportProject,
  onRemoveProject,
  onActionToast,
}: SettingsModalProps) {
  // Navigation: 'SPACES' | 'FOLDER' | 'FILE'
  const [currentView, setCurrentView] = React.useState<'SPACES' | 'FOLDER' | 'FILE'>('SPACES');
  
  // Selections
  const [selectedSpace, setSelectedSpace] = React.useState<typeof systemWorkspaces[0] | null>(null);
  const [selectedFolder, setSelectedFolder] = React.useState<FolderItem | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<any | null>(null);

  // For renaming folder during collection
  const [importingFolder, setImportingFolder] = React.useState<FolderItem | null>(null);
  const [importCustomName, setImportCustomName] = React.useState('');

  // Active Dropdown Action Menu for three-dots
  const [activeActionMenuId, setActiveActionMenuId] = React.useState<string | null>(null);

  // Expanded folders in the directory tree sidebar
  const [expandedFolders, setExpandedFolders] = React.useState<Record<string, boolean>>({
    'crm-root': true,
    'fin-root': true,
    'hr-root': true,
  });

  // Helper to compute path breadcrumbs from rootFolder to selectedFolder
  const getBreadcrumbs = (): FolderItem[] => {
    if (!selectedSpace || !selectedFolder) return [];
    
    const path: FolderItem[] = [];
    
    const findPath = (current: FolderItem): boolean => {
      path.push(current);
      if (current.id === selectedFolder.id) {
        return true;
      }
      if (current.children) {
        for (const child of current.children) {
          if (child.type === 'folder') {
            if (findPath(child as FolderItem)) {
              return true;
            }
          }
        }
      }
      path.pop();
      return false;
    };
    
    findPath(selectedSpace.rootFolder as FolderItem);
    return path;
  };

  const handleSelectSpace = (space: typeof systemWorkspaces[0]) => {
    setSelectedSpace(space);
    setSelectedFolder(space.rootFolder as FolderItem);
    setCurrentView('FOLDER');
  };

  const toggleFolderExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  // Action: Import a specific directory into the Bookshelf
  const handleImportFolder = (folder: FolderItem) => {
    if (!selectedSpace) return;
    
    const folderId = `imp-folder-${selectedSpace.id}-${folder.name}`;
    const isAlreadyImported = currentProjects.some((cp) => cp.id === folderId);

    if (isAlreadyImported) {
      onRemoveProject(folderId);
      onActionToast(`已取消收藏目录: ${folder.name}`);
      return;
    }

    // Instead of importing immediately, prompt for custom name
    setImportingFolder(folder);
    setImportCustomName(folder.name);
  };

  const handleConfirmImport = () => {
    if (!selectedSpace || !importingFolder) return;

    const cleanCustomName = importCustomName.trim();
    if (!cleanCustomName) {
      onActionToast('名称不能为空');
      return;
    }

    const folderId = `imp-folder-${selectedSpace.id}-${importingFolder.name}`;
    const folderProjectCode = `IMP-${selectedSpace.code}`;
    const newProject: Project = {
      id: folderId,
      code: folderProjectCode,
      name: `[目录] ${cleanCustomName}`,
      letter: selectedSpace.letter,
      type: selectedSpace.type,
      starred: false,
      color: selectedSpace.color,
      summary: `此空间是通过项目空间目录导入的特定子文件夹目录: [${cleanCustomName}]。`,
      filesCount: importingFolder.children?.length || 0,
      rootFolder: {
        id: `imported-root-${Date.now()}`,
        name: cleanCustomName,
        type: 'folder',
        date: importingFolder.date,
        children: [importingFolder as FolderItem],
      }
    };

    onImportProject(newProject);
    onActionToast(`已成功收藏目录 [${cleanCustomName}] 至您的书架！`);
    setImportingFolder(null);
  };

  // Recursive tree renderer (Sidebar)
  const renderDirectoryTree = (folder: FolderItem, depth = 0) => {
    const isExpanded = !!expandedFolders[folder.id];
    const isSelected = selectedFolder?.id === folder.id;
    const hasSubfolders = folder.children.some((c) => c.type === 'folder');
    const isImported = currentProjects.some((cp) => cp.id === `imp-folder-${selectedSpace?.id}-${folder.name}`);

    return (
      <div key={folder.id} className="w-full">
        <div
          onClick={() => setSelectedFolder(folder)}
          style={{ paddingLeft: `${depth * 8 + 4}px` }}
          className={`group flex items-center justify-between py-1.5 pr-2 rounded-lg cursor-pointer transition-all text-xs ${
            isSelected
              ? 'bg-gray-100 text-gray-900 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center space-x-1.5 min-w-0 flex-1">
            <button
              onClick={(e) => toggleFolderExpand(folder.id, e)}
              className="p-0.5 text-gray-400 hover:text-gray-600 rounded-sm hover:bg-gray-200/50 shrink-0"
            >
              {hasSubfolders ? (
                isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )
              ) : (
                <span className="w-3" />
              )}
            </button>

            <Folder className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-500 fill-amber-500/10' : 'text-amber-400/80'}`} />
            <span className="truncate select-none">{formatFolderName(folder.name)}</span>
          </div>

          {/* Three-dots Menu for the directory tree folder node */}
          {(
            <div className="relative shrink-0 flex items-center" onClick={(e) => e.stopPropagation()}>
              {isImported && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 shrink-0 animate-pulse" title="已收藏" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveActionMenuId(activeActionMenuId === `tree-menu-${folder.id}` ? null : `tree-menu-${folder.id}`);
                }}
                className={`p-0.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded-md transition-all shrink-0 opacity-100 ${
                  activeActionMenuId === `tree-menu-${folder.id}`
                    ? 'bg-gray-200/50'
                    : ''
                }`}
                title="更多操作"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {activeActionMenuId === `tree-menu-${folder.id}` && (
                <>
                  <div
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveActionMenuId(null);
                    }}
                  />
                  <div className="absolute right-0 top-6 w-36 bg-white border border-gray-150 rounded-xl shadow-lg py-1 z-50 origin-top-right animate-in fade-in slide-in-from-top-1 duration-100 text-left font-normal">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImportFolder(folder);
                        setActiveActionMenuId(null);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      {isImported ? (
                        <>
                          <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span>取消收藏此目录</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>收藏此目录</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {isExpanded && hasSubfolders && (
          <div className="mt-0.5 space-y-0.5">
            {folder.children
              .filter((c): c is FolderItem => c.type === 'folder')
              .map((subFolder) => renderDirectoryTree(subFolder, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center select-none font-sans bg-black/40 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose} />

      {/* Pop Card */}
      <div className="relative bg-white border border-gray-100 rounded-xl shadow-xl w-full max-w-4xl h-[520px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header - Styled with extreme precision matching the system's design language */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70 shrink-0">
          <div className="flex items-center space-x-3">
            {currentView !== 'SPACES' && (
              <button
                onClick={() => {
                  if (currentView === 'FILE') {
                    setCurrentView('FOLDER');
                  } else {
                    setCurrentView('SPACES');
                  }
                }}
                className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-200/60 rounded-lg transition-all"
                title="返回"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="text-sm font-semibold text-gray-900 tracking-tight flex items-center space-x-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-md bg-[#242526] text-white text-[10px] font-medium font-serif">
                  玄
                </span>
                <span>
                  {currentView === 'SPACES' && '空间列表'}
                  {currentView === 'FOLDER' && selectedSpace?.name}
                  {currentView === 'FILE' && selectedFile?.name}
                </span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Display Views */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* ==================== 1. SPACES VIEW (空间列表 - Minimal Elegant List) ==================== */}
          {currentView === 'SPACES' && (
            <div className="flex-1 p-8 overflow-y-auto bg-gray-50/30 flex flex-col justify-start w-full">
              <div className="mb-6 shrink-0 text-left flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-blue-600 font-bold tracking-widest uppercase block mb-1">
                    系统内置工作空间
                  </span>
                  <p className="text-xs text-gray-400 font-normal">
                    选择对应的工作空间，即可深度浏览其结构并收藏特定目录到您的主书架
                  </p>
                </div>
                <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-blue-50/50 rounded-lg border border-blue-100/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[10px] text-blue-700 font-medium font-mono">共 {systemWorkspaces.length} 个空间</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200/60 rounded-xl shadow-xs divide-y divide-gray-100 overflow-hidden">
                {systemWorkspaces.map((space) => {
                  const workspaceMeta: Record<string, { creator: string; createTime: string }> = {
                    'space-1': { creator: '林东平', createTime: '2026-05-12' },
                    'space-2': { creator: '财务管理处', createTime: '2026-06-02' },
                    'space-3': { creator: '人力资源中心', createTime: '2026-06-15' },
                  };
                  const meta = workspaceMeta[space.id] || { creator: '系统管理员', createTime: '2026-06-25' };

                  // Find how many folders are imported from this space
                  const importedCount = currentProjects.filter(
                    (cp) => cp.id.startsWith(`imp-folder-${space.id}-`)
                  ).length;

                  return (
                    <div
                      key={space.id}
                      onClick={() => handleSelectSpace(space)}
                      className="group flex flex-col md:flex-row items-start md:items-center justify-between p-5 hover:bg-gray-50/50 transition-colors duration-150 cursor-pointer text-left"
                    >
                      {/* Left: Unified Space Icon & Info Block */}
                      <div className="flex items-start space-x-4 flex-1 min-w-0 pr-4">
                        {/* Unified elegant designed Space Icon */}
                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-xs shrink-0 transition-transform group-hover:scale-105 duration-150">
                          <Layers className="w-4.5 h-4.5" />
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors truncate">
                              {space.name}
                            </h3>
                          </div>
                          {/* Only show Creator and Creation Date, removing summary/description below */}
                          <div className="flex items-center space-x-3 mt-1.5 text-[11px] text-gray-400 font-light">
                            <span>创建人: {meta.creator}</span>
                            <span className="text-gray-200 select-none">•</span>
                            <span>创建时间: {meta.createTime}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: navigation action (completely removing '多少个文档往哪个项目' info) */}
                      <div className="mt-4 md:mt-0 flex items-center justify-end shrink-0 md:w-auto border-t md:border-t-0 border-gray-100 pt-3 md:pt-0">
                        <div className="flex items-center space-x-1 text-blue-500 group-hover:text-blue-600 font-medium text-xs transition-colors pl-2">
                          <span>浏览目录</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== 2. FOLDER EXPLORER VIEW (双屏显示空间) ==================== */}
          {currentView === 'FOLDER' && (
            <div className="flex-1 flex overflow-hidden">
              
              {/* Left Column: collapsable Folder Directory Tree (左边是目录) */}
              <div className="w-60 border-r border-gray-100 bg-gray-50/50 p-4 overflow-y-auto space-y-3 shrink-0">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block pl-1.5">
                  树形目录结构
                </span>
                <div className="space-y-1">
                  {selectedSpace && renderDirectoryTree(selectedSpace.rootFolder as FolderItem)}
                </div>
              </div>

              {/* Right Column: details of child directories or files (右边是它的下下层级的文件夹或者文件) */}
              <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between bg-white">
                <div className="space-y-5">
                  
                  {/* Dropdown background click overlay */}
                  {activeActionMenuId && (
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setActiveActionMenuId(null)} 
                    />
                  )}

                  {/* Current Directory Breadcrumbs Path */}
                  <div className="pb-3 border-b border-gray-100">
                    <div className="flex items-center space-x-1.5 text-xs text-gray-500 font-medium overflow-x-auto whitespace-nowrap min-w-0 flex-1 scrollbar-none pr-3">
                      <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      {getBreadcrumbs().map((crumb, idx) => {
                        const isLast = idx === getBreadcrumbs().length - 1;
                        return (
                          <React.Fragment key={crumb.id}>
                            {idx > 0 && <span className="text-gray-300 font-mono text-[10px]">/</span>}
                            <button
                              onClick={() => {
                                setSelectedFolder(crumb);
                                setActiveActionMenuId(null);
                              }}
                              className={`transition-colors hover:text-blue-600 hover:underline shrink-0 ${
                                isLast ? 'text-gray-900 font-bold' : 'text-gray-500'
                              }`}
                            >
                              {formatFolderName(crumb.name)}
                            </button>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* List Subfolders & Subfiles */}
                  <div className="space-y-4">
                    
                    {/* Folders Section with crisp, non-gray active button styles */}
                    {selectedFolder && selectedFolder.children.some(c => c.type === 'folder') && (
                      <div className="space-y-2">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                          子目录文件夹
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {selectedFolder.children
                            .filter(c => c.type === 'folder')
                            .map((folder: any) => {
                              const isImported = currentProjects.some((cp) => cp.id === `imp-folder-${selectedSpace?.id}-${folder.name}`);
                              const isMenuOpen = activeActionMenuId === `folder-${folder.id}`;
                              return (
                                <div
                                  key={folder.id}
                                  onClick={() => {
                                    setSelectedFolder(folder);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="p-3.5 bg-white border border-gray-100 rounded-xl flex items-center justify-between hover:shadow-md hover:border-gray-250 transition-all cursor-pointer group relative"
                                >
                                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                                    <div className="p-2 rounded-lg bg-amber-50 shrink-0">
                                      <Folder className={`w-4 h-4 ${isImported ? 'text-emerald-500 fill-emerald-50' : 'text-amber-500 fill-amber-500/10'}`} />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center space-x-1.5">
                                        <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                                          {formatFolderName(folder.name)}
                                        </p>
                                        {isImported && (
                                          <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 text-[8px] font-medium bg-emerald-50 text-emerald-600 rounded">
                                            已收藏
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[9px] text-gray-400 mt-0.5">{folder.children?.length || 0} 个文档</p>
                                    </div>
                                  </div>

                                  {/* Three-dots Menu for folder item inside grid */}
                                  <div className="relative flex items-center shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveActionMenuId(activeActionMenuId === `folder-${folder.id}` ? null : `folder-${folder.id}`);
                                      }}
                                      className={`p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all shrink-0 opacity-100 ${
                                        isMenuOpen ? 'bg-gray-100' : ''
                                      }`}
                                      title="更多操作"
                                    >
                                      <MoreVertical className="w-3.5 h-3.5" />
                                    </button>

                                    {isMenuOpen && (
                                      <>
                                        <div
                                          className="fixed inset-0 z-40 cursor-default bg-transparent"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveActionMenuId(null);
                                          }}
                                        />
                                        <div className="absolute right-0 top-8 w-36 bg-white border border-gray-150 rounded-xl shadow-lg py-1 z-50 origin-top-right animate-in fade-in slide-in-from-top-1 duration-100 font-normal">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleImportFolder(folder);
                                              setActiveActionMenuId(null);
                                            }}
                                            className="w-full text-left px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                          >
                                            {isImported ? (
                                              <>
                                                <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                                <span>取消收藏目录</span>
                                              </>
                                            ) : (
                                              <>
                                                <Bookmark className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                <span>收藏到书架</span>
                                              </>
                                            )}
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Files Section (previewable documents with distinct premium styling) */}
                    {selectedFolder && selectedFolder.children.some(c => c.type === 'file') && (
                      <div className="space-y-3">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                          文档列表
                        </span>
                        <div className="space-y-2">
                          {selectedFolder.children
                            .filter(c => c.type === 'file')
                            .map((file: any) => (
                              <div
                                key={file.id}
                                onClick={() => {
                                  setSelectedFile(file);
                                  setCurrentView('FILE');
                                }}
                                className="group flex items-center justify-between p-3 bg-gray-50/40 hover:bg-blue-50/30 border border-gray-100 hover:border-blue-200 rounded-xl transition-all duration-200 cursor-pointer text-left"
                              >
                                <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                                  {/* Beautiful distinct file document icon */}
                                  <div className="p-2 bg-blue-50 rounded-lg text-blue-500 group-hover:bg-blue-100/70 transition-colors shrink-0">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <span className="text-xs text-gray-700 group-hover:text-blue-600 font-semibold transition-colors truncate block">
                                      {file.name}
                                    </span>
                                    <div className="flex items-center space-x-2 mt-0.5 text-[9px] text-gray-400 font-mono">
                                      <span>大小: {file.size}</span>
                                      <span>•</span>
                                      <span>更新于 {file.date}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 shrink-0 ml-3">
                                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {selectedFolder && selectedFolder.children.length === 0 && (
                      <div className="text-center py-10">
                        <Folder className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">该目录下暂无任何文件夹或文档</p>
                      </div>
                    )}

                  </div>

                </div>
              </div>

            </div>
          )}

          {/* ==================== 3. FILE DETAIL VIEW (文件页面) ==================== */}
          {currentView === 'FILE' && selectedFile && (
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              <div className="bg-white px-6 py-3.5 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-semibold text-gray-800">{selectedFile.name}</span>
                </div>
                <button
                  onClick={() => setCurrentView('FOLDER')}
                  className="px-3 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  返回文件夹
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 max-w-3xl w-full mx-auto">
                <article className="prose prose-xs prose-slate text-justify">
                  <div className="text-xs text-gray-700 leading-relaxed space-y-4 whitespace-pre-wrap font-sans">
                    {selectedFile.content || '暂无文档正文。'}
                  </div>
                </article>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Rename Folder on Import Overlay Dialog */}
      {importingFolder && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-150 shadow-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in-95 duration-150 text-left">
            <h3 className="text-sm font-semibold text-gray-900 mb-1 font-sans">设置收藏目录名称</h3>
            <p className="text-xs text-gray-400 mb-4 font-light">您可以为收藏到书架上的目录指定一个自定义名称：</p>
            <input
              type="text"
              value={importCustomName}
              onChange={(e) => setImportCustomName(e.target.value)}
              placeholder="自定义目录名称"
              className="w-full px-3 py-2 text-xs border border-gray-250 focus:border-blue-500 focus:outline-hidden rounded-lg mb-4 text-gray-800 bg-white font-medium"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirmImport();
                }
              }}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setImportingFolder(null)}
                className="px-3.5 py-1.5 text-xs text-gray-500 hover:bg-gray-50 border border-gray-150 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmImport}
                className="px-3.5 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
              >
                确认收藏
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
