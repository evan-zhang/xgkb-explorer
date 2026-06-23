/**
 * 文件树组件
 * 显示可展开/折叠的目录树结构
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ReactElement } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Share2, MoreHorizontal } from 'lucide-react';
import type { FileListItem } from '../lib/types';
import { useFileTree } from '../lib/hooks';
import { ContextMenu } from './ContextMenu';

interface FileTreeProps {
  client: any;
  projectId?: string | null;
  onFileSelect: (file: FileListItem, path: string) => void;
  onFolderSelect?: (folder: FileListItem, path: string) => void;
  rootFileId?: string;
  foldersOnly?: boolean;
  refreshKey?: number;
}

export function FileTree({ client, projectId, onFileSelect, onFolderSelect, rootFileId, foldersOnly, refreshKey }: FileTreeProps) {
  const { rootFiles, expandedFolders, isLoading, error, loadRootFiles, loadChildFiles, toggleFolder } =
    useFileTree(client);

  const [childFilesCache, setChildFilesCache] = useState<Record<string, FileListItem[]>>({});
  const [menu, setMenu] = useState<{ item: FileListItem; x: number; y: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  }, []);

  // 加载根目录：若有 rootFileId 则直接用它加载子项，否则用 projectId 加载一级目录
  useEffect(() => {
    if (rootFileId) {
      setChildFilesCache({}); // 清空缓存
      loadChildFiles(rootFileId).then((children) => {
        if (children.length > 0) {
          // 借用 loadRootFiles 的内部 setter 需通过 hack，改为直接利用缓存机制
          // 将 rootFileId 的子项当作"根文件"写入缓存，展开 rootFileId
          setChildFilesCache((prev) => ({ ...prev, [rootFileId]: children }));
        }
      });
    } else if (projectId) {
      loadRootFiles(projectId);
    }
  }, [projectId, rootFileId, loadRootFiles, loadChildFiles, refreshKey]);

  // 加载子目录
  const loadFolderChildren = async (folderId: string) => {
    if (childFilesCache[folderId]) {
      return; // 已缓存
    }

    const children = await loadChildFiles(folderId);
    if (children.length > 0) {
      setChildFilesCache((prev) => ({
        ...prev,
        [folderId]: children,
      }));
    }
  };

  // 处理节点点击
  const handleNodeClick = (file: FileListItem, path: string) => {
    if (file.type === 1) {
      // 文件夹：切换展开状态 + 通知父组件
      toggleFolder(String(file.id));
      if (!expandedFolders.has(String(file.id))) {
        loadFolderChildren(String(file.id));
      }
      onFolderSelect?.(file, path);
    } else {
      // 文件：触发选择回调
      onFileSelect(file, path);
    }
  };

  // 获取文件图标
  const getFileIcon = (file: FileListItem) => {
    if (file.type === 1) {
      const isOpen = expandedFolders.has(String(file.id));
      return isOpen
        ? <FolderOpen className="w-4 h-4" style={{ color: '#B45309' }} />
        : <Folder className="w-4 h-4" style={{ color: '#B45309' }} />;
    }

    // 文件：根据扩展名显示
    const suffix = file.suffix?.toLowerCase() || '';
    if (['md', 'markdown', 'mdown', 'mkd'].includes(suffix)) {
      return <File className="w-4 h-4 text-blue-500" />;
    }
    if (['js', 'jsx', 'ts', 'tsx', 'json'].includes(suffix)) {
      return <File className="w-4 h-4 text-yellow-500" />;
    }
    if (['sh', 'bash', 'zsh'].includes(suffix)) {
      return <File className="w-4 h-4 text-green-500" />;
    }
    return <File className="w-4 h-4" />;
  };

  // 递归渲染树节点
  const renderTreeNode = (file: FileListItem, level: number = 0, path: string = ''): ReactElement => {
    const currentPath = path ? `${path}/${file.name}` : file.name;
    const fileId = String(file.id);
    const isExpanded = expandedFolders.has(fileId);
    const children = childFilesCache[fileId] || [];
    const hasChildren = file.hasChild || children.length > 0;

    return (
      <div key={fileId}>
        <div
          className="group flex items-center gap-1.5 cursor-pointer rounded-md transition-colors hover:bg-[#EDEBE4]"
          style={{
            paddingLeft: `${level * 16 + 12}px`,
            paddingRight: 4,
            paddingTop: 7,
            paddingBottom: 7,
            fontSize: 14,
            color: '#4B5563',
          }}
          onClick={() => handleNodeClick(file, currentPath)}
        >
          {/* 展开/折叠图标 */}
          {hasChildren ? (
            <span className="flex-shrink-0" style={{ color: '#9CA3AF' }}>
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </span>
          ) : (
            <span className="w-3 h-3 flex-shrink-0" />
          )}

          {/* 文件/文件夹图标 */}
          <span className="flex-shrink-0">{getFileIcon(file)}</span>

          {/* 文件名 */}
          <span className="truncate flex-1">{file.name}</span>

          {/* ⋯ 按钮 */}
          <button
            className="flex-shrink-0 p-1 rounded transition-opacity hover:bg-[#DDD9D0]"
            onClick={(e) => { e.stopPropagation(); setMenu({ item: file, x: e.clientX, y: e.clientY }); }}
          >
            <MoreHorizontal className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
          </button>
        </div>

        {/* 递归渲染子节点 */}
        {isExpanded && children.length > 0 && (
          <div>
            {(foldersOnly ? children.filter((c) => c.type === 1) : children).map((child) =>
              renderTreeNode(child, level + 1, currentPath)
            )}
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full px-4">
        <p className="text-sm text-center" style={{ color: '#DC2626' }}>{error}</p>
      </div>
    );
  }

  // 当传入 rootFileId 时，以该目录的子项作为树的根
  const effectiveRootFiles = rootFileId
    ? (childFilesCache[rootFileId] || [])
    : rootFiles;

  const effectiveLoading = isLoading || (rootFileId && effectiveRootFiles.length === 0 && !error);

  if (effectiveLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center" style={{ color: '#9CA3AF' }}>
          <div className="animate-spin rounded-full h-6 w-6 mx-auto mb-2" style={{ borderWidth: 2, borderStyle: 'solid', borderColor: '#ECECE6', borderTopColor: '#6B7280' }} />
          <p className="text-xs">加载中...</p>
        </div>
      </div>
    );
  }

  if (effectiveRootFiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm" style={{ color: '#9CA3AF' }}>空目录</p>
      </div>
    );
  }

  const displayRootFiles = foldersOnly
    ? effectiveRootFiles.filter((f) => f.type === 1)
    : effectiveRootFiles;

  return (
    <>
      <div className="h-full overflow-y-auto" style={{ padding: '8px 8px 16px' }}>
        {displayRootFiles.map((file) => renderTreeNode(file))}
      </div>

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={[
            {
              label: '分享',
              icon: <Share2 className="w-4 h-4" />,
              onClick: async () => {
                const r = await client.getShareUrl(String(menu.item.id));
                if (r.ok) {
                  await navigator.clipboard.writeText(r.value.shareUrl);
                  showToast('分享链接已复制');
                }
                setMenu(null);
              },
            },
          ]}
          onClose={() => setMenu(null)}
        />
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: '#1A1A1A', color: '#FFFFFF',
          padding: '10px 16px', borderRadius: 10, fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>
          <Share2 className="w-4 h-4" style={{ color: '#4ADE80' }} />
          {toast}
        </div>
      )}
    </>
  );
}
