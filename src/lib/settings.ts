import { getConfig, getStarredProjectIds, saveConfig, saveStarredProjectIds } from './config';
import type { SpaceEntry } from './config';

export type PreviewMode = 'self' | 'kb';

export interface UserSettingsV1 {
  version: 1;
  spaces: SpaceEntry[];
  activeSpaceId: string;
  previewMode: PreviewMode;
  starredProjectIds: string[];
}

export interface SettingsEnvelope {
  exists: boolean;
  settings: UserSettingsV1 | null;
  revision: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface SettingsIdentityHeaders {
  corpId?: string | number;
  employeeId?: string | number;
}

export class SettingsConflictError extends Error {
  current: SettingsEnvelope | null;

  constructor(message: string, current: SettingsEnvelope | null) {
    super(message);
    this.name = 'SettingsConflictError';
    this.current = current;
  }
}

const DEFAULT_SETTINGS_API_BASE_URL = `${(import.meta.env.VITE_CWORK_API_BASE_URL || 'https://sg-al-cwork-web.mediportal.com.cn').replace(/\/$/, '')}/document-database/xgkb/v1`;
const SETTINGS_API_BASE_URL = (import.meta.env.VITE_SETTINGS_API_BASE_URL || DEFAULT_SETTINGS_API_BASE_URL).replace(/\/$/, '');

function normalizeSpaceEntry(entry: Partial<SpaceEntry>, index: number): SpaceEntry {
  const directoryId = typeof entry.directoryId === 'string' ? entry.directoryId.trim() : '';
  const id = typeof entry.id === 'string' && entry.id.trim()
    ? entry.id.trim()
    : directoryId
      ? `directory-${directoryId}`
      : `directory-${index + 1}`;
  const name = typeof entry.name === 'string' ? entry.name.trim() : '';
  return { id, name, directoryId };
}

function normalizeSettings(settings: Partial<UserSettingsV1> | null | undefined): UserSettingsV1 {
  const spaces = Array.isArray(settings?.spaces)
    ? settings.spaces.map(normalizeSpaceEntry)
    : [];
  const activeSpaceId = typeof settings?.activeSpaceId === 'string'
    && spaces.some((space) => space.id === settings.activeSpaceId)
    ? settings.activeSpaceId
    : spaces[0]?.id ?? '';
  const previewMode = settings?.previewMode === 'kb' ? 'kb' : 'self';
  const starredProjectIds = Array.isArray(settings?.starredProjectIds)
    ? [...new Set(settings.starredProjectIds.map((value) => String(value)).filter(Boolean))]
    : [];

  return {
    version: 1,
    spaces,
    activeSpaceId,
    previewMode,
    starredProjectIds,
  };
}

function normalizeEnvelope(raw: unknown): SettingsEnvelope {
  const value = raw as Partial<SettingsEnvelope>;
  return {
    exists: Boolean(value.exists),
    settings: value.settings ? normalizeSettings(value.settings) : null,
    revision: typeof value.revision === 'string' ? value.revision : null,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : null,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null,
  };
}

async function requestSettingsApi<T>(
  method: 'GET' | 'PUT',
  path: string,
  accessToken: string,
  identity?: SettingsIdentityHeaders,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
    'access-token': accessToken,
  };
  if (identity?.corpId !== undefined && identity.corpId !== null) {
    headers.corpId = String(identity.corpId);
  }
  if (identity?.employeeId !== undefined && identity.employeeId !== null && String(identity.employeeId).trim()) {
    headers.employeeId = String(identity.employeeId);
  }

  const response = await fetch(`${SETTINGS_API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const rawText = await response.text();
  let parsed: unknown = null;
  if (rawText) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new Error(`Settings API returned non-JSON response: ${rawText.slice(0, 200)}`);
    }
  }

  if (!response.ok) {
    const error = parsed as {
      error?: {
        code?: string;
        message?: string;
        details?: {
          current?: SettingsEnvelope;
        };
      };
    };
    const message = error?.error?.message || `Settings API HTTP ${response.status}`;
    if (response.status === 409) {
      throw new SettingsConflictError(message, error?.error?.details?.current ? normalizeEnvelope(error.error.details.current) : null);
    }
    throw new Error(message);
  }

  return parsed as T;
}

export async function fetchUserSettings(accessToken: string, identity?: SettingsIdentityHeaders): Promise<SettingsEnvelope> {
  const raw = await requestSettingsApi<unknown>('GET', '/settings', accessToken, identity);
  return normalizeEnvelope(raw);
}

export async function putUserSettings(
  accessToken: string,
  settings: UserSettingsV1,
  baseRevision: string | null,
  identity?: SettingsIdentityHeaders,
): Promise<SettingsEnvelope> {
  const raw = await requestSettingsApi<unknown>('PUT', '/settings', accessToken, identity, {
    settings: normalizeSettings(settings),
    baseRevision,
  });
  return normalizeEnvelope(raw);
}

export function getLocalUserSettings(): UserSettingsV1 {
  const config = getConfig();
  return normalizeSettings({
    version: 1,
    spaces: config.spaces,
    activeSpaceId: config.activeSpaceId,
    previewMode: config.previewMode,
    starredProjectIds: getStarredProjectIds(),
  });
}

export function saveSyncedSettings(settings: UserSettingsV1, revision: string | null): UserSettingsV1 {
  const normalized = normalizeSettings(settings);
  saveConfig({
    spaces: normalized.spaces,
    activeSpaceId: normalized.activeSpaceId,
    previewMode: normalized.previewMode,
    settingsRevision: revision,
  });
  saveStarredProjectIds(normalized.starredProjectIds);
  return normalized;
}

export function hasLocalSettingsData(settings = getLocalUserSettings()): boolean {
  return settings.spaces.length > 0
    || settings.activeSpaceId.trim() !== ''
    || settings.previewMode !== 'self'
    || settings.starredProjectIds.length > 0;
}
