import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Boxes,
  Check,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Loader2,
  Search,
  X,
} from 'lucide-react';
import type { KbApiClient } from '../lib/api';
import type { SpaceEntry } from '../lib/config';
import type { FileListItem, ProjectInfo } from '../lib/types';

export interface DirectorySelection {
  directoryId: string;
  name: string;
  path: string[];
}

interface DirectoryPickerModalProps {
  isOpen: boolean;
  client: KbApiClient | null;
  existingSpaces: SpaceEntry[];
  onClose: () => void;
  onSelect: (selection: DirectorySelection) => void;
}

type PickerNodeKind = 'space' | 'folder';

interface PickerNode {
  id: string;
  kind: PickerNodeKind;
  name: string;
  path: string[];
  projectId?: string;
  directoryId?: string;
  hasChild?: boolean;
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
    kind: 'space',
    name,
    path: [name],
    projectId,
    hasChild: true,
  };
}

function toFolderNode(item: FileListItem, parentPath: string[]): PickerNode | null {
  if (item.type !== 1) return null;
  const directoryId = String(item.id);
  const name = item.name?.trim() || directoryId;
  return {
    id: `folder-${directoryId}`,
    kind: 'folder',
    name,
    path: [...parentPath, name],
    directoryId,
    hasChild: item.hasChild,
  };
}

