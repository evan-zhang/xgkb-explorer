/**
 * 主应用组件
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Settings, ChevronDown, LogOut, FolderPlus, BookMarked, Share2 } from 'lucide-react';
import { ConfigModal } from './components/ConfigModal';
import { DirectoryPickerModal, type DirectorySelection } from './components/DirectoryPickerModal';
import { DingTalkLogin } from './components/DingTalkLogin';
import { ProjectsHub } from './components/ProjectsHub';
import { ProjectDetail } from './components/ProjectDetail';
import { SharePage } from './components/SharePage';
import { useApiClient, useProjectsHub } from './lib/hooks';
import { saveConfig, getConfig, getStarredProjectIds, saveStarredProjectIds } from './lib/config';
import { buildDirectoryShareUrl, parseDirectoryShareHash } from './lib/share';
import {
  fetchUserSettings,
  getLocalUserSettings,
  hasLocalSettingsData,
  putUserSettings,
  saveSyncedSettings,
  SettingsConflictError,
  type UserSettingsV1,
} from './lib/settings';
import {
  cleanDingTalkCallbackUrl,
  clearAuthSession,
  exchangeDingTalkCode,
  getAuthSession,
  parseDingTalkCallback,
  saveAuthSession,
  type AuthSession,
  type DingTalkLoginResult,
} from './lib/auth';
import type { SpaceEntry } from './lib/config';
import type { FileListItem } from './lib/types';

type View = 'hub' | 'project';
type HubMode = 'spaces' | 'directories' | 'projects';

function FirstRunOnboarding({
  onChooseDirectory,
  onOpenSettings,
}: {
  onChooseDirectory: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center px-8">
      <div className="w-full max-w-xl text-center">
        <div
          className="mx-auto mb-6 flex items-center justify-center"
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: '#EEF4FF',
            color: '#2563EB',
            border: '1px solid #DCE8FF',
          }}
        >
          <BookMarked className="w-7 h-7" />
        </div>
        <h1 style={{ color: '#1A1A1A', fontSize: 24, fontWeight: 700, letterSpacing: 0 }}>
          创建第一个书架
        </h1>
        <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.7, marginTop: 10 }}>
          选择一个空间目录后，系统会把它作为书架入口。后续进入系统会直接打开已配置的书架。
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onChooseDirectory}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors hover:opacity-90"
            style={{ background: '#1A1A1A', color: '#FFFFFF' }}
          >
            <FolderPlus className="w-4 h-4" />
            选择目录
          </button>
          <button
            onClick={onOpenSettings}
            className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[#F0EFEA]"
            style={{ borderColor: '#E8E8E5', color: '#4B5563', background: '#FFFFFF' }}
          >
            <Settings className="w-4 h-4" />
            打开设置
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const shareParams = useMemo(() => parseDirectoryShareHash(), []);
  const {
    client,
    isLoading: clientLoading,
    error: clientError,
    initOpenApiClient,
    initTokenClient,
    loadSavedClient,
  } = useApiClient();
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => getAuthSession());
  const authSessionRef = useRef<AuthSession | null>(authSession);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [settingsSyncError, setSettingsSyncError] = useState<string | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const settingsRevisionRef = useRef<string | null>(getConfig().settingsRevision ?? null);

  // 空间列表 & 激活项
  const [spaces, setSpaces] = useState<SpaceEntry[]>(() => getConfig().spaces);
  const [activeSpaceId, setActiveSpaceId] = useState<string>(() => getConfig().activeSpaceId);
  const [previewMode, setPreviewMode] = useState<'self' | 'kb'>(() => getConfig().previewMode);
  const [starredProjectIds, setStarredProjectIds] = useState<string[]>(() => getStarredProjectIds());
  const [showSpaceSwitcher, setShowSpaceSwitcher] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  const activeSpace = useMemo(
    () => spaces.find((s) => s.id === activeSpaceId) ?? spaces[0],
    [spaces, activeSpaceId],
  );

  const {
    projects,
    isLoading: hubLoading,
    error: hubError,
    directoryName,
    load: loadProjects,
    loadSpaceProjects,
  } =
    useProjectsHub(client, activeSpace?.directoryId ?? '');

  const [view, setView] = useState<View>('hub');
  const [hubMode, setHubMode] = useState<HubMode>('spaces');
  const [selectedSpace, setSelectedSpace] = useState<FileListItem | null>(null);
  const [selectedProject, setSelectedProject] = useState<FileListItem | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isDirectoryPickerOpen, setIsDirectoryPickerOpen] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    authSessionRef.current = authSession;
  }, [authSession]);

  const applySettingsState = useCallback((settings: UserSettingsV1, revision: string | null) => {
    const normalized = saveSyncedSettings(settings, revision);
    settingsRevisionRef.current = revision;
    setSpaces(normalized.spaces);
    setActiveSpaceId(normalized.activeSpaceId);
    setPreviewMode(normalized.previewMode);
    setStarredProjectIds(normalized.starredProjectIds);
    setSelectedSpace(null);
    setSelectedProject(null);
    setView('hub');
    const nextActiveSpace = normalized.spaces.find((space) => space.id === normalized.activeSpaceId);
    setHubMode(nextActiveSpace ? (nextActiveSpace.directoryId ? 'projects' : 'spaces') : 'projects');
  }, []);

  const syncSettings = useCallback(async (
    settings: UserSettingsV1,
    options: {
      baseRevision?: string | null;
      token?: string;
      identity?: { corpId?: string | number; employeeId?: string | number };
    } = {},
  ) => {
    const currentSession = authSessionRef.current;
    const accessToken = options.token ?? currentSession?.xgToken;
    if (!accessToken) return;
    const session = options.token ? null : currentSession;

    try {
      setSettingsSyncError(null);
      const envelope = await putUserSettings(
        accessToken,
        settings,
        options.baseRevision !== undefined ? options.baseRevision : settingsRevisionRef.current,
        options.identity ?? (session
          ? { corpId: session.corpId, employeeId: session.user.id }
          : undefined),
      );
      if (envelope.settings) {
        applySettingsState(envelope.settings, envelope.revision);
      } else {
        settingsRevisionRef.current = envelope.revision;
        saveConfig({ settingsRevision: envelope.revision });
      }
    } catch (e) {
      if (e instanceof SettingsConflictError && e.current?.settings) {
        applySettingsState(e.current.settings, e.current.revision);
        setSettingsSyncError('云端配置已更新，已刷新为服务器版本');
        return;
      }
      setSettingsSyncError(e instanceof Error ? e.message : String(e));
    }
  }, [applySettingsState]);

  const persistSettingsChange = useCallback((settings: UserSettingsV1) => {
    const normalized = saveSyncedSettings(settings, settingsRevisionRef.current);
    setSpaces(normalized.spaces);
    setActiveSpaceId(normalized.activeSpaceId);
    setPreviewMode(normalized.previewMode);
    setStarredProjectIds(normalized.starredProjectIds);
    void syncSettings(normalized);
    return normalized;
  }, [syncSettings]);

  const loadCloudSettings = useCallback(async (session: AuthSession) => {
    setIsSettingsLoading(true);
    setSettingsSyncError(null);
    try {
      const identity = { corpId: session.corpId, employeeId: session.user.id };
      const envelope = await fetchUserSettings(session.xgToken, identity);
      if (envelope.exists && envelope.settings) {
        applySettingsState(envelope.settings, envelope.revision);
        return;
      }

      const localSettings = getLocalUserSettings();
      settingsRevisionRef.current = envelope.revision;
      saveConfig({ settingsRevision: envelope.revision });
      if (hasLocalSettingsData(localSettings) && window.confirm('检测到本机已有书架配置，是否迁移到服务器以便跨浏览器同步？')) {
        await syncSettings(localSettings, { baseRevision: envelope.revision, token: session.xgToken, identity });
      }
    } catch (e) {
      setSettingsSyncError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSettingsLoading(false);
    }
  }, [applySettingsState, syncSettings]);

  // 初始化：优先处理钉钉回调；已登录时用 xgToken 初始化知识库客户端。
  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      try {
        const callback = parseDingTalkCallback(window.location.search);
        if (callback) {
          setIsAuthLoading(true);
          const result = await exchangeDingTalkCode(callback.code, callback.dingCorpId);
          if (cancelled) return;
          const session = saveAuthSession(result);
          setAuthSession(session);
          cleanDingTalkCallbackUrl();
          loadSavedClient(session.xgToken);
          void loadCloudSettings(session);
          return;
        }

        const session = getAuthSession();
        setAuthSession(session);
        if (session) {
          loadSavedClient(session.xgToken);
          void loadCloudSettings(session);
        }
      } catch (e) {
        if (!cancelled) setAuthError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setIsAuthLoading(false);
      }
    }

    initAuth();
    return () => { cancelled = true; };
  }, [loadCloudSettings, loadSavedClient]);

  // 客户端就绪后加载首页列表：默认展示当前登录用户可见空间，自定义目录展示其子项目。
  useEffect(() => {
    if (!client) return;
    if (!activeSpace) {
      setHubMode('projects');
      setSelectedSpace(null);
      setSelectedProject(null);
      setView('hub');
      return;
    }
    setHubMode(activeSpace?.directoryId ? 'projects' : 'spaces');
    setSelectedSpace(null);
    setSelectedProject(null);
    setView('hub');
    loadProjects();
  }, [client, loadProjects, activeSpace?.id, activeSpace?.directoryId]);

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

  useEffect(() => {
    if (!showAccountMenu) return;
    const handler = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAccountMenu]);

  // 切换空间
  const switchSpace = useCallback((space: SpaceEntry) => {
    const nextSettings = getLocalUserSettings();
    nextSettings.activeSpaceId = space.id;
    persistSettingsChange(nextSettings);
    setShowSpaceSwitcher(false);
    setView('hub');
    setHubMode(space.directoryId ? 'projects' : 'spaces');
    setSelectedSpace(null);
    setSelectedProject(null);
  }, [persistSettingsChange]);

  // 配置保存回调
  const handleConfigSave = useCallback(async (options: {
    apiMode: 'token' | 'open-api';
    appKey: string;
    serverUrl: string;
  }) => {
    const success = options.apiMode === 'token'
      ? authSession?.xgToken
        ? initTokenClient(authSession.xgToken, options.serverUrl, true)
        : false
      : initOpenApiClient(options.appKey, options.serverUrl);
    if (!success) throw new Error('Failed to initialize API client');
    // ConfigModal 已将 spaces/previewMode 写入 localStorage，此处同步到 state 并同步到云端。
    const newConfig = getConfig();
    const nextActiveSpace = newConfig.spaces.find((space) => space.id === newConfig.activeSpaceId);
    const nextSettings: UserSettingsV1 = {
      version: 1,
      spaces: newConfig.spaces,
      activeSpaceId: newConfig.activeSpaceId,
      previewMode: newConfig.previewMode,
      starredProjectIds,
    };
    setSpaces(newConfig.spaces);
    setActiveSpaceId(newConfig.activeSpaceId);
    setPreviewMode(newConfig.previewMode);
    setView('hub');
    setHubMode(nextActiveSpace ? (nextActiveSpace.directoryId ? 'projects' : 'spaces') : 'projects');
    setSelectedSpace(null);
    setSelectedProject(null);
    void syncSettings(nextSettings);
  }, [authSession, initOpenApiClient, initTokenClient, starredProjectIds, syncSettings]);

  const handleLoginSuccess = useCallback((result: DingTalkLoginResult) => {
    const session = saveAuthSession(result);
    setAuthSession(session);
    setAuthError(null);
    loadSavedClient(session.xgToken);
    void loadCloudSettings(session);
  }, [loadCloudSettings, loadSavedClient]);

  const handleLogout = useCallback(() => {
    clearAuthSession();
    window.location.reload();
  }, []);

  const handleSelectProject = useCallback((project: FileListItem) => {
    if (project.entryKind === 'space') {
      setSelectedSpace(project);
      setHubMode('directories');
      setSelectedProject(null);
      loadSpaceProjects(String(project.id));
      return;
    }
    setSelectedProject(project);
    setView('project');
  }, [loadSpaceProjects]);

  const handleBack = useCallback(() => {
    setSelectedProject(null);
    setView('hub');
  }, []);

  const handleBackToSpaces = useCallback(() => {
    setSelectedSpace(null);
    setSelectedProject(null);
    setHubMode('spaces');
    loadProjects();
  }, [loadProjects]);

  const handleReloadHub = useCallback(() => {
    if (selectedSpace) {
      loadSpaceProjects(String(selectedSpace.id));
      return;
    }
    loadProjects();
  }, [loadProjects, loadSpaceProjects, selectedSpace]);

  const saveDirectoryToBookshelf = useCallback((directoryId: string, name: string) => {
    const newEntry: SpaceEntry = {
      id: `directory-${directoryId}`,
      name,
      directoryId,
    };
    const nextSpaces = spaces.some((space) => space.directoryId === directoryId)
      ? spaces.map((space) => space.directoryId === directoryId ? { ...space, name: space.name || name } : space)
      : [...spaces, newEntry];
    const activeEntry = nextSpaces.find((space) => space.directoryId === directoryId) ?? newEntry;

    persistSettingsChange({
      version: 1,
      spaces: nextSpaces,
      activeSpaceId: activeEntry.id,
      previewMode,
      starredProjectIds,
    });
    setShowSpaceSwitcher(false);
    setSelectedSpace(null);
    setSelectedProject(null);
    setHubMode('projects');
    setView('hub');
  }, [persistSettingsChange, previewMode, spaces, starredProjectIds]);

  const handleAddDirectoryToBookshelf = useCallback((directory: FileListItem) => {
    saveDirectoryToBookshelf(String(directory.id), directory.name);
  }, [saveDirectoryToBookshelf]);

  const handleFirstRunDirectorySelect = useCallback((selection: DirectorySelection) => {
    saveDirectoryToBookshelf(selection.directoryId, selection.name);
    setIsDirectoryPickerOpen(false);
  }, [saveDirectoryToBookshelf]);

  const handleToggleStar = useCallback((projectId: string) => {
    const next = starredProjectIds.includes(projectId)
      ? starredProjectIds.filter((id) => id !== projectId)
      : [...starredProjectIds, projectId];
    saveStarredProjectIds(next);
    persistSettingsChange({
      version: 1,
      spaces,
      activeSpaceId,
      previewMode,
      starredProjectIds: next,
    });
  }, [activeSpaceId, persistSettingsChange, previewMode, spaces, starredProjectIds]);

  const isConnecting = clientLoading || isSettingsLoading;
  const activeSpaceName = !activeSpace?.directoryId
    ? (directoryName || activeSpace?.name || '全部空间')
    : (activeSpace?.name || directoryName || activeSpace.directoryId);
  const userName = authSession?.user.name?.trim() || '用户';
  const userAvatar = authSession?.user.avatar;
  const selectedProjectId = selectedSpace
    ? String(selectedSpace.id)
    : selectedProject?.entryKind === 'project' || selectedProject?.entryKind === 'space'
      ? String(selectedProject.id)
      : undefined;
  const isSpacesHub = !activeSpace?.directoryId && hubMode === 'spaces';
  const isDirectoryPicker = !activeSpace?.directoryId && hubMode === 'directories';
  const hubTitle = isSpacesHub
    ? '我的空间'
    : isDirectoryPicker
      ? selectedSpace?.name || '选择目录'
      : activeSpace?.directoryId ? '我的书架' : '空间项目';
  const hubEmptyText = isSpacesHub
    ? '暂无可见空间'
    : isDirectoryPicker
      ? '该空间下没有可加入书架的目录'
      : '该目录下没有项目';

  const handleShareActiveSpace = async () => {
    if (!activeSpace?.directoryId || !authSession?.xgToken) return;
    const shareName = activeSpaceName || activeSpace.name || activeSpace.directoryId;
    const ok = window.confirm(`你是否需要分享「${shareName}」空间目录供他人预览？`);
    if (!ok) return;

    const shareUrl = buildDirectoryShareUrl({
      directoryId: activeSpace.directoryId,
      name: shareName,
      token: authSession.xgToken,
      serverUrl: getConfig().serverUrl,
    });
    await navigator.clipboard.writeText(shareUrl);
    window.alert('分享链接已复制到剪切板。');
  };

  if (shareParams) {
    return <SharePage share={shareParams} />;
  }

  if (isAuthLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: '#FAFAF7', color: '#6B7280' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 mx-auto mb-3" style={{ borderWidth: 2, borderStyle: 'solid', borderColor: '#ECECE6', borderTopColor: '#2563EB' }} />
          <p className="text-sm">正在完成钉钉登录...</p>
        </div>
      </div>
    );
  }

  if (!authSession) {
    return (
      <>
        <DingTalkLogin onLoginSuccess={handleLoginSuccess} />
        {authError && (
          <div className="fixed left-1/2 bottom-6 -translate-x-1/2 px-4 py-2 rounded-lg text-sm" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
            {authError}
          </div>
        )}
        {settingsSyncError && (
          <div className="fixed left-1/2 bottom-6 -translate-x-1/2 px-4 py-2 rounded-lg text-sm" style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}>
            书架云同步失败：{settingsSyncError}
          </div>
        )}
      </>
    );
  }

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
            <div className="flex items-center gap-1.5">
              <div className="relative" ref={switcherRef}>
              <button
                onClick={() => setShowSpaceSwitcher((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#ECECE6] transition-colors"
                style={{ fontSize: 13, color: '#4B5563', border: '1px solid #E8E8E5', background: '#FFFFFF' }}
              >
                <span style={{ color: '#1A1A1A', fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeSpaceName}
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
                        {space.name || (space.id === activeSpaceId ? activeSpaceName : space.directoryId || '全部空间')}
                        {space.id === activeSpaceId && <span style={{ fontSize: 11, color: '#2563EB', marginLeft: 6 }}>●</span>}
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                        {space.directoryId ? `目录 ID: ${space.directoryId}` : '当前可见空间'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              </div>
              {activeSpace?.directoryId && (
                <button
                  onClick={handleShareActiveSpace}
                  className="flex items-center justify-center rounded-lg border transition-colors hover:bg-[#ECECE6]"
                  style={{ width: 32, height: 32, color: '#4B5563', borderColor: '#E8E8E5', background: '#FFFFFF' }}
                  title="分享当前空间目录"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="relative flex-shrink-0" ref={accountMenuRef}>
          <button
            onClick={() => setShowAccountMenu((v) => !v)}
            className="flex min-w-28 items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#F0EFEA] transition-colors"
            style={{ color: '#4B5563', border: '1px solid #E8E8E5', background: '#FFFFFF' }}
            title={userName}
          >
            {userAvatar && (
              <span
                className="flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{ width: 28, height: 28, borderRadius: 999, background: '#1A1A1A' }}
              >
                <img src={userAvatar} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </span>
            )}
            <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1A1A1A', fontSize: 13, fontWeight: 500 }}>
              {userName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
          </button>

          {showAccountMenu && (
            <div
              className="absolute top-full right-0 mt-1.5 w-full bg-white rounded-xl shadow-lg border border-[#ECECE6] z-50 py-1 overflow-hidden"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
            >
              <button
                onClick={() => {
                  setShowAccountMenu(false);
                  setIsConfigModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2.5 text-left transition-colors hover:bg-[#F5F3EE]"
                style={{ color: '#4B5563', fontSize: 13 }}
              >
                <Settings className="w-4 h-4" />
                设置
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-2.5 py-2.5 text-left transition-colors hover:bg-[#F5F3EE]"
                style={{ color: '#DC2626', fontSize: 13 }}
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
              {settingsSyncError && (
                <div className="px-2.5 py-2 text-xs leading-5" style={{ color: '#C2410C', background: '#FFF7ED' }}>
                  书架云同步失败：{settingsSyncError}
                </div>
              )}
            </div>
          )}
        </div>
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
        ) : !client ? (
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
        ) : spaces.length === 0 ? (
          <FirstRunOnboarding
            onChooseDirectory={() => setIsDirectoryPickerOpen(true)}
            onOpenSettings={() => setIsConfigModalOpen(true)}
          />
        ) : view === 'project' && selectedProject ? (
          <ProjectDetail
            client={client}
            projectId={selectedProjectId}
            project={selectedProject}
            onBack={handleBack}
          />
        ) : (
          <ProjectsHub
            client={client}
            projects={projects}
            isLoading={hubLoading}
            error={hubError}
            title={hubTitle}
            itemLabel={isSpacesHub ? '空间' : isDirectoryPicker ? '目录' : '项目'}
            emptyText={hubEmptyText}
            preserveOrder={isSpacesHub || isDirectoryPicker}
            mode={isSpacesHub ? 'spaces' : isDirectoryPicker ? 'directories' : 'projects'}
            starredProjectIds={starredProjectIds}
            onBack={selectedSpace ? handleBackToSpaces : undefined}
            onAddDirectory={handleAddDirectoryToBookshelf}
            onSelectProject={handleSelectProject}
            onToggleStar={handleToggleStar}
            onReload={handleReloadHub}
          />
        )}
      </main>

      <ConfigModal
        isOpen={isConfigModalOpen}
        client={client}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={handleConfigSave}
      />
      <DirectoryPickerModal
        isOpen={isDirectoryPickerOpen}
        client={client}
        existingSpaces={spaces}
        onClose={() => setIsDirectoryPickerOpen(false)}
        onSelect={handleFirstRunDirectorySelect}
      />
      {settingsSyncError && (
        <div
          className="fixed left-1/2 bottom-6 z-50 -translate-x-1/2 px-4 py-2 rounded-lg text-sm"
          style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}
        >
          书架云同步失败：{settingsSyncError}
        </div>
      )}
    </div>
  );
}

export default App;
