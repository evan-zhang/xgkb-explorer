export interface CworkCorp {
  id: string | number;
  name: string;
  dingCorpId: string;
}

export interface DingTalkUser {
  id: string | number;
  name: string;
  avatar?: string;
}

export interface DingTalkLoginResult {
  xgToken: string;
  corpId: string | number;
  user: DingTalkUser;
}

export interface AuthSession extends DingTalkLoginResult {
  loginAt: number;
}

type CworkResponse<T> = {
  resultCode: number;
  resultMsg?: string;
  data: T;
};

declare global {
  interface Window {
    DTFrameLogin?: (
      container: { id: string; width: number; height: number },
      params: Record<string, string>,
      onSuccess: (result: { authCode: string }) => void,
      onError: (errorMsg: string) => void,
    ) => void;
  }
}

const AUTH_STORAGE_KEY = 'xgkb_auth_session';
const TOKEN_STORAGE_KEY = 'xg_token';
const CORP_STORAGE_KEY = 'corp_id';
const USER_STORAGE_KEY = 'user';
const AUTH_CALLBACK_VIEW = 'auth-callback';
const DINGTALK_SDK_URL = 'https://g.alicdn.com/dingding/h5-dingtalk-login/0.21.0/ddlogin.js';

const CWORK_API_BASE_URL = (import.meta.env.VITE_CWORK_API_BASE_URL || 'https://cwork-web.mediportal.com.cn').replace(/\/$/, '');
const CWORK_APP_CODE = import.meta.env.VITE_CWORK_APP_CODE || '';

function assertCworkAppCode() {
  if (!CWORK_APP_CODE) {
    throw new Error('缺少 VITE_CWORK_APP_CODE，请先在 .env.local 中配置 Cwork 应用编码');
  }
}

async function requestCwork<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const rawText = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}${rawText ? ` | ${rawText}` : ''}`);
  }

  const parsed = JSON.parse(rawText) as CworkResponse<T>;
  if (parsed.resultCode !== 1) {
    throw new Error(parsed.resultMsg || `Cwork API error ${parsed.resultCode}`);
  }

  return parsed.data;
}

export function getAuthSession(): AuthSession | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as AuthSession;

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const corpId = localStorage.getItem(CORP_STORAGE_KEY);
    const userRaw = localStorage.getItem(USER_STORAGE_KEY);
    if (!token || !corpId || !userRaw) return null;

    return {
      xgToken: token,
      corpId,
      user: JSON.parse(userRaw) as DingTalkUser,
      loginAt: Date.now(),
    };
  } catch {
    return null;
  }
}

export function saveAuthSession(result: DingTalkLoginResult): AuthSession {
  const session: AuthSession = { ...result, loginAt: Date.now() };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  localStorage.setItem(TOKEN_STORAGE_KEY, result.xgToken);
  localStorage.setItem(CORP_STORAGE_KEY, String(result.corpId));
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
  return session;
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(CORP_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

export async function fetchCworkCorps(): Promise<CworkCorp[]> {
  assertCworkAppCode();
  const url = `${CWORK_API_BASE_URL}/user/company/nologin/getListByAppCode?appCode=${encodeURIComponent(CWORK_APP_CODE)}`;
  return requestCwork<CworkCorp[]>(url, { method: 'POST' });
}

async function fetchDingTalkAppKey(dingCorpId: string): Promise<string> {
  assertCworkAppCode();
  const url = `${CWORK_API_BASE_URL}/user/login/config/corp/${encodeURIComponent(dingCorpId)}?appCode=${encodeURIComponent(CWORK_APP_CODE)}`;
  const data = await requestCwork<string[]>(url, { method: 'GET' });
  const appKey = data[2];
  if (!appKey) throw new Error('钉钉配置缺少 appKey');
  return appKey;
}

function getCurrentDingTalkCallbackUrl() {
  const basePath = window.location.pathname.replace(/\/$/, '');
  return `${window.location.origin}${basePath}/?view=${AUTH_CALLBACK_VIEW}`;
}

function parseDingTalkState(state?: string | null) {
  const parts = String(state || '').split(':');
  if (parts[0] !== 'corp' || parts.length < 2) {
    return { dingCorpId: '' };
  }

  let dingCorpId = parts[1] || '';
  try {
    dingCorpId = decodeURIComponent(dingCorpId);
  } catch {
    // Keep the raw value for old callback states.
  }

  return { dingCorpId };
}

export function getDingTalkRedirectUrl() {
  return getCurrentDingTalkCallbackUrl();
}

export async function buildDingTalkAuthUrl(dingCorpId: string, mode: 'launch' | 'scan') {
  const appKey = await fetchDingTalkAppKey(dingCorpId);
  const redirectUrl = getDingTalkRedirectUrl();
  const params = new URLSearchParams({
    client_id: appKey,
    redirect_uri: redirectUrl,
    response_type: 'code',
    scope: 'openid corpid',
    state: `corp:${encodeURIComponent(dingCorpId)}:${mode}`,
    corpId: dingCorpId,
    prompt: 'consent',
  });

  return `https://login.dingtalk.com/oauth2/auth?${params.toString()}`;
}

export async function exchangeDingTalkCode(code: string, dingCorpId: string): Promise<DingTalkLoginResult> {
  assertCworkAppCode();
  const url = `${CWORK_API_BASE_URL}/user/login/dingscan/${encodeURIComponent(CWORK_APP_CODE)}/${encodeURIComponent(dingCorpId)}?tempAuthCode=${encodeURIComponent(code)}`;
  const data = await requestCwork<{
    xgToken: string;
    empId: string | number;
    personId?: string | number;
    corpId: string | number;
    userName: string;
    avatar?: string;
  }>(url, { method: 'GET' });

  return {
    xgToken: data.xgToken,
    corpId: data.corpId,
    user: {
      id: data.empId || data.personId || '',
      name: data.userName,
      avatar: data.avatar,
    },
  };
}

export function parseDingTalkCallback(search: string) {
  const params = new URLSearchParams(search);
  if (params.get('view') !== AUTH_CALLBACK_VIEW) return null;

  const code = params.get('code');
  const state = params.get('state');
  const { dingCorpId } = parseDingTalkState(state);
  if (!code || !dingCorpId) {
    throw new Error('钉钉登录回调缺少 code 或 corpId');
  }

  return { code, dingCorpId };
}

export function cleanDingTalkCallbackUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('view');
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
}

export async function loadDingTalkSdk() {
  if (window.DTFrameLogin) return;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${DINGTALK_SDK_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('钉钉扫码 SDK 加载失败')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = DINGTALK_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('钉钉扫码 SDK 加载失败'));
    document.head.appendChild(script);
  });

  if (!window.DTFrameLogin) {
    throw new Error('钉钉扫码 SDK 未注册 DTFrameLogin');
  }
}
