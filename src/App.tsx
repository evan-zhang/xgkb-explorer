/**
 * 主应用组件
 */

import { useState, useEffect, useCallback } from 'react';
import { Settings } from 'lucide-react';
import { ConfigModal } from './components/ConfigModal';
import { ProjectsHub } from './components/ProjectsHub';
import { ProjectDetail } from './components/ProjectDetail';
import { useApiClient, useProject, useProjectsHub } from './lib/hooks';
import { saveConfig, getConfig } from './lib/config';
import type { FileListItem } from './lib/types';

type View = 'hub' | 'project';

function App() {
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
    <div className="h-screen flex flex-col bg-[#FAFAF7]">
      {/* 顶部导航栏 */}
      <header
        className="flex items-center justify-between px-10 py-5 border-b border-[#ECECE6] flex-shrink-0"
        style={{ background: 'rgba(250,250,247,0.92)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      >
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => view === 'project' && handleBack()}
        >
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg, #1A1A1A 0%, #3A3A3A 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#F5E6D3', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 16,
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.15)',
          }}>玄</div>
          <span style={{ fontFamily: 'Georgia, "Noto Serif SC", serif', fontSize: 20, fontWeight: 600, letterSpacing: '0.5px', color: '#1A1A1A', whiteSpace: 'nowrap' }}>
            玄关知识库 <span style={{ color: '#6B7280', fontWeight: 400, fontSize: 16 }}>/ Explorer</span>
          </span>
        </div>

        <button
          onClick={() => setIsConfigModalOpen(true)}
          className="flex items-center justify-center hover:bg-[#F0EFEA] hover:text-[#1A1A1A] transition-colors"
          style={{ width: 38, height: 38, borderRadius: 10, color: '#4B5563' }}
          title="设置"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 flex overflow-hidden">
        {isConnecting ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center" style={{ color: '#6B7280' }}>
              <div className="animate-spin rounded-full h-10 w-10 mx-auto mb-3" style={{ borderWidth: 2, borderStyle: 'solid', borderColor: '#ECECE6', borderTopColor: '#2563EB' }} />
              <p className="text-sm">连接知识库...</p>
            </div>
          </div>
        ) : !client || !projectId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-8" style={{ color: '#6B7280' }}>
              <p className="text-sm mb-2" style={{ color: '#4B5563' }}>无法连接到知识库</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>{clientError}</p>
              <button
                onClick={() => setIsConfigModalOpen(true)}
                className="mt-4 px-4 py-2 text-sm text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ background: '#1A1A1A' }}
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

export default App;
