/**
 * 玄关知识库 API 客户端（浏览器版本）
 *
 * UI 层只依赖 KbApiClient 的方法契约；具体鉴权方式由 TokenApiClient
 * 或 OpenApiClient 决定。
 */

import type {
  ApiResult,
  BatchGetContentItem,
  DownloadInfoVO,
  FileListItem,
  FileMeta,
  PreviewTicketVO,
  ProjectInfo,
  ShareUrlVO,
} from './types';
import {
  API_PATHS,
  DEFAULT_OPEN_API_SERVER_URL,
  DEFAULT_TOKEN_SERVER_URL,
} from './types';

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

function stripOpenApiSuffix(value: string): string {
  return value.replace(/\/open-api\/?$/i, '/');
}

export function normalizeTokenServerUrl(serverUrl: string = DEFAULT_TOKEN_SERVER_URL): string {
  const value = serverUrl.trim() || DEFAULT_TOKEN_SERVER_URL;
  return ensureTrailingSlash(stripOpenApiSuffix(value));
}

export function normalizeOpenApiServerUrl(serverUrl: string = DEFAULT_OPEN_API_SERVER_URL): string {
  return `${normalizeTokenServerUrl(serverUrl)}open-api/`;
}

type ProjectListResponse = ProjectInfo[] | {
  data?: ProjectInfo[];
  list?: ProjectInfo[];
  records?: ProjectInfo[];
  rows?: ProjectInfo[];
};

function normalizeProjectList(value: ProjectListResponse | null | undefined): ProjectInfo[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value.records ?? value.list ?? value.rows ?? value.data ?? [];
}

export abstract class KbApiClient {
  private readonly serverUrl: string;

  protected constructor(serverUrl: string) {
    this.serverUrl = ensureTrailingSlash(serverUrl);
  }

  protected abstract getAuthHeaders(): Record<string, string>;

  private async request<T>(
    method: 'GET' | 'POST',
    apiPath: string,
    params?: Record<string, unknown>,
  ): Promise<ApiResult<T>> {
    const baseUrl = this.serverUrl + apiPath;
    let url = baseUrl;
    let body: string | undefined;

    if (method === 'GET' && params) {
      const qs = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
      url = qs ? `${baseUrl}?${qs}` : baseUrl;
    } else if (method === 'POST' && params) {
      body = JSON.stringify(params);
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body,
      });

      const rawText = await response.text();

      if (!response.ok) {
        return {
          ok: false,
          error: `HTTP ${response.status}: ${response.statusText}${rawText ? ` | ${rawText}` : ''}`,
        };
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        return {
          ok: false,
          error: `响应非合法 JSON: ${rawText.slice(0, 200)}`,
        };
      }

      const result = parsed as {
        resultCode: number;
        resultMsg: string;
        data: T;
      };

      if (result.resultCode !== 1) {
        return {
          ok: false,
          error: `API error ${result.resultCode}: ${result.resultMsg}`,
        };
      }

      return { ok: true, value: result.data };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  // ==================== 核心 API ====================

  /** 获取当前登录用户可见的知识库空间 */
  async findAllProjects(params: {
    nameKey?: string;
    bizCode?: string;
    appCode?: string;
  } = {}): Promise<ApiResult<ProjectInfo[]>> {
    const result = await this.request<ProjectListResponse>('GET', API_PATHS.findAllProjects, {
      nameKey: '',
      bizCode: 'ordinary',
      appCode: 'kz_doc',
      ...params,
    });
    if (!result.ok) return result;
    return { ok: true, value: normalizeProjectList(result.value) };
  }

  /** 获取个人知识库空间 ID */
  async getPersonalProjectId(): Promise<ApiResult<string>> {
    const r = await this.request<string>('GET', API_PATHS.getPersonalProjectId);
    if (!r.ok) return r;
    return { ok: true, value: String(r.value) };
  }

  /** 获取一级目录列表 */
  async getLevel1Folders(projectId: string): Promise<ApiResult<FileListItem[]>> {
    return this.request<FileListItem[]>('GET', API_PATHS.getLevel1Folders, { projectId });
  }

  /** 子目录/文件浏览 */
  async getChildFiles(parentId: string, type?: number): Promise<ApiResult<FileListItem[]>> {
    const params: Record<string, unknown> = { parentId };
    if (type !== undefined) params.type = type;
    return this.request<FileListItem[]>('GET', API_PATHS.getChildFiles, params);
  }

  /** 获取文件下载/预览地址 */
  async getDownloadInfo(fileId: string, forceDownload = false): Promise<ApiResult<DownloadInfoVO>> {
    const params: Record<string, unknown> = { fileId, forceDownload };
    return this.request<DownloadInfoVO>('GET', API_PATHS.getDownloadInfo, params);
  }

  /** 读取文件全文（AI 提取通道，适合文本文件） */
  async getFullFileContent(fileId: string): Promise<ApiResult<string>> {
    return this.request<string>('GET', API_PATHS.getFullFileContent, { fileId });
  }

  /** 批量获取多个文件的提纯全文 */
  async batchGetContent(files: { fileId: string }[]): Promise<ApiResult<BatchGetContentItem[]>> {
    return this.request<BatchGetContentItem[]>('POST', API_PATHS.batchGetContent, { files });
  }

  /** 批量元数据 */
  async batchGetMeta(fileIds: string[], projectId?: string): Promise<ApiResult<FileMeta[]>> {
    return this.request<FileMeta[]>('POST', API_PATHS.batchGetMeta, {
      fileIds,
      projectId,
    });
  }

  /** 生成文档预览链接（文档预览服务） */
  async getPreviewTicket(
    fileId: string,
    format: 'md' | 'html',
    title?: string,
  ): Promise<ApiResult<PreviewTicketVO>> {
    return this.request<PreviewTicketVO>('POST', API_PATHS.getPreviewTicket, {
      bizType: 'kb',
      bizId: fileId,
      format,
      title,
    });
  }

  /** 搜索文件 */
  async searchFile(params: {
    projectId: string;
    keyword?: string;
    suffix?: string;
  }): Promise<ApiResult<FileListItem[]>> {
    return this.request<FileListItem[]>('GET', API_PATHS.searchFile, params);
  }

  /** 获取文件/文件夹的分享预览短链 */
  async getShareUrl(fileId: string, source = 'open_api'): Promise<ApiResult<ShareUrlVO>> {
    return this.request<ShareUrlVO>('GET', API_PATHS.getShareUrl, { fileId, source });
  }

  /** 子树扁平列举（含路径字段） */
  async listDescendantFiles(params: {
    rootFileId: string;
    projectId?: string;
    suffix?: string;
    includePath?: boolean;
    includeFolders?: boolean;
  }): Promise<ApiResult<{ files: FileListItem[]; nextCursor?: string | null }>> {
    return this.request('GET', API_PATHS.listDescendantFiles, params);
  }
}

export class TokenApiClient extends KbApiClient {
  private readonly accessToken: string;

  constructor(accessToken: string, serverUrl: string = DEFAULT_TOKEN_SERVER_URL) {
    super(normalizeTokenServerUrl(serverUrl));
    this.accessToken = accessToken;
  }

  protected getAuthHeaders(): Record<string, string> {
    return { 'access-token': this.accessToken };
  }
}

export class OpenApiClient extends KbApiClient {
  private readonly appKey: string;

  constructor(appKey: string, serverUrl: string = DEFAULT_OPEN_API_SERVER_URL) {
    super(normalizeOpenApiServerUrl(serverUrl));
    this.appKey = appKey;
  }

  protected getAuthHeaders(): Record<string, string> {
    return { appKey: this.appKey };
  }
}
