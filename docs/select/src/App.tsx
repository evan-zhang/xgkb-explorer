import React from 'react';
import Header from './components/Header';
import Bookshelf from './components/Bookshelf';
import Explorer from './components/Explorer';
import MarkdownViewer from './components/MarkdownViewer';
import SettingsModal from './components/SettingsModal';
import { mockProjects, Project, FileItem } from './data';

export default function App() {
  // Global States
  const [projects, setProjects] = React.useState<Project[]>(mockProjects);
  const [currentFilter, setCurrentFilter] = React.useState<string>('TPR'); // Default "TPR项目" as shown in Screenshot 1
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
  const [viewingFile, setViewingFile] = React.useState<FileItem | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Toast State
  const [toast, setToast] = React.useState<{ message: string; show: boolean }>({
    message: '',
    show: false,
  });

  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 2500);
  };

  // Filter projects based on type
  const filteredProjects = React.useMemo(() => {
    if (currentFilter === 'ALL') {
      return projects;
    }
    return projects.filter((p) => p.type === currentFilter);
  }, [projects, currentFilter]);

  // Handle actions
  const handleToggleStar = (projectId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const nextState = !p.starred;
          showToast(nextState ? `项目 [${p.code}] 已设为特别关注` : `项目 [${p.code}] 已取消特别关注`);
          return { ...p, starred: nextState };
        }
        return p;
      })
    );
  };

  const handleRenameProject = (projectId: string, newName: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const cleanName = newName.replace(/^\[目录\]\s*/, '').trim();
          return {
            ...p,
            name: `[目录] ${cleanName}`,
            letter: cleanName.charAt(0).toUpperCase() || p.letter,
            summary: `此空间是通过项目空间目录导入的特定子文件夹目录: [${cleanName}]。`,
            rootFolder: p.rootFolder ? { ...p.rootFolder, name: cleanName } : p.rootFolder,
          };
        }
        return p;
      })
    );
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('书架项目更新成功！');
    }, 800);
  };

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
  };

  const handleLogoutClick = () => {
    showToast('正在安全登出系统...');
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] text-gray-800 flex flex-col relative font-sans antialiased">
      {/* 1. Global Header */}
      <Header
        currentFilter={currentFilter}
        onFilterChange={setCurrentFilter}
        onSettingsClick={handleSettingsClick}
        onLogoutClick={handleLogoutClick}
        searchQuery={searchQuery}
        onSearchQueryChange={(query) => {
          setSearchQuery(query);
          if (query) {
            // Auto return to bookshelf to view global search results
            setSelectedProject(null);
          }
        }}
        showSearch={selectedProject !== null}
      />

      {/* 2. Main Viewport */}
      <div className="flex-1">
        {selectedProject ? (
          /* Detailed Project Explorer View */
          <Explorer
            project={selectedProject}
            onBackToBookshelf={() => setSelectedProject(null)}
            onActionToast={showToast}
            onViewFile={setViewingFile}
          />
        ) : (
          /* Bookshelf Catalog View */
          <Bookshelf
            projects={filteredProjects}
            onProjectSelect={setSelectedProject}
            onToggleStar={handleToggleStar}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            onActionToast={showToast}
            onViewFile={setViewingFile}
            searchQuery={searchQuery}
            onRenameProject={handleRenameProject}
          />
        )}
      </div>

      {/* 3. Sliding Markdown Reader Sidebar Panel */}
      {viewingFile && (
        <MarkdownViewer
          file={viewingFile}
          onClose={() => setViewingFile(null)}
          onActionToast={showToast}
        />
      )}

      {/* 4. Settings & Connection Modal */}
      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          currentProjects={projects}
          onImportProject={(newProj) => {
            setProjects((prev) => [...prev, newProj]);
          }}
          onRemoveProject={(projId) => {
            setProjects((prev) => prev.filter((p) => p.id !== projId));
          }}
          onActionToast={showToast}
        />
      )}

      {/* 5. Elegant Action Feedback Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/95 text-white text-xs px-5 py-3 rounded-xl shadow-xl z-100 flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <span className="font-normal select-none">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

