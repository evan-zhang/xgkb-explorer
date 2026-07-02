import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  Layers,
  Loader2,
  Search,
  X,
} from 'lucide-react';
import type { KbApiClient } from '../lib/api';
import type { SpaceEntry } from '../lib/config';
import type { FileListItem, ProjectInfo, ShareToMeItem } from '../lib/types';

export interface DirectorySelection {
  directoryId: string;
  name: string;
  path: string[];
}

interface DirectoryPickerModalProps {
  isOpen: boolean;
  client: KbApiClient | null;
  existingSpaces: SpaceEntry[];
  employeeId?: string | number;
  onClose: () => void;
  onSelect: (selection: DirectorySelection) => void;
}

type PickerTab = 'mine' | 'shared';
type PickerView = 'spaces' | 'folders';

interface PickerNode {
  id: string;
  name: string;
  path: string[];
  kind: 'space' | 'folder' | 'file';
  projectId?: string;
  directoryId?: string;
  fileId?: string;
  hasChild?: boolean;
  suffix?: string;
  size?: number;
  updateTime?: number;
  shareSource?: string;
  shareTime?: string | number;
}

function getProjectId(project: ProjectInfo): string | null {
  const id = project.projectId ?? project.id ?? project.fileId;
  return id === undefined || id === null ? null : String(id);
}

function getProjectName(project: ProjectInfo, id: string): string {
  return (project.name ?? project.projectName ?? project.title ?? String(id)).trim() || String(id);
}

function toSpaceNode(project: ProjectInfo): PickerNode | null {
  const projectId = getProjectId(project);
  if (!projectId) return null;
  const name = getProjectName(project, projectId);
  return {
    id: `space-${projectId}`,
    name,
    path: [name],
    kind: 'space',
    projectId,
    hasChild: true,
  };
}

function getSharedDirectoryId(item: ShareToMeItem): string | null {
  const id = item.directoryId ?? item.fileId ?? item.targetId ?? item.bizId ?? item.id;
  return id === undefined || id === null ? null : String(id);
}

function getSharedDirectoryName(item: ShareToMeItem, id: string): string {
  return (item.directoryName ?? item.fileName ?? item.name ?? item.title ?? String(id)).trim() || String(id);
}

function getSharedSource(item: ShareToMeItem): string | undefined {
  return item.creator
    ?? item.shareSource
    ?? item.shareUserName
    ?? item.shareEmployeeName
    ?? item.sharerName
    ?? item.creatorName
    ?? item.createUserName
    ?? item.ownerName
    ?? item.userName;
}

function getSharedTime(item: ShareToMeItem): string | number | undefined {
  return item.createBy ?? item.shareTime ?? item.shareAt ?? item.gmtCreate ?? item.createTime ?? item.updateTime;
}

