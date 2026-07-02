/**
 * React Hooks for API calls
 */

import { useState, useCallback, useEffect } from 'react';
import { OpenApiClient, TokenApiClient } from './api';
import type { KbApiClient } from './api';
import type { FileListItem, ProjectInfo } from '../lib/types';
import { getConfig, saveConfig } from './config';

// ==================== API Client Hook ====================

export function useApiClient() {
  const [client, setClient] = useState<KbApiClient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initTokenClient = useCallback((accessToken: string, serverUrl?: string, persist = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const config = getConfig();
      const newClient = new TokenApiClient(accessToken, serverUrl || config.serverUrl);
      setClient(newClient);
      if (persist) saveConfig({ apiMode: 'token', serverUrl });
      setIsLoading(false);
      return true;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setError(errorMsg);
      setIsLoading(false);
      return false;
    }
  }, []);

  const initOpenApiClient = useCallback((appKey: string, serverUrl?: string, persist = true) => {
    setIsLoading(true);
    setError(null);
    try {
      const config = getConfig();
      const newClient = new OpenApiClient(appKey, serverUrl || config.serverUrl);
      setClient(newClient);
      if (persist) saveConfig({ apiMode: 'open-api', appKey, serverUrl });
      setIsLoading(false);
      return true;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setError(errorMsg);
      setIsLoading(false);
      return false;
    }
  }, []);

  const loadSavedClient = useCallback((accessToken?: string) => {
    const config = getConfig();
    if (accessToken) {
      return initTokenClient(accessToken, config.serverUrl);
    }
    if (config.apiMode === 'open-api' && config.appKey) {
      return initOpenApiClient(config.appKey, config.serverUrl, false);
    }
    return false;
  }, [initOpenApiClient, initTokenClient]);

  return {
    client,
    isLoading,
    error,
    initOpenApiClient,
    initTokenClient,
    loadSavedClient,
  };
}

// ==================== File Tree Hook ====================

