/**
 * 配置管理
 * 支持通过环境变量或本地存储配置知识库服务器地址和兼容 Open API AppKey
 */

import { DEFAULT_SERVER_URL } from './types';

export type ApiMode = 'token' | 'open-api';

export interface SpaceEntry {
  id: string;
  name: string;        // empty = resolve from directoryId when possible
  directoryId: string; // new entries should use a concrete folder directoryId
}

export interface Config {
  apiMode: ApiMode;
  serverUrl: string;
  appKey: string;
  previewMode: 'self' | 'kb';
  spaces: SpaceEntry[];
  activeSpaceId: string;
  settingsRevision?: string | null;
}

const DEFAULT_CONFIG: Config = {
  apiMode: 'token',
  serverUrl: import.meta.env.VITE_SERVER_URL || DEFAULT_SERVER_URL,
  appKey: import.meta.env.VITE_APP_KEY || '',
  previewMode: 'self',
  spaces: [],
  activeSpaceId: '',
  settingsRevision: null,
};

const STORAGE_KEY = 'xgkb_explorer_config';
const STARRED_KEY = 'xgkb:starred_projects';

function normalizeSpaceEntry(entry: Partial<SpaceEntry> & {
  spaceId?: unknown;
  path?: unknown;
  rootFileId?: unknown;
}, index: number): SpaceEntry {
  const id = typeof entry.id === 'string' && entry.id.trim()
    ? entry.id
    : `directory-${index + 1}`;

  const directoryId = typeof entry.directoryId === 'string'
    ? entry.directoryId.trim()
    : typeof entry.rootFileId === 'string'
      ? entry.rootFileId.trim()
      : '';

  const rawName = typeof entry.name === 'string' ? entry.name.trim() : '';
  const name = !directoryId && id === 'personal' && rawName === '个人书架'
    ? '全部空间'
    : rawName;

  return {
    id,
    name,
    directoryId,
  };
}

export function getConfig(): Config {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 迁移旧版 projectsPath 字段
      if (parsed.projectsPath && !parsed.spaces) {
        parsed.spaces = [];
        parsed.activeSpaceId = '';
        delete parsed.projectsPath;
      }
      const merged = { ...DEFAULT_CONFIG, ...parsed };
      if (merged.apiMode !== 'token' && merged.apiMode !== 'open-api') {
        merged.apiMode = 'token';
      }
      merged.spaces = Array.isArray(parsed.spaces)
        ? parsed.spaces.map(normalizeSpaceEntry)
        : [];
      if (!merged.activeSpaceId || !merged.spaces.some((space: SpaceEntry) => space.id === merged.activeSpaceId)) {
        merged.activeSpaceId = merged.spaces[0]?.id ?? '';
      }
      merged.settingsRevision = typeof merged.settingsRevision === 'string'
        ? merged.settingsRevision
        : null;
      return merged;
    }
  } catch (e) {
    console.warn('Failed to load config from localStorage:', e);
  }
  return { ...DEFAULT_CONFIG };
}

export function saveConfig(config: Partial<Config>): void {
  try {
    const current = getConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save config to localStorage:', e);
  }
}

export function isConfigValid(): boolean {
  const config = getConfig();
  return config.apiMode === 'token' || !!config.appKey;
}

export function clearConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear config from localStorage:', e);
  }
}

export function getStarredProjectIds(): string[] {
  try {
    const raw = localStorage.getItem(STARRED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.map((value) => String(value)).filter(Boolean))];
  } catch {
    return [];
  }
}

export function saveStarredProjectIds(projectIds: string[]): void {
  try {
    localStorage.setItem(STARRED_KEY, JSON.stringify([...new Set(projectIds.map(String).filter(Boolean))]));
  } catch (e) {
    console.error('Failed to save starred projects to localStorage:', e);
  }
}
