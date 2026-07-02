export type DirectoryShareView = 'bookshelf' | 'project' | 'file';

export interface DirectoryShareParams {
  directoryId: string;
  name: string;
  token: string;
  serverUrl?: string;
  view?: DirectoryShareView;
  itemId?: string;
  itemName?: string;
}

const SHARE_PREFIX = '#/share';

export function buildDirectoryShareUrl(params: DirectoryShareParams): string {
  const search = new URLSearchParams();
  search.set('directoryId', params.directoryId);
  search.set('name', params.name);
  search.set('token', params.token);
  if (params.serverUrl) search.set('serverUrl', params.serverUrl);
  if (params.view) search.set('view', params.view);
  if (params.itemId) search.set('itemId', params.itemId);
  if (params.itemName) search.set('itemName', params.itemName);

  return `${window.location.origin}${window.location.pathname}${SHARE_PREFIX}?${search.toString()}`;
}

export function parseDirectoryShareHash(hash = window.location.hash): DirectoryShareParams | null {
  if (!hash.startsWith(SHARE_PREFIX)) return null;

  const queryIndex = hash.indexOf('?');
  const query = queryIndex >= 0 ? hash.slice(queryIndex + 1) : '';
  const search = new URLSearchParams(query);
  const directoryId = search.get('directoryId')?.trim() ?? '';
  const token = search.get('token')?.trim() ?? '';
  const name = search.get('name')?.trim() || directoryId;
  const serverUrl = search.get('serverUrl')?.trim() || undefined;
  const itemId = search.get('itemId')?.trim() || undefined;
  const itemName = search.get('itemName')?.trim() || undefined;
  const rawView = search.get('view')?.trim();
  const view: DirectoryShareView = rawView === 'bookshelf' || rawView === 'project' || rawView === 'file'
    ? rawView
    : 'project';

  if (!directoryId || !token) return null;
  return { directoryId, name, token, serverUrl, view, itemId, itemName };
}