export function useFileTree(client: KbApiClient | null) {
  const [rootFiles, setRootFiles] = useState<FileListItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRootFiles = useCallback(async (projectId: string) => {
    if (!client) {
      setError('API 客户端未初始化');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await client.getLevel1Folders(projectId);
      if (result.ok) {
        setRootFiles(result.value);
      } else {
        setError(result.error);
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const loadChildFiles = useCallback(async (
    parentId: string,
  ): Promise<FileListItem[]> => {
    if (!client) {
      setError('API 客户端未初始化');
      return [];
    }

    try {
      const result = await client.getChildFiles(parentId);
      if (result.ok) {
        return result.value;
      } else {
        setError(result.error);
        return [];
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setError(errorMsg);
      return [];
    }
  }, [client]);

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  return {
    rootFiles,
    expandedFolders,
    isLoading,
    error,
    loadRootFiles,
    loadChildFiles,
    toggleFolder,
  };
}

// ==================== File Content Hook ====================

export function useFileContent(client: KbApiClient | null) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFileContent = useCallback(async (fileId: string, _fileName?: string) => {
    if (!client) {
      setError('API 客户端未初始化');
      return;
    }

    setIsLoading(true);
    setError(null);
    setContent(null);

    try {
      // 优先使用 AI 提取通道（适合文本文件）
      const result = await client.getFullFileContent(fileId);
      if (result.ok) {
        setContent(result.value);
      } else {
        setError(result.error);
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const clearContent = useCallback(() => {
    setContent(null);
    setError(null);
  }, []);

  return {
    content,
    isLoading,
    error,
    loadFileContent,
    clearContent,
  };
}

// ==================== Projects Hub Hook ====================

function getProjectEntryId(project: ProjectInfo): string | null {
  const id = project.projectId ?? project.id ?? project.fileId;
  return id === undefined || id === null ? null : String(id);
}

function getProjectEntryName(project: ProjectInfo, id: string): string {
  return (project.name ?? project.projectName ?? project.title ?? String(id)).trim() || String(id);
}

function toProjectEntry(project: ProjectInfo): FileListItem | null {
  const id = getProjectEntryId(project);
  if (!id) return null;
  return {
    id,
    name: getProjectEntryName(project, id),
    type: 1,
    entryKind: 'space',
    createTime: project.createTime,
    updateTime: project.updateTime,
  };
}

/**
 * 加载首页空间/项目列表。
 * - directoryId 为空 → 调 findAllProjects 展示当前用户可见空间
 * - directoryId 非空 → 直接以目录 ID 加载子文件夹
 */
export function useProjectsHub(client: KbApiClient | null, directoryId: string) {
  const [projects, setProjects] = useState<FileListItem[]>([]);
  const [projectsDirFileId, setProjectsDirFileId] = useState<string | null>(null);
  const [directoryName, setDirectoryName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!client) return;

    setIsLoading(true);
    setError(null);
    setProjects([]);
    setProjectsDirFileId(null);
    setDirectoryName(null);

    try {
      if (!directoryId) {
        const projectsResult = await client.findAllProjects({
          nameKey: '',
          bizCode: 'ordinary',
          appCode: 'kz_doc',
        });
        if (!projectsResult.ok) { setError(projectsResult.error); return; }
        setDirectoryName('全部空间');
        setProjects(projectsResult.value.map(toProjectEntry).filter((item): item is FileListItem => item !== null));
        return;
      }

      const childResult = await client.getChildFiles(directoryId);
      if (!childResult.ok) { setError(childResult.error); return; }

      setProjectsDirFileId(directoryId);
      setProjects(childResult.value.map((f) => (f.type === 1 ? { ...f, entryKind: 'folder' } : f)));

      const metaResult = await client.batchGetMeta([directoryId]);
      if (metaResult.ok) {
        const meta = metaResult.value.find((item) => String(item.fileId) === directoryId);
        if (meta?.name) setDirectoryName(meta.name);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [client, directoryId]);

  const loadSpaceProjects = useCallback(async (projectId: string) => {
    if (!client) return;

    setIsLoading(true);
    setError(null);
    setProjects([]);
    setProjectsDirFileId(projectId);
    setDirectoryName(null);

    try {
      const result = await client.getLevel1Folders(projectId);
      if (!result.ok) { setError(result.error); return; }
      setProjects(result.value.filter((f) => f.type === 1).map((f) => ({ ...f, entryKind: 'folder' })));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  return { projects, projectsDirFileId, directoryName, isLoading, error, load, loadSpaceProjects };
}

function summarizeReadme(content: string): string | null {
  const lines = content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !/^#{1,6}\s+/.test(line));
  return lines.join(' ').slice(0, 200) || null;
}

/**
 * 懒加载指定目录下的 README.md 内容摘要（前 200 字符）。
 */
export function useReadmePreview(client: KbApiClient | null, directoryId: string) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!client || !directoryId) {
      setPreview(null);
      setIsLoading(false);
      return;
    }
    const activeClient = client;
    let cancelled = false;
    setIsLoading(true);
    setPreview(null);

    async function loadReadmePreview() {
      try {
        const files = await activeClient.getChildFiles(directoryId);
        if (cancelled || !files.ok) return;

        const readme = files.value.find(
          (f) => f.type !== 1 && /^readme\.md$/i.test(f.name),
        );
        if (!readme) return;

        const downloadInfo = await activeClient.getDownloadInfo(String(readme.id));
        if (cancelled || !downloadInfo.ok) return;

        const downloadUrl = downloadInfo.value.downloadUrl || downloadInfo.value.previewUrl;
        if (!downloadUrl) return;

        const response = await fetch(downloadUrl);
        if (cancelled || !response.ok) return;

        const content = await response.text();
        if (!cancelled) setPreview(summarizeReadme(content));
      } catch {
        // Keep the card fallback when README lookup or download fails.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadReadmePreview();

    return () => { cancelled = true; };
  }, [client, directoryId]);

  return { preview, isLoading };
}

// ==================== Project Hook ====================

export function useProject(client: KbApiClient | null) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPersonalProjectId = useCallback(async () => {
    if (!client) {
      setError('API 客户端未初始化');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await client.getPersonalProjectId();
      if (result.ok) {
        const id = String(result.value);
        setProjectId(id);
        return id;
      } else {
        setError(result.error);
        return null;
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  return {
    projectId,
    isLoading,
    error,
    loadPersonalProjectId,
    setProjectId,
  };
}
