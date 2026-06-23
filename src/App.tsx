/**
 * 主应用组件
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Settings, ChevronDown } from 'lucide-react';
import { ConfigModal } from './components/ConfigModal';
import { ProjectsHub } from './components/ProjectsHub';
import { ProjectDetail } from './components/ProjectDetail';
import { useApiClient, useProject, useProjectsHub } from './lib/hooks';
import { saveConfig, getConfig } from './lib/config';
import type { SpaceEntry } from './lib/config';
import type { FileListItem } from './lib/types';

type View = 'hub' | 'project';

function App() {
  const { client, isLoading: clientLoading, error: clientError, initClient, loadSavedClient } = useApiClient();
  const { projectId, isLoading: projectLoading, loadPersonalProjectId, setProjectId } = useProject(client);

  // 客户端切换（AppKey 变更）时重置 projectId，避免用旧 projectId 查新 Key 的数据
  useEffect(() => {
    setProjectId(null);
  }, [client, setProjectId]);

  // 空间列表 & 激活项
  const [spaces, setSpaces] = useState<SpaceEntry[]>(() => getConfig().spaces);
  const [activeSpaceId, setActiveSpaceId] = useState<string>(() => getConfig().activeSpaceId);
  const [showSpaceSwitcher, setShowSpaceSwitcher] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  const activeSpace = useMemo(
    () => spaces.find((s) => s.id === activeSpaceId) ?? spaces[0],
    [spaces, activeSpaceId],
  );

  const { projects, isLoading: hubLoading, error: hubError, load: loadProjects } =
    useProjectsHub(client, projectId, activeSpace?.spaceId ?? '', activeSpace?.path ?? '');

  const [view, setView] = useState<View>('hub');
  const [selectedProject, setSelectedProject] = useState<FileListItem | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // 初始化：尝试加载已保存配置
  useEffect(() => {
    const hasConfig = loadSavedClient();
    if (!hasConfig) setIsConfigModalOpen(true);
  }, [loadSavedClient]);

  // 客户端就绪后获取个人空间 ID（个人空间时需要）
  useEffect(() => {
    if (client && !projectId) loadPersonalProjectId();
  }, [client, projectId, loadPersonalProjectId]);

  // 条件满足时加载项目列表
  useEffect(() => {
    if (!client) return;
    const needsPersonalId = !activeSpace?.spaceId;
    if (needsPersonalId && !projectId) return;
    loadProjects();
  }, [client, projectId, loadProjects, activeSpace?.spaceId]);

  // 点击外部关闭空间切换下拉
  useEffect(() => {
    if (!showSpaceSwitcher) return;
    const handler = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setShowSpaceSwitcher(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSpaceSwitcher]);

  // 切换空间
  const switchSpace = useCallback((space: SpaceEntry) => {
    setActiveSpaceId(space.id);
    saveConfig({ activeSpaceId: space.id });
    setShowSpaceSwitcher(false);
    setView('hub');
    setSelectedProject(null);
  }, []);

  // 配置保存回调
  const handleConfigSave = useCallback(async (appKey: string, serverUrl: string) => {
    const success = initClient(appKey, serverUrl);
    if (!success) throw new Error('Failed to initialize API client');
    // ConfigModal 已将 spaces/previewMode 写入 localStorage，此处同步到 state
    const newConfig = getConfig();
    setSpaces(newConfig.spaces);
    setActiveSpaceId(newConfig.activeSpaceId);
    setView('hub');
    setSelectedProject(null);
  }, [initClient]);

  const handleSelectProject = useCallback((project: FileListItem) => {
    setSelectedProject(project);
    setView('project');
  }, []);

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
        style={{ background: 'rgba(250,250,247,0.92)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', position: 'relative', zIndex: 40 }}
      >
        {/* 品牌 + 空间切换 */}
        <div className="flex items-center gap-4 min-w-0">
          <div
            className="flex items-center gap-2.5 flex-shrink-0 cursor-pointer"
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

          {/* 空间切换下拉（仅 hub 视图显示） */}
          {view === 'hub' && spaces.length > 0 && (
            <div className="relative" ref={switcherRef}>
              <button
                onClick={() => setShowSpaceSwitcher((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#ECECE6] transition-colors"
                style={{ fontSize: 13, color: '#4B5563', border: '1px solid #E8E8E5', background: '#FFFFFF' }}
              >
                <span style={{ color: '#1A1A1A', fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeSpace?.name ?? '选择空间'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
              </button>

              {showSpaceSwitcher && (
                <div
                  className="absolute top-full left-0 mt-1.5 bg-white rounded-xl shadow-lg border border-[#ECECE6] min-w-48 z-50 py-1 overflow-hidden"
                  style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
                >
                  {spaces.map((space) => (
                    <button
                      key={space.id}
                      onClick={() => switchSpace(space)}
                      className="w-full text-left px-4 py-2.5 transition-colors hover:bg-[#F5F3EE]"
                      style={{ background: space.id === activeSpaceId ? '#F5F3EE' : undefined }}
                    >
                      <div style={{ fontSize: 13, fontWeight: space.id === activeSpaceId ? 600 : 400, color: '#1A1A1A' }}>
                        {space.name}
                        {space.id === activeSpaceId && <span style={{ fontSize: 11, color: '#2563EB', marginLeft: 6 }}>●</span>}
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                        {space.spaceId ? `ID: ${space.spaceId}` : '个人空间'}
                        {' / '}
                        {space.path || '根目录'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setIsConfigModalOpen(true)}
          className="flex items-center justify-center hover:bg-[#F0EFEA] hover:text-[#1A1A1A] transition-colors flex-shrink-0"
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
        ) : !client || (!projectId && !activeSpace?.spaceId) ? (
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
            projectId={projectId ?? activeSpace?.spaceId ?? ''}
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

      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={handleConfigSave}
      />
    </div>
  );
}

export default App;