export function DirectoryPickerModal({
  isOpen,
  client,
  existingSpaces,
  onClose,
  onSelect,
}: DirectoryPickerModalProps) {
  const [rootNodes, setRootNodes] = useState<PickerNode[]>([]);
  const [childrenByNodeId, setChildrenByNodeId] = useState<Record<string, PickerNode[]>>({});
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const [loadingNodeIds, setLoadingNodeIds] = useState<Set<string>>(new Set());
  const [nodeErrors, setNodeErrors] = useState<Record<string, string>>({});
  const [rootLoading, setRootLoading] = useState(false);
  const [rootError, setRootError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<PickerNode | null>(null);
  const [customName, setCustomName] = useState('');
  const [query, setQuery] = useState('');

  const existingDirectoryIds = useMemo(
    () => new Set(existingSpaces.map((space) => space.directoryId).filter(Boolean)),
    [existingSpaces],
  );

  const selectedAlreadyExists = Boolean(
    selectedNode?.directoryId && existingDirectoryIds.has(selectedNode.directoryId),
  );

  useEffect(() => {
    if (!isOpen) return;
    setRootNodes([]);
    setChildrenByNodeId({});
    setExpandedNodeIds(new Set());
    setLoadingNodeIds(new Set());
    setNodeErrors({});
    setSelectedNode(null);
    setCustomName('');
    setQuery('');
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
        setRootNodes(result.value.map(toSpaceNode).filter((node): node is PickerNode => node !== null));
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

  const loadChildren = useCallback(async (node: PickerNode) => {
    if (!client || childrenByNodeId[node.id] || loadingNodeIds.has(node.id)) return;

    setLoadingNodeIds((prev) => new Set(prev).add(node.id));
    setNodeErrors((prev) => {
      const next = { ...prev };
      delete next[node.id];
      return next;
    });

    try {
      const result = node.kind === 'space'
        ? await client.getLevel1Folders(node.projectId ?? '')
        : await client.getChildFiles(node.directoryId ?? '', 1);

      if (!result.ok) {
        setNodeErrors((prev) => ({ ...prev, [node.id]: result.error }));
        setChildrenByNodeId((prev) => ({ ...prev, [node.id]: [] }));
        return;
      }

      const children = result.value
        .map((item) => toFolderNode(item, node.path))
        .filter((child): child is PickerNode => child !== null);

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

  const toggleNode = useCallback((node: PickerNode) => {
    const isExpanded = expandedNodeIds.has(node.id);
    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      if (isExpanded) next.delete(node.id);
      else next.add(node.id);
      return next;
    });
    if (!isExpanded) {
      void loadChildren(node);
    }
  }, [expandedNodeIds, loadChildren]);

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

  const nodeMatches = (node: PickerNode) => (
    !normalizedQuery
    || node.name.toLowerCase().includes(normalizedQuery)
    || node.path.join('/').toLowerCase().includes(normalizedQuery)
    || node.directoryId?.toLowerCase().includes(normalizedQuery)
  );

  const hasLoadedMatchInChildren = (node: PickerNode): boolean => {
    const children = childrenByNodeId[node.id] ?? [];
    return children.some((child) => nodeMatches(child) || hasLoadedMatchInChildren(child));
  };

  const renderNode = (node: PickerNode, level = 0) => {
    const isExpanded = expandedNodeIds.has(node.id);
    const isLoading = loadingNodeIds.has(node.id);
    const children = childrenByNodeId[node.id] ?? [];
    const nodeError = nodeErrors[node.id];
    const isSelected = selectedNode?.id === node.id;
    const isDuplicate = Boolean(node.directoryId && existingDirectoryIds.has(node.directoryId));
    const hasLoadedChildren = node.id in childrenByNodeId;
    const canTryExpand = node.kind === 'space' || node.hasChild !== false || children.length > 0;
    const canExpand = hasLoadedChildren && children.length === 0 && !nodeError
      ? false
      : canTryExpand;
    const isHiddenByFilter = normalizedQuery && !nodeMatches(node) && !hasLoadedMatchInChildren(node);

    if (isHiddenByFilter) return null;

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-1.5 rounded-lg transition-colors"
          style={{
            minHeight: 38,
            paddingLeft: level * 18 + 8,
            paddingRight: 8,
            background: isSelected ? '#EFF6FF' : undefined,
            color: node.kind === 'space' ? '#1A1A1A' : '#4B5563',
            cursor: node.kind === 'space' ? 'default' : 'pointer',
          }}
          onClick={() => {
            if (node.kind === 'space') {
              toggleNode(node);
              return;
            }
            setSelectedNode(node);
            setCustomName(node.name);
          }}
        >
          <button
            type="button"
            className="flex items-center justify-center rounded-md hover:bg-[#ECECE6]"
            style={{
              width: 24,
              height: 24,
              color: canExpand ? '#6B7280' : 'transparent',
              cursor: canExpand ? 'pointer' : 'default',
            }}
            onClick={(event) => {
              event.stopPropagation();
              if (canExpand) toggleNode(node);
            }}
            disabled={!canExpand}
            title={isExpanded ? '收起' : '展开'}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          <span
            className="flex items-center justify-center flex-shrink-0"
            style={{ color: node.kind === 'space' ? '#2563EB' : '#B45309' }}
          >
            {node.kind === 'space'
              ? <Boxes className="w-4 h-4" />
              : isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
          </span>

          <span className="truncate flex-1" style={{ fontSize: 13, fontWeight: node.kind === 'space' ? 600 : 500 }}>
            {node.name}
          </span>

          {isDuplicate && (
            <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>已添加</span>
          )}
          {isSelected && (
            <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#2563EB' }} />
          )}
        </div>

        {nodeError && (
          <div style={{ marginLeft: level * 18 + 42, padding: '4px 8px 8px', color: '#DC2626', fontSize: 12 }}>
            {nodeError}
          </div>
        )}

        {isExpanded && children.length > 0 && (
          <div>
            {children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.48)', backdropFilter: 'blur(2px)' }}>
      <div className="bg-white shadow-2xl mx-4 flex flex-col overflow-hidden" style={{ width: 'min(960px, calc(100vw - 32px))', height: 'min(680px, calc(100vh - 48px))', maxHeight: 'calc(100vh - 48px)', borderRadius: 16 }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#ECECE6] flex-shrink-0">
          <div>
            <h2 style={{ fontFamily: 'Georgia, "Noto Serif SC", serif', fontSize: 18, fontWeight: 600, color: '#1A1A1A' }}>
              选择空间目录
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>展开空间，选择要放入书架的文件夹</p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center hover:bg-[#F0EFEA] rounded-lg transition-colors"
            style={{ width: 32, height: 32, color: '#6B7280' }}
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid flex-1 min-h-0 overflow-hidden" style={{ gridTemplateColumns: 'minmax(0, 1fr) 300px' }}>
          <div className="flex flex-col min-w-0 min-h-0 border-r border-[#ECECE6]">
            <div className="p-4 border-b border-[#ECECE6] flex-shrink-0">
              <div className="flex items-center gap-2 rounded-lg border border-[#DCDCD6] bg-white px-3" style={{ height: 38 }}>
                <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#9CA3AF' }} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="筛选已加载的空间或目录"
                  className="w-full outline-none text-sm bg-transparent"
                  style={{ color: '#1A1A1A' }}
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-3">
              {rootLoading ? (
                <div className="h-full flex items-center justify-center" style={{ color: '#9CA3AF' }}>
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm">加载空间中...</p>
                  </div>
                </div>
              ) : rootError ? (
                <div className="h-full flex items-center justify-center px-6 text-center" style={{ color: '#DC2626' }}>
                  <div>
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">{rootError}</p>
                  </div>
                </div>
              ) : rootNodes.length === 0 ? (
                <div className="h-full flex items-center justify-center" style={{ color: '#9CA3AF' }}>
                  <p className="text-sm">暂无可见空间</p>
                </div>
              ) : (
                rootNodes.map((node) => renderNode(node))
              )}
            </div>
          </div>

          <aside className="flex flex-col min-w-0 min-h-0 overflow-hidden">
            <div className="p-5 flex-1 min-h-0 overflow-y-auto">
              <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                当前选择
              </p>

              {selectedNode?.directoryId ? (
                <div className="space-y-4">
                  <div>
                    <label style={{ display: 'block', color: '#6B7280', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                      目录名称
                    </label>
                    <input
                      value={customName}
                      onChange={(event) => setCustomName(event.target.value)}
                      className="w-full px-3 py-2 border border-[#DCDCD6] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder={selectedNode.name}
                    />
                    <div style={{ color: '#6B7280', fontSize: 12, lineHeight: 1.6, marginTop: 8 }}>
                      {selectedNode.path.join(' / ')}
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#ECECE6] bg-[#FAFAF7] px-3 py-2.5">
                    <div style={{ color: '#9CA3AF', fontSize: 11, marginBottom: 4 }}>目录 ID</div>
                    <div className="break-all" style={{ color: '#4B5563', fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                      {selectedNode.directoryId}
                    </div>
                  </div>

                  {selectedAlreadyExists && (
                    <div className="rounded-lg bg-amber-50 px-3 py-2.5" style={{ color: '#B45309', fontSize: 12, lineHeight: 1.5 }}>
                      这个目录已经在空间目录列表中。
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#DCDCD6] bg-[#FAFAF7] px-4 py-8 text-center" style={{ color: '#9CA3AF' }}>
                  <Folder className="w-8 h-8 mx-auto mb-3" />
                  <p className="text-sm">从左侧选择一个文件夹</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#ECECE6] flex-shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-lg hover:bg-[#F0EFEA] transition-colors"
                style={{ color: '#6B7280' }}
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedNode?.directoryId || selectedAlreadyExists}
                className="px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                style={{ background: '#1A1A1A', color: '#FFFFFF' }}
              >
                <Check className="w-4 h-4" />
                添加目录
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
