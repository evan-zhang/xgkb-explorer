/**
 * React Hooks for API calls
 */

import { useState, useCallback } from 'react';
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
