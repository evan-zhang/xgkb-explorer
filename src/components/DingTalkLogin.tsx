import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Building2, Layers, QrCode, Smartphone, AlertCircle } from 'lucide-react';
import {
  buildDingTalkAuthUrl,
  exchangeDingTalkCode,
  fetchCworkCorps,
  loadDingTalkSdk,
  type CworkCorp,
  type DingTalkLoginResult,
} from '../lib/auth';

interface DingTalkLoginProps {
  onLoginSuccess: (result: DingTalkLoginResult) => void;
}

type LoginMode = 'launch' | 'scan';

export function DingTalkLogin({ onLoginSuccess }: DingTalkLoginProps) {
  const [corps, setCorps] = useState<CworkCorp[]>([]);
  const [selectedCorpId, setSelectedCorpId] = useState<string>('');
  const [mode, setMode] = useState<LoginMode>('launch');
  const [isLoading, setIsLoading] = useState(false);
  const [isQrReady, setIsQrReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const qrRequestIdRef = useRef(0);

  const selectedCorp = useMemo(
    () => corps.find((corp) => String(corp.id) === selectedCorpId),
    [corps, selectedCorpId],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadCorps() {
      setIsLoading(true);
      setError(null);
      try {
        const list = await fetchCworkCorps();
        if (cancelled) return;
        setCorps(list);
        if (list.length === 0) {
          setError('当前应用没有可用企业');
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadCorps();
    return () => { cancelled = true; };
  }, []);

  const launchLogin = useCallback(async () => {
    if (!selectedCorp?.dingCorpId) {
      setError('请选择企业');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const authUrl = await buildDingTalkAuthUrl(selectedCorp.dingCorpId, 'launch');
      if (window.top) {
        window.top.location.href = authUrl;
      } else {
        window.location.href = authUrl;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setIsLoading(false);
    }
  }, [selectedCorp]);

  const initQrLogin = useCallback(async () => {
    if (!selectedCorp?.dingCorpId) {
      setError('请选择企业');
      return;
    }

    const requestId = qrRequestIdRef.current + 1;
    qrRequestIdRef.current = requestId;
    setIsLoading(true);
    setIsQrReady(true);
    setError(null);

    window.setTimeout(async () => {
      try {
        const container = document.getElementById('qr-container');
        if (!container || requestId !== qrRequestIdRef.current) return;

        const authUrl = await buildDingTalkAuthUrl(selectedCorp.dingCorpId, 'scan');
        const url = new URL(authUrl);
        await loadDingTalkSdk();
        if (requestId !== qrRequestIdRef.current) return;

        window.DTFrameLogin?.(
          { id: 'qr-container', width: 280, height: 280 },
          {
            redirect_uri: encodeURIComponent(url.searchParams.get('redirect_uri') || ''),
            client_id: url.searchParams.get('client_id') || '',
            response_type: 'code',
            state: url.searchParams.get('state') || '',
            prompt: 'consent',
            scope: 'openid corpid',
            org_type: 'company',
            corpId: selectedCorp.dingCorpId,
          },
          async (result) => {
            try {
              const loginResult = await exchangeDingTalkCode(result.authCode, selectedCorp.dingCorpId);
              onLoginSuccess(loginResult);
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e));
            }
          },
          (errorMsg) => {
            setError(`扫码失败：${errorMsg}`);
            setIsQrReady(false);
          },
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setIsQrReady(false);
      } finally {
        setIsLoading(false);
      }
    }, 0);
  }, [onLoginSuccess, selectedCorp]);

  useEffect(() => {
    if (mode !== 'scan') {
      qrRequestIdRef.current += 1;
      setIsQrReady(false);
      return;
    }
    if (selectedCorp) initQrLogin();
  }, [initQrLogin, mode, selectedCorp]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4" style={{ background: 'radial-gradient(circle at 50% 50%, #eff6ff 0%, #f8fafc 100%)' }}>
      <div className="w-full max-w-[400px] bg-white" style={{ borderRadius: 24, padding: '32px 36px', boxShadow: '0 20px 50px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-3 mb-7">
          <div className="flex items-center justify-center flex-shrink-0" style={{ width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff' }}>
            <Layers className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold truncate" style={{ fontSize: 20, color: '#111827' }}>玄关知识库</h1>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.4 }}>请选择企业并通过钉钉授权登录</p>
          </div>
        </div>

        <div className="mb-5">
          <label className="block mb-2 font-semibold" style={{ fontSize: 13, color: '#4b5563' }}>选择企业</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
            <select
              value={selectedCorpId}
              onChange={(e) => setSelectedCorpId(e.target.value)}
              className="w-full bg-white focus:outline-none focus:border-[#3b82f6]"
              style={{ padding: '11px 14px 11px 36px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, color: '#111827' }}
              disabled={isLoading && corps.length === 0}
            >
              <option value="" disabled>{corps.length === 0 ? '暂无企业' : '请选择企业'}</option>
              {corps.map((corp) => (
                <option key={String(corp.id)} value={String(corp.id)}>{corp.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-5">
          <label className="block mb-2 font-medium" style={{ fontSize: 14, color: '#374151' }}>登录方式</label>
          <div className="grid grid-cols-2 gap-1 p-1" style={{ background: '#f3f4f6', borderRadius: 8 }}>
            <button
              type="button"
              onClick={() => setMode('launch')}
              className="flex items-center justify-center gap-1.5 transition-colors"
              style={mode === 'launch'
                ? { padding: '9px 8px', borderRadius: 6, background: '#fff', color: '#3b82f6', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', fontSize: 14, fontWeight: 600 }
                : { padding: '9px 8px', borderRadius: 6, color: '#6b7280', fontSize: 14, fontWeight: 500 }}
            >
              <Smartphone className="w-4 h-4" />
              拉起客户端
            </button>
            <button
              type="button"
              onClick={() => setMode('scan')}
              className="flex items-center justify-center gap-1.5 transition-colors"
              style={mode === 'scan'
                ? { padding: '9px 8px', borderRadius: 6, background: '#fff', color: '#3b82f6', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', fontSize: 14, fontWeight: 600 }
                : { padding: '9px 8px', borderRadius: 6, color: '#6b7280', fontSize: 14, fontWeight: 500 }}
            >
              <QrCode className="w-4 h-4" />
              扫码登录
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 mb-4 p-3 rounded-lg" style={{ background: '#fef2f2', color: '#dc2626', fontSize: 13 }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {mode === 'launch' ? (
          <>
            <button
              type="button"
              onClick={launchLogin}
              disabled={!selectedCorp || isLoading}
              className="w-full flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ padding: 13, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 600, boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}
            >
              {isLoading ? '正在拉起钉钉...' : '发起钉钉登录'}
              <ArrowRight className="w-[18px] h-[18px]" />
            </button>
            <p className="text-center mt-3" style={{ fontSize: 12, color: '#9ca3af' }}>点击后使用钉钉 App 授权登录</p>
          </>
        ) : (
          <div className="mt-6 p-6 text-center" style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12 }}>
            <div className="mx-auto mb-4 bg-white flex items-center justify-center overflow-hidden" style={{ width: 280, height: 280, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              {isQrReady ? <div id="qr-container" /> : <QrCode className="w-14 h-14" style={{ color: '#9ca3af' }} />}
            </div>
            <p style={{ fontSize: 13, color: '#6b7280' }}>{isLoading ? '正在生成二维码...' : '请使用钉钉手机版扫码'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
