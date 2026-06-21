/**
 * 主应用组件
 */

import { useState, useEffect, useCallback } from 'react';
import { Settings, BookOpen } from 'lucide-react';
import { ConfigModal } from './components/ConfigModal';
import { ProjectsHub } from './components/ProjectsHub';
import { ProjectDetail } from './components/ProjectDetail';
import { StandaloneFileView } from './components/StandaloneFileView';
import { useApiClient, useProject, useProjectsHub } from './lib/hooks';
import { saveConfig, getConfig } from './lib/config';
import type { FileListItem } from './lib/types';

type View = 'hub' | 'project';

// 顶层路由：独立文件查看 vs 主应用（分开以遵守 Rules of Hooks）
function App() {
  const urlParams = new URLSearchParams(location.search);
  const standaloneFileId = urlParams.get('fileId');
  const standaloneFileName = urlParams.get('fileName') || '';
  if (standaloneFileId) {
    return <StandaloneFileView fileId={standaloneFileId} fileName={standaloneFileName} />;
  }
  return <MainApp />;
}

function MainApp() {
  // API 客户端
  const { client, isLoading: clientLoading, error: clientError, initClient, loadSavedClient } = useApiClient();

  // 项目 ID（个人知识库空间 ID）
  const { projectId, isLoading: projectLoading, loadPersonalProjectId } = useProject(client);

  // 读取已保存的 projectsPath
  const [projectsPath, setProjectsPath] = useState<string>(() => getConfig().projectsPath || 'Obsidian/projects');

  // Projects Hub 数据
  const { projects, isLoading: hubLoading, error: hubError, load: loadProjects } =
    useProjectsHub(client, projectId, projectsPath);

  // 视图状态
  const [view, setView] = useState<View>('hub');
  const [selectedProject, setSelectedProject] = useState<FileListItem | null>(null);

  // 配置弹窗
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // 初始化：尝试加载保存的配置
  useEffect(() => {
    const hasConfig = loadSavedClient();
    if (!hasConfig) {
      setIsConfigModalOpen(true);
    }
  }, [loadSavedClient]);

  // 配置成功后加载个人空间 ID
  useEffect(() => {
    if (client && !projectId) {
      loadPersonalProjectId();
    }
  }, [client, projectId, loadPersonalProjectId]);

  // 有了 projectId 后加载项目列表
  useEffect(() => {
    if (client && projectId) {
      loadProjects();
    }
  }, [client, projectId, loadProjects]);

  // 配置保存
  const handleConfigSave = useCallback(async (appKey: string, serverUrl: string, newProjectsPath: string) => {
    const success = initClient(appKey, serverUrl);
    if (!success) throw new Error('Failed to initialize API client');
    saveConfig({ projectsPath: newProjectsPath });
    setProjectsPath(newProjectsPath);
    // 返回 hub 并重新加载
    setView('hub');
    setSelectedProject(null);
  }, [initClient]);

  // 选中项目
  const handleSelectProject = useCallback((project: FileListItem) => {
    setSelectedProject(project);
    setView('project');
  }, []);

  // 返回看板
  const handleBack = useCallback(() => {
    setSelectedProject(null);
    setView('hub');
  }, []);

  const isConnecting = clientLoading || projectLoading;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white">
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => view === 'project' && handleBack()}
        >
          <BookOpen className="w-5 h-5 text-blue-500" />
          <h1 className="text-base font-semibold text-gray-800">玄关知识库浏览器</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* 设置按钮 */}
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title="设置"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 flex overflow-hidden">
        {isConnecting ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400 mx-auto mb-3" />
              <p className="text-sm">连接知识库...</p>
            </div>
          </div>
        ) : !client || !projectId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500 px-8">
              <p className="text-sm mb-2">无法连接到知识库</p>
              <p className="text-xs text-gray-400">{clientError}</p>
              <button
                onClick={() => setIsConfigModalOpen(true)}
                className="mt-4 px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                打开设置
              </button>
            </div>
          </div>
        ) : view === 'project' && selectedProject ? (
          <ProjectDetail
            client={client}
            projectId={projectId}
            project={selectedProject}
            onBack={handleBack}
          />
        ) : (
          <ProjectsHub
            client={client}
            projects={projects}
            isLoading={hubLoading}
            error={hubError}
            onSelectProject={handleSelectProject}
            onReload={loadProjects}
          />
        )}
      </main>

      {/* 配置模态框 */}
      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={handleConfigSave}
      />
    </div>
  );
}

export default App; // App is the router wrapper
