/**
 * React Hooks for API calls
 */

import { useState, useCallback, useEffect } from 'react';
import { OpenApiClient, TokenApiClient } from './api';
import type { KbApiClient } from './api';
import type { FileListItem } from '../lib/types';
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
    if (config.apiMode === 'open-api' && config.appKey) {
      return initOpenApiClient(config.appKey, config.serverUrl, false);
    }
    if (accessToken) {
      return initTokenClient(accessToken, config.serverUrl);
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

/**
 * 加载配置目录下的一级子目录作为"项目列表"。
 * - directoryId 为空 → 展示个人空间根目录
 * - directoryId 非空 → 直接以目录 ID 加载子项
 */
export function useProjectsHub(
  client: KbApiClient | null,
  personalProjectId: string | null,
  directoryId: string,
) {
  const [projects, setProjects] = useState<FileListItem[]>([]);
  const [projectsDirFileId, setProjectsDirFileId] = useState<string | null>(null);
  const [directoryName, setDirectoryName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!client) return;
    if (!directoryId && !personalProjectId) return;

    setIsLoading(true);
    setError(null);
    setProjects([]);
    setProjectsDirFileId(null);
    setDirectoryName(null);

    try {
      if (!directoryId) {
        const level1Result = await client.getLevel1Folders(personalProjectId!);
        if (!level1Result.ok) { setError(level1Result.error); return; }
        setProjectsDirFileId(personalProjectId);
        setDirectoryName('个人书架');
        setProjects(level1Result.value.filter((f) => f.type === 1));
        return;
      }

      const childResult = await client.getChildFiles(directoryId);
      if (!childResult.ok) { setError(childResult.error); return; }

      setProjectsDirFileId(directoryId);
      setProjects(childResult.value.filter((f) => f.type === 1));

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
  }, [client, personalProjectId, directoryId]);

  return { projects, projectsDirFileId, directoryName, isLoading, error, load };
}

/**
 * 懒加载指定项目目录下的 README.md 或 index.md 内容摘要（前 200 字符）。
 */
export function useReadmePreview(client: KbApiClient | null, projectFileId: string) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!client || !projectFileId) return;
    let cancelled = false;
    setIsLoading(true);
    setPreview(null);

    client.getChildFiles(projectFileId).then(async (result) => {
      if (cancelled || !result.ok) return;
      const readme = result.value.find(
        (f) => f.type !== 1 && /^(readme|index)\.(md|markdown)$/i.test(f.name),
      );
      if (!readme) { setIsLoading(false); return; }

      const content = await client.getFullFileContent(String(readme.id));
      if (cancelled) return;
      if (content.ok && content.value) {
        // 去掉标题行和空行，取有效内容
        const lines = content.value.split('\n').filter((l) => l.trim() && !l.startsWith('#'));
        setPreview(lines.join(' ').slice(0, 200) || null);
      }
      setIsLoading(false);
    }).catch(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [client, projectFileId]);

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
