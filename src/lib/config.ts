/**
 * 配置管理
 * 支持通过环境变量或本地存储配置 appKey 和服务器地址
 */

import { DEFAULT_SERVER_URL } from './types';

export interface SpaceEntry {
  id: string;
  name: string;
  spaceId: string;  // 空 = 个人空间
  path: string;     // 空 = 根目录
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
  spaceId: '',
  path: '',
};

const DEFAULT_CONFIG: Config = {
  serverUrl: import.meta.env.VITE_SERVER_URL || DEFAULT_SERVER_URL,
  appKey: import.meta.env.VITE_APP_KEY || '',
  previewMode: 'self',
  spaces: [DEFAULT_SPACE],
  activeSpaceId: 'personal',
};

const STORAGE_KEY = 'xgkb_explorer_config';

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
          spaceId: '',
          path: parsed.projectsPath,
        }];
        parsed.activeSpaceId = 'personal';
        delete parsed.projectsPath;
      }
      const merged = { ...DEFAULT_CONFIG, ...parsed };
      if (!merged.spaces?.length) merged.spaces = [DEFAULT_SPACE];
      if (!merged.activeSpaceId) merged.activeSpaceId = merged.spaces[0].id;
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
