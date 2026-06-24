// API 类型定义（简化版，适配浏览器环境）

export interface ApiOk<T> {
  ok: true;
  value: T;
}

export interface ApiErr {
  ok: false;
  error: string;
}

export type ApiResult<T> = ApiOk<T> | ApiErr;

// 文件/目录项类型
export interface FileListItem {
  id: string | number;
  name: string;
  type: number; // 1 = 文件夹，其他 = 文件
  parentId?: string | number | null;
  suffix?: string;
  size?: number;
  hasChild?: boolean;
  createTime?: number;
  updateTime?: number;
}

// 文件元数据
export interface FileMeta {
  fileId: string | number;
  name: string;
  createTime?: number;
  updateTime?: number;
  parentId?: string | number | null;
  deleted?: boolean;
  type?: number;
  relativePath?: string;
  contentHash?: string | null;
}

// 文件下载信息
export interface DownloadInfoVO {
  fileId: string | number;
  downloadUrl?: string;
  previewUrl?: string;
  fileName?: string;
  suffix?: string;
  size?: number;
}

// 批量获取文件内容
export interface BatchGetContentItem {
  fileId: string | number;
  status?: string;
  content?: string;
}

// 文档预览凭证
export interface PreviewTicketVO {
  previewUrl: string;
}

// 分享短链
export interface ShareUrlVO {
  shareUrl: string;
}

// API 路径常量
export const API_PATHS = {
  getChildFiles: 'document-database/file/getChildFiles',
  getLevel1Folders: 'document-database/file/getLevel1Folders',
  getDownloadInfo: 'document-database/file/getDownloadInfo',
  getFullFileContent: 'document-database/file/getFullFileContent',
  batchGetContent: 'document-database/ai/batchGetContent',
  batchGetMeta: 'document-database/file/batchGetMeta',
  getPersonalProjectId: 'document-database/project/personal/getProjectId',
  searchFile: 'document-database/file/searchFile',
  listDescendantFiles: 'document-database/file/listDescendantFiles',
  getPreviewTicket: 'doc-preview/api/preview/ticket',
  getShareUrl: 'document-database/share/getShareUrl',
} as const;

// 默认服务器地址
export const DEFAULT_TOKEN_SERVER_URL = 'https://sg-al-cwork-web.mediportal.com.cn/';
export const DEFAULT_OPEN_API_SERVER_URL = `${DEFAULT_TOKEN_SERVER_URL}open-api/`;
export const DEFAULT_SERVER_URL = DEFAULT_TOKEN_SERVER_URL;
