/**
 * 配置管理
 * 支持通过环境变量或本地存储配置 appKey 和服务器地址
 */

import { DEFAULT_SERVER_URL } from './types';

export interface SpaceEntry {
  id: string;
  name: string;        // empty = resolve from directoryId when possible
  directoryId: string; // empty = personal root
}

export interface Config {
  serverUrl: string;
  appKey: string;
  previewMode: 'self' | 'kb';
  spaces: SpaceEntry[];
  activeSpaceId: string;
}

const DEFAULT_SPACE: SpaceEntry = {
  id: 'personal',
  name: '个人书架',
  directoryId: '',
};

const DEFAULT_CONFIG: Config = {
  serverUrl: import.meta.env.VITE_SERVER_URL || DEFAULT_SERVER_URL,
  appKey: import.meta.env.VITE_APP_KEY || '',
  previewMode: 'self',
  spaces: [DEFAULT_SPACE],
  activeSpaceId: 'personal',
};

const STORAGE_KEY = 'xgkb_explorer_config';

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

  return {
    id,
    name: typeof entry.name === 'string' ? entry.name.trim() : '',
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
        parsed.spaces = [{
          id: 'personal',
          name: '个人书架',
          directoryId: '',
        }];
        parsed.activeSpaceId = 'personal';
        delete parsed.projectsPath;
      }
      const merged = { ...DEFAULT_CONFIG, ...parsed };
      merged.spaces = Array.isArray(parsed.spaces)
        ? parsed.spaces.map(normalizeSpaceEntry)
        : [DEFAULT_SPACE];
      if (!merged.spaces.length) merged.spaces = [DEFAULT_SPACE];
      if (!merged.activeSpaceId || !merged.spaces.some((space: SpaceEntry) => space.id === merged.activeSpaceId)) {
        merged.activeSpaceId = merged.spaces[0].id;
      }
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
  return !!getConfig().appKey;
}

export function clearConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear config from localStorage:', e);
  }
}
