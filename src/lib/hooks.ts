/**
 * React Hooks for API calls
 */

import { useState, useCallback, useEffect } from 'react';
import { KbApiClient } from './api';
import type { FileListItem } from '../lib/types';
import { getConfig, saveConfig } from './config';

// ==================== API Client Hook ====================

export function useApiClient() {
  const [client, setClient] = useState<KbApiClient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initClient = useCallback((appKey: string, serverUrl?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const config = getConfig();
      const newClient = new KbApiClient(
        serverUrl || config.serverUrl,
        appKey,
      );
      setClient(newClient);
      saveConfig({ appKey, serverUrl });
      setIsLoading(false);
      return true;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setError(errorMsg);
      setIsLoading(false);
      return false;
    }
  }, []);

  const loadSavedClient = useCallback(() => {
    const config = getConfig();
    if (config.appKey) {
      return initClient(config.appKey, config.serverUrl);
    }
    return false;
  }, [initClient]);

  return { client, isLoading, error, initClient, loadSavedClient };
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
 * 解析 projectsPath（如 "Obsidian/projects"）为目标目录的 fileId，
 * 并加载该目录下的一级子项（即项目列表）。
 */
export function useProjectsHub(client: KbApiClient | null, projectId: string | null, projectsPath: string) {
  const [projects, setProjects] = useState<FileListItem[]>([]);
  const [projectsDirFileId, setProjectsDirFileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!client || !projectId || !projectsPath) return;

    setIsLoading(true);
    setError(null);
    setProjects([]);
    setProjectsDirFileId(null);

    try {
      const segments = projectsPath.split('/').filter(Boolean);

      // 逐段导航：先加载一级目录，再逐层向下
      let currentChildren: FileListItem[] = [];
      const level1Result = await client.getLevel1Folders(projectId);
      if (!level1Result.ok) { setError(level1Result.error); return; }
      currentChildren = level1Result.value;

      let targetFileId: string | null = null;
      for (const segment of segments) {
        const match = currentChildren.find(
          (f) => f.name === segment && f.type === 1,
        );
        if (!match) {
          setError(`找不到目录：${segment}（路径：${projectsPath}）`);
          return;
        }
        targetFileId = String(match.id);
        const childResult = await client.getChildFiles(targetFileId);
        if (!childResult.ok) { setError(childResult.error); return; }
        currentChildren = childResult.value;
      }

      if (!targetFileId) { setError('路径为空'); return; }

      setProjectsDirFileId(targetFileId);
      // currentChildren 现在是 projectsPath 目录下的直接子项
      setProjects(currentChildren.filter((f) => f.type === 1));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [client, projectId, projectsPath]);

  return { projects, projectsDirFileId, isLoading, error, load };
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
