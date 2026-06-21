/**
 * 配置管理
 * 支持通过环境变量或本地存储配置 appKey 和服务器地址
 */

export interface Config {
  serverUrl: string;
  appKey: string;
  projectId?: string;
  projectsPath: string;
}

// 默认配置
const DEFAULT_CONFIG: Config = {
  serverUrl: import.meta.env.VITE_SERVER_URL || 'https://sg-al-cwork-web.mediportal.com.cn/open-api/',
  appKey: import.meta.env.VITE_APP_KEY || '',
  projectId: import.meta.env.VITE_PROJECT_ID,
  projectsPath: import.meta.env.VITE_PROJECTS_PATH || 'Obsidian/projects',
};

// 本地存储 key
const STORAGE_KEY = 'xgkb_explorer_config';

/**
 * 获取配置
 * 优先从本地存储读取，其次使用环境变量，最后使用默认值
 */
export function getConfig(): Config {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load config from localStorage:', e);
  }
  return DEFAULT_CONFIG;
}

/**
 * 保存配置到本地存储
 */
export function saveConfig(config: Partial<Config>): void {
  try {
    const current = getConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save config to localStorage:', e);
  }
}

/**
 * 检查配置是否完整
 */
export function isConfigValid(config?: Config): boolean {
  const cfg = config || getConfig();
  return !!cfg.appKey;
}

/**
 * 清除本地存储的配置
 */
export function clearConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear config from localStorage:', e);
  }
}