function formatSharedTime(value?: string | number): string | null {
  if (value === undefined || value === null || value === '') return null;
  const numeric = typeof value === 'number' ? value : Number(value);
  const date = Number.isFinite(numeric)
    ? new Date(numeric < 1_000_000_000_000 ? numeric * 1000 : numeric)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toSharedDirectoryNode(item: ShareToMeItem): PickerNode | null {
  const fileType = item.fileType ?? item.type;
  if (fileType !== undefined && Number(fileType) !== 1) return null;
  const directoryId = getSharedDirectoryId(item);
  if (!directoryId) return null;
  const name = getSharedDirectoryName(item, directoryId);
  return {
    id: `shared-${directoryId}`,
    name,
    path: [name],
    kind: 'folder',
    directoryId,
    hasChild: item.hasChild,
    suffix: item.suffix,
    size: item.size,
    updateTime: item.updateTime,
    shareSource: getSharedSource(item),
    shareTime: getSharedTime(item),
  };
}

function toFolderNode(item: FileListItem, parentPath: string[]): PickerNode {
  const directoryId = String(item.id);
  const name = item.name?.trim() || directoryId;
  return {
    id: `folder-${directoryId}`,
    name,
    path: [...parentPath, name],
    kind: 'folder',
    directoryId,
    hasChild: item.hasChild,
    updateTime: item.updateTime,
  };
}

function toFileNode(item: FileListItem, parentPath: string[]): PickerNode {
  const fileId = String(item.id);
  const name = item.name?.trim() || fileId;
  return {
    id: `file-${fileId}`,
    name,
    path: [...parentPath, name],
    kind: 'file',
    fileId,
    hasChild: false,
    suffix: item.suffix,
    size: item.size,
    updateTime: item.updateTime,
  };
}

function toChildNode(item: FileListItem, parentPath: string[]): PickerNode {
  return item.type === 1 ? toFolderNode(item, parentPath) : toFileNode(item, parentPath);
}

function isFolderNode(node: PickerNode): boolean {
  return node.kind === 'space' || node.kind === 'folder';
}

function nodeKey(node: PickerNode): string {
  if (node.directoryId) return `folder-${node.directoryId}`;
  if (node.fileId) return `file-${node.fileId}`;
  return node.id;
}

function isSamePath(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((part, index) => part === b[index]);
}

export function DirectoryPickerModal({
  isOpen,
  client,
  existingSpaces,
  employeeId,
  onClose,
  onSelect,
}: DirectoryPickerModalProps) {
  const [activeTab, setActiveTab] = useState<PickerTab>('mine');
  const [view, setView] = useState<PickerView>('spaces');
  const [spaces, setSpaces] = useState<PickerNode[]>([]);
  const [sharedDirectories, setSharedDirectories] = useState<PickerNode[]>([]);
  const [sharedLoaded, setSharedLoaded] = useState(false);
  const [sharedLoading, setSharedLoading] = useState(false);
  const [sharedError, setSharedError] = useState<string | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<PickerNode | null>(null);
  const [currentFolder, setCurrentFolder] = useState<PickerNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<PickerNode | null>(null);
  const [customName, setCustomName] = useState('');
  const [query, setQuery] = useState('');
  const [childrenByNodeId, setChildrenByNodeId] = useState<Record<string, PickerNode[]>>({});
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const [loadingNodeIds, setLoadingNodeIds] = useState<Set<string>>(new Set());
  const [nodeErrors, setNodeErrors] = useState<Record<string, string>>({});
  const [rootLoading, setRootLoading] = useState(false);
  const [rootError, setRootError] = useState<string | null>(null);

  const existingDirectoryIds = useMemo(
    () => new Set(existingSpaces.map((space) => space.directoryId).filter(Boolean)),
    [existingSpaces],
  );

  const selectedAlreadyExists = Boolean(
    selectedNode?.directoryId && existingDirectoryIds.has(selectedNode.directoryId),
  );

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab('mine');
    setView('spaces');
    setSpaces([]);
    setSharedDirectories([]);
    setSharedLoaded(false);
    setSharedLoading(false);
    setSharedError(null);
    setSelectedSpace(null);
    setCurrentFolder(null);
    setSelectedNode(null);
    setCustomName('');
    setQuery('');
    setChildrenByNodeId({});
    setExpandedNodeIds(new Set());
    setLoadingNodeIds(new Set());
    setNodeErrors({});
    setRootError(null);

    if (!client) {
      setRootError('API 客户端未初始化');
      return;
    }

    let cancelled = false;
    setRootLoading(true);
    client.findAllProjects({ nameKey: '', bizCode: 'ordinary', appCode: 'kz_doc' })
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setRootError(result.error);
          return;
        }
        setSpaces(result.value.map(toSpaceNode).filter((node): node is PickerNode => node !== null));
      })
      .catch((error) => {
        if (cancelled) return;
        setRootError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (!cancelled) setRootLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [client, isOpen]);

  const loadSharedDirectories = useCallback(async () => {
    if (!client) {
      setSharedError('API 客户端未初始化');
      setSharedLoaded(true);
      return;
    }
    if (employeeId === undefined || employeeId === null || !String(employeeId).trim()) {
      setSharedError('无法识别当前员工 ID');
      setSharedLoaded(true);
      return;
    }

    setSharedLoading(true);
    setSharedError(null);
    try {
      const result = await client.getShareToMeList({
        pageIndex: 1,
        pageSize: 100,
        employeeId,
      });
      if (!result.ok) {
        setSharedError(result.error);
        setSharedDirectories([]);
        return;
      }
      setSharedDirectories(result.value.map(toSharedDirectoryNode).filter((node): node is PickerNode => node !== null));
    } catch (error) {
      setSharedError(error instanceof Error ? error.message : String(error));
      setSharedDirectories([]);
    } finally {
      setSharedLoaded(true);
      setSharedLoading(false);
    }
  }, [client, employeeId]);

  const loadChildren = useCallback(async (node: PickerNode) => {
    if (!client || childrenByNodeId[node.id] || loadingNodeIds.has(node.id)) return;

    setLoadingNodeIds((prev) => new Set(prev).add(node.id));
    setNodeErrors((prev) => {
      const next = { ...prev };
      delete next[node.id];
      return next;
    });

    try {
      const result = node.projectId
        ? await client.getLevel1Folders(node.projectId)
        : await client.getChildFiles(node.directoryId ?? '');

      if (!result.ok) {
        setNodeErrors((prev) => ({ ...prev, [node.id]: result.error }));
        setChildrenByNodeId((prev) => ({ ...prev, [node.id]: [] }));
        return;
      }

      const children = result.value.map((item) => toChildNode(item, node.path));

      setChildrenByNodeId((prev) => ({ ...prev, [node.id]: children }));
    } catch (error) {
      setNodeErrors((prev) => ({
        ...prev,
        [node.id]: error instanceof Error ? error.message : String(error),
      }));
      setChildrenByNodeId((prev) => ({ ...prev, [node.id]: [] }));
    } finally {
      setLoadingNodeIds((prev) => {
        const next = new Set(prev);
        next.delete(node.id);
        return next;
      });
    }
  }, [childrenByNodeId, client, loadingNodeIds]);

  const selectFolder = (node: PickerNode) => {
    setSelectedNode(node);
    setCurrentFolder(node);
    setCustomName(node.name);
    setExpandedNodeIds((prev) => new Set(prev).add(node.id));
    void loadChildren(node);
  };

  const enterSpace = (space: PickerNode) => {
    setSelectedSpace(space);
    setCurrentFolder(space);
    setSelectedNode(null);
    setCustomName('');
    setView('folders');
    setExpandedNodeIds((prev) => new Set(prev).add(space.id));
    void loadChildren(space);
  };

  const enterSharedDirectory = (directory: PickerNode) => {
    setSelectedSpace(directory);
    setCurrentFolder(directory);
    setSelectedNode(directory);
    setCustomName(directory.name);
    setView('folders');
    setExpandedNodeIds((prev) => new Set(prev).add(directory.id));
    void loadChildren(directory);
  };

  const navigateToBreadcrumb = (index: number) => {
    if (!selectedSpace) return;
    const currentPath = currentFolder?.path ?? selectedSpace.path;
    const targetPath = currentPath.slice(0, index + 1);
    const loadedFolders = Object.values(childrenByNodeId).flat().filter(isFolderNode);
    const target = isSamePath(selectedSpace.path, targetPath)
      ? selectedSpace
      : loadedFolders.find((node) => isSamePath(node.path, targetPath));
    if (target) selectFolder(target);
  };

  const toggleFolder = (node: PickerNode, event?: React.MouseEvent) => {
    event?.stopPropagation();
    const isExpanded = expandedNodeIds.has(node.id);
    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      if (isExpanded) next.delete(node.id);
      else next.add(node.id);
      return next;
    });
    if (!isExpanded) void loadChildren(node);
  };

  const handleBack = () => {
    if (view === 'folders') {
      setView('spaces');
      setSelectedSpace(null);
      setCurrentFolder(null);
      setSelectedNode(null);
      setCustomName('');
      setQuery('');
    }
  };

  const handleConfirm = () => {
    if (!selectedNode?.directoryId || selectedAlreadyExists) return;
    onSelect({
      directoryId: selectedNode.directoryId,
      name: customName.trim() || selectedNode.name,
      path: selectedNode.path,
    });
  };

  if (!isOpen) return null;

  const normalizedQuery = query.trim().toLowerCase();
  const filterNodes = (nodes: PickerNode[]) => nodes.filter((node) => (
    !normalizedQuery
    || node.name.toLowerCase().includes(normalizedQuery)
    || node.path.join('/').toLowerCase().includes(normalizedQuery)
    || node.directoryId?.toLowerCase().includes(normalizedQuery)
    || node.fileId?.toLowerCase().includes(normalizedQuery)
  ));

  const currentChildren = currentFolder ? childrenByNodeId[currentFolder.id] ?? [] : [];
  const visibleFolderChildren = filterNodes(currentChildren.filter((node) => node.kind === 'folder'));
  const visibleFileChildren = filterNodes(currentChildren.filter((node) => node.kind === 'file'));
  const currentLoading = Boolean(currentFolder && loadingNodeIds.has(currentFolder.id));
  const currentError = currentFolder ? nodeErrors[currentFolder.id] : undefined;
  const rootNodes = activeTab === 'mine' ? spaces : sharedDirectories;
  const rootListLoading = activeTab === 'mine' ? rootLoading : sharedLoading;
  const rootListError = activeTab === 'mine' ? rootError : sharedError;

  const switchRootTab = (tab: PickerTab) => {
    setActiveTab(tab);
    if (tab === 'shared' && !sharedLoaded && !sharedLoading) {
      void loadSharedDirectories();
    }
  };

  const renderTreeNode = (node: PickerNode, depth = 0) => {
    const id = nodeKey(node);
    const isExpanded = expandedNodeIds.has(node.id);
    const isSelected = selectedNode?.id === node.id || currentFolder?.id === node.id;
    const children = (childrenByNodeId[node.id] ?? []).filter(isFolderNode);
    const nodeError = nodeErrors[node.id];
    const isLoading = loadingNodeIds.has(node.id);
    const hasLoadedChildren = node.id in childrenByNodeId;
    const hasChildren = children.length > 0;
    const canExpand = hasLoadedChildren && !hasChildren && !nodeError ? false : node.hasChild !== false || hasChildren;
    const isDuplicate = Boolean(node.directoryId && existingDirectoryIds.has(node.directoryId));

    return (
      <div key={id}>
        <div
          onClick={() => selectFolder(node)}
          className="group flex items-center justify-between rounded-lg cursor-pointer transition-all"
          style={{
            minHeight: 32,
            paddingLeft: depth * 10 + 4,
            paddingRight: 8,
            background: isSelected ? '#F3F4F6' : undefined,
            color: isSelected ? '#111827' : '#4B5563',
            fontSize: 12,
            fontWeight: isSelected ? 600 : 500,
          }}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={(event) => toggleFolder(node, event)}
              className="flex items-center justify-center rounded hover:bg-[#E5E7EB]"
              style={{
                width: 20,
                height: 20,
                color: canExpand ? '#9CA3AF' : 'transparent',
                cursor: canExpand ? 'pointer' : 'default',
              }}
              disabled={!canExpand}
              title={isExpanded ? '收起' : '展开'}
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
            <Folder className="w-3.5 h-3.5 shrink-0" style={{ color: '#F59E0B', fill: 'rgba(245,158,11,0.10)' }} />
            <span className="truncate">{node.name}</span>
          </div>
          {isDuplicate && (
            <span className="shrink-0" style={{ color: '#10B981', fontSize: 10 }}>已添加</span>
          )}
        </div>
        {nodeError && (
          <div style={{ marginLeft: depth * 10 + 30, color: '#DC2626', fontSize: 11, padding: '2px 0 6px' }}>{nodeError}</div>
        )}
        {isExpanded && children.length > 0 && (
          <div className="mt-0.5 space-y-0.5">
            {children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center select-none" style={{ background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(2px)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white border border-[#F1F1EF] shadow-2xl mx-4 flex flex-col overflow-hidden" style={{ width: 'min(900px, calc(100vw - 32px))', height: 'min(560px, calc(100vh - 48px))', borderRadius: 12 }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#ECECE6] flex-shrink-0" style={{ background: '#FAFAF7' }}>
          <div className="flex items-center gap-3 min-w-0">
            {view === 'folders' && (
              <button
                onClick={handleBack}
                className="flex items-center justify-center rounded-lg hover:bg-[#ECECE6] transition-colors"
                style={{ width: 30, height: 30, color: '#6B7280' }}
                title="返回空间列表"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            {view === 'spaces' ? (
              <div className="inline-flex rounded-lg border bg-white p-1" style={{ borderColor: '#E5E7EB' }}>
                {([
                  ['mine', '我的空间'],
                  ['shared', '分享给我的'],
                ] as const).map(([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => switchRootTab(tab)}
                    className="rounded-md px-3 py-1.5 text-sm font-semibold transition-colors"
                    style={activeTab === tab
                      ? { background: '#1A1A1A', color: '#FFFFFF' }
                      : { background: 'transparent', color: '#6B7280' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="min-w-0">
                <div className="truncate" style={{ color: '#111827', fontSize: 14, fontWeight: 700 }}>
                  {selectedSpace?.name}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg hover:bg-[#ECECE6] transition-colors"
            style={{ width: 32, height: 32, color: '#9CA3AF' }}
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {view === 'spaces' && (
            <div className="h-full overflow-y-auto px-8 py-7" style={{ background: '#FAFAF7' }}>
              {rootListLoading ? (
                <div className="h-72 flex items-center justify-center" style={{ color: '#9CA3AF' }}>
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm">加载空间中...</p>
                  </div>
                </div>
              ) : rootListError ? (
                <div className="h-72 flex items-center justify-center px-6 text-center" style={{ color: '#DC2626' }}>
                  <div>
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">{rootListError}</p>
                  </div>
                </div>
              ) : rootNodes.length === 0 ? (
                <div className="h-72 flex items-center justify-center" style={{ color: '#9CA3AF' }}>
                  <p className="text-sm">{activeTab === 'mine' ? '暂无可见空间' : '暂无分享给我的目录'}</p>
                </div>
              ) : (
                <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm divide-y divide-[#F3F4F6] overflow-hidden">
                  {rootNodes.map((space) => (
                    <button
                      key={space.id}
                      onClick={() => activeTab === 'mine' ? enterSpace(space) : enterSharedDirectory(space)}
                      className="group w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-[#FAFAFA] transition-colors"
                    >
                      <span className="flex items-start gap-4 min-w-0">
                        <span className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 38, height: 38, background: '#EFF6FF', color: '#2563EB', border: '1px solid #DBEAFE' }}>
                          {activeTab === 'mine' ? <Layers className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate" style={{ color: '#1F2937', fontSize: 14, fontWeight: 700 }}>{space.name}</span>
                          {activeTab === 'mine' ? (
                            <span className="block mt-1" style={{ color: '#9CA3AF', fontSize: 11 }}>
                              {`空间 ID: ${space.projectId}`}
                            </span>
                          ) : (
                            <span className="block mt-1 space-y-0.5" style={{ color: '#9CA3AF', fontSize: 11 }}>
                              <span className="block">{`目录 ID: ${space.directoryId}`}</span>
                              <span className="block">
                                {`分享来源: ${space.shareSource || '-'}`}
                                {formatSharedTime(space.shareTime) ? ` · 分享时间: ${formatSharedTime(space.shareTime)}` : ''}
                              </span>
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 flex-shrink-0" style={{ color: '#2563EB', fontSize: 12, fontWeight: 650 }}>
                        浏览目录
                        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === 'folders' && selectedSpace && (
            <div className="h-full flex overflow-hidden bg-white">
              <div className="w-60 border-r border-[#F1F1EF] p-4 overflow-y-auto shrink-0" style={{ background: '#FAFAF7' }}>
                <p style={{ color: '#9CA3AF', fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', margin: '0 0 12px 4px' }}>树形目录结构</p>
                <div className="space-y-1">
                  {renderTreeNode(selectedSpace)}
                </div>
              </div>

              <div className="flex-1 min-w-0 min-h-0 flex flex-col">
                <div className="px-6 py-4 border-b border-[#F1F1EF] flex-shrink-0">
                  <div className="flex items-center gap-2 text-xs overflow-x-auto whitespace-nowrap" style={{ color: '#6B7280' }}>
                    <Folder className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#F59E0B' }} />
                    {(currentFolder?.path ?? selectedSpace.path).map((part, index, path) => {
                      const isLast = index === path.length - 1;
                      return (
                        <span key={`${part}-${index}`} className="inline-flex items-center gap-1.5">
                          {index > 0 && <span style={{ color: '#D1D5DB' }}>/</span>}
                          <button
                            type="button"
                            onClick={() => navigateToBreadcrumb(index)}
                            className="rounded px-1 py-0.5 transition-colors hover:bg-[#F0EFEA]"
                            style={{ color: isLast ? '#111827' : '#6B7280', fontWeight: isLast ? 700 : 500 }}
                          >
                            {part}
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
                  <div className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 mb-5" style={{ height: 36 }}>
                    <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#9CA3AF' }} />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="筛选当前层级目录"
                      className="w-full outline-none text-sm bg-transparent"
                      style={{ color: '#111827' }}
                    />
                  </div>

                  {currentLoading ? (
                    <div className="py-16 text-center" style={{ color: '#9CA3AF' }}>
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm">加载目录中...</p>
                    </div>
                  ) : currentError ? (
                    <div className="py-16 text-center" style={{ color: '#DC2626' }}>
                      <AlertCircle className="w-7 h-7 mx-auto mb-2" />
                      <p className="text-sm">{currentError}</p>
                    </div>
                  ) : visibleFolderChildren.length > 0 || visibleFileChildren.length > 0 ? (
                    <div className="space-y-5">
                      {visibleFolderChildren.length > 0 && (
                        <div className="space-y-3">
                          <p style={{ color: '#9CA3AF', fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase' }}>子目录文件夹</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {visibleFolderChildren.map((folder) => {
                              const isDuplicate = Boolean(folder.directoryId && existingDirectoryIds.has(folder.directoryId));
                              const isActive = selectedNode?.id === folder.id;
                              return (
                                <button
                                  key={folder.id}
                                  onClick={() => selectFolder(folder)}
                                  className="group text-left border rounded-xl flex items-center justify-between gap-3 p-3.5 transition-all"
                                  style={{
                                    background: isActive ? '#EFF6FF' : '#FFFFFF',
                                    borderColor: isActive ? '#BFDBFE' : '#F1F1EF',
                                    boxShadow: isActive ? '0 8px 20px rgba(37,99,235,0.08)' : 'none',
                                  }}
                                >
                                  <span className="flex items-center gap-3 min-w-0">
                                    <span className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 34, height: 34, background: isDuplicate ? '#ECFDF5' : '#FFFBEB' }}>
                                      <Folder className="w-4 h-4" style={{ color: isDuplicate ? '#10B981' : '#F59E0B', fill: isDuplicate ? '#ECFDF5' : 'rgba(245,158,11,0.10)' }} />
                                    </span>
                                    <span className="min-w-0">
                                      <span className="flex items-center gap-1.5 min-w-0">
                                        <span className="truncate" style={{ color: '#1F2937', fontSize: 12, fontWeight: 700 }}>{folder.name}</span>
                                        {isDuplicate && <span className="flex-shrink-0 rounded px-1.5 py-0.5" style={{ color: '#059669', background: '#ECFDF5', fontSize: 9 }}>已添加</span>}
                                      </span>
                                      <span className="block mt-1" style={{ color: '#9CA3AF', fontSize: 10 }}>目录 ID: {folder.directoryId}</span>
                                    </span>
                                  </span>
                                  <ChevronRight className="w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: '#D1D5DB' }} />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {visibleFileChildren.length > 0 && (
                        <div className="space-y-3">
                          <p style={{ color: '#9CA3AF', fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase' }}>文档列表</p>
                          <div className="space-y-2">
                            {visibleFileChildren.map((file) => (
                              <div
                                key={file.id}
                                className="group flex items-center justify-between gap-3 border rounded-xl px-3.5 py-3 transition-colors"
                                style={{ background: '#FAFAF7', borderColor: '#F1F1EF' }}
                              >
                                <span className="flex items-center gap-3 min-w-0">
                                  <span className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 34, height: 34, background: '#EFF6FF', color: '#2563EB' }}>
                                    <FileText className="w-4 h-4" />
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block truncate" style={{ color: '#374151', fontSize: 12, fontWeight: 650 }}>{file.name}</span>
                                    <span className="block mt-1" style={{ color: '#9CA3AF', fontSize: 10 }}>
                                      {[file.suffix ? file.suffix.toUpperCase() : '文件', file.fileId ? `ID: ${file.fileId}` : null].filter(Boolean).join(' · ')}
                                    </span>
                                  </span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-16 text-center" style={{ color: '#9CA3AF' }}>
                      <Folder className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-xs">当前层级没有子目录或文档</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#F1F1EF] px-6 py-4 flex-shrink-0" style={{ background: '#FAFAF7' }}>
                  {selectedNode?.directoryId ? (
                    <div className="flex items-end gap-3">
                      <div className="min-w-0 flex-1">
                        <label style={{ display: 'block', color: '#6B7280', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>书架显示名称</label>
                        <input
                          value={customName}
                          onChange={(event) => setCustomName(event.target.value)}
                          className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          placeholder={selectedNode.name}
                        />
                      </div>
                      <button
                        onClick={handleConfirm}
                        disabled={selectedAlreadyExists}
                        className="px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 flex-shrink-0"
                        style={{ background: '#2563EB', color: '#FFFFFF', fontWeight: 700 }}
                      >
                        <Check className="w-4 h-4" />
                        {selectedAlreadyExists ? '已添加' : '添加到书架'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <p style={{ color: '#9CA3AF', fontSize: 12 }}>选择一个文件夹后，可设置它在书架中的显示名称。</p>
                      <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg hover:bg-[#ECECE6] transition-colors" style={{ color: '#6B7280' }}>取消</button>
                    </div>
                  )}
                  {selectedAlreadyExists && (
                    <p style={{ color: '#B45309', fontSize: 11, marginTop: 8 }}>这个目录已经在空间目录列表中。</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
