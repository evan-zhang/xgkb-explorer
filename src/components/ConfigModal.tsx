/**
 * 配置设置模态框
 * 包含：连接设置 / 预览方式 / 空间目录管理
 */

import { useState, useEffect } from 'react';
import { X, Key, Globe, Check, AlertCircle, Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { getConfig, saveConfig } from '../lib/config';
import type { SpaceEntry } from '../lib/config';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appKey: string, serverUrl: string) => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

interface EntryFormState {
  isNew: boolean;
  id: string;
  name: string;
  spaceId: string;
  path: string;
}

export function ConfigModal({ isOpen, onClose, onSave }: ConfigModalProps) {
  const [appKey, setAppKey] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [previewMode, setPreviewMode] = useState<'self' | 'kb'>('self');
  const [spaces, setSpaces] = useState<SpaceEntry[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [entryForm, setEntryForm] = useState<EntryFormState | null>(null);

  useEffect(() => {
    if (isOpen) {
      const config = getConfig();
      setAppKey(config.appKey || '');
      setServerUrl(config.serverUrl || '');
      setPreviewMode(config.previewMode || 'self');
      setSpaces(config.spaces?.length ? config.spaces : [{ id: 'personal', name: '个人书架', spaceId: '', path: '' }]);
      setError(null);
      setSuccess(false);
      setEntryForm(null);
    }
  }, [isOpen]);

  const openAddForm = () => {
    setEntryForm({ isNew: true, id: generateId(), name: '', spaceId: '', path: '' });
  };

  const openEditForm = (entry: SpaceEntry) => {
    setEntryForm({ isNew: false, id: entry.id, name: entry.name, spaceId: entry.spaceId, path: entry.path });
  };

  const cancelEntryForm = () => setEntryForm(null);

  const saveEntry = () => {
    if (!entryForm) return;
    const name = entryForm.name.trim() || (entryForm.spaceId ? `空间 ${entryForm.spaceId}` : '个人书架');
    const entry: SpaceEntry = {
      id: entryForm.id,
      name,
      spaceId: entryForm.spaceId.trim(),
      path: entryForm.path.trim(),
    };
    if (entryForm.isNew) {
      setSpaces((prev) => [...prev, entry]);
    } else {
      setSpaces((prev) => prev.map((s) => s.id === entry.id ? entry : s));
    }
    setEntryForm(null);
  };

  const deleteEntry = (id: string) => {
    setSpaces((prev) => {
      const next = prev.filter((s) => s.id !== id);
      return next.length ? next : prev; // 至少保留一条
    });
  };

  const moveEntry = (id: string, dir: -1 | 1) => {
    setSpaces((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const validateAndSave = async () => {
    setError(null);
    setSuccess(false);
    if (!appKey.trim()) { setError('请输入 App Key'); return; }
    if (!serverUrl.trim()) { setError('请输入服务器地址'); return; }
    try { new URL(serverUrl); } catch { setError('服务器地址格式不正确'); return; }

    setIsValidating(true);
    try {
      // 保存空间和预览模式到 localStorage
      saveConfig({ previewMode, spaces });
      await onSave(appKey.trim(), serverUrl.trim());
      setSuccess(true);
      setTimeout(onClose, 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsValidating(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = 'w-full px-3 py-2 border border-[#DCDCD6] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';
  const labelCls = 'block text-xs font-medium text-[#4B5563] mb-1.5 uppercase tracking-wide';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECECE6] flex-shrink-0">
          <h2 style={{ fontFamily: 'Georgia, "Noto Serif SC", serif', fontSize: 18, fontWeight: 600, color: '#1A1A1A' }}>配置设置</h2>
          <button onClick={onClose} className="flex items-center justify-center hover:bg-[#F0EFEA] rounded-lg transition-colors" style={{ width: 32, height: 32, color: '#6B7280' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 内容区（可滚动） */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* ── 连接 ── */}
          <section>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.08em', marginBottom: 12, textTransform: 'uppercase' }}>连接</p>
            <div className="space-y-3">
              <div>
                <label className={labelCls}><Key className="w-3 h-3 inline mr-1" />App Key</label>
                <input
                  type="password"
                  value={appKey}
                  onChange={(e) => setAppKey(e.target.value)}
                  placeholder="输入玄关知识库 App Key"
                  className={inputCls}
                  disabled={isValidating}
                />
              </div>
              <div>
                <label className={labelCls}><Globe className="w-3 h-3 inline mr-1" />服务器地址</label>
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="https://..."
                  className={inputCls}
                  disabled={isValidating}
                />
              </div>
            </div>
          </section>

          {/* ── 文件预览 ── */}
          <section>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.08em', marginBottom: 12, textTransform: 'uppercase' }}>文件预览</p>
            <div className="flex gap-2">
              {(['self', 'kb'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPreviewMode(mode)}
                  className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all"
                  style={previewMode === mode
                    ? { background: '#1A1A1A', color: '#FFFFFF', border: '1px solid #1A1A1A' }
                    : { background: '#FAFAF7', color: '#4B5563', border: '1px solid #DCDCD6' }
                  }
                >
                  {mode === 'self' ? '自渲染' : 'KB 预览服务'}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>
              {previewMode === 'self'
                ? '使用内置渲染器（Markdown/Mermaid/代码高亮），无需依赖外部服务'
                : '通过玄关知识库预览服务渲染，支持更多文档格式'}
            </p>
          </section>

          {/* ── 空间目录 ── */}
          <section>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.08em', marginBottom: 12, textTransform: 'uppercase' }}>空间目录</p>

            <div className="space-y-2">
              {spaces.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="rounded-xl border px-4 py-3"
                  style={{ borderColor: entryForm?.id === entry.id && !entryForm.isNew ? '#2563EB' : '#E8E8E5', background: '#FAFAF7' }}
                >
                  {entryForm && !entryForm.isNew && entryForm.id === entry.id ? (
                    <EntryFormFields form={entryForm} onChange={setEntryForm} onSave={saveEntry} onCancel={cancelEntryForm} />
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{entry.name}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                          {entry.spaceId ? `空间 ${entry.spaceId}` : '个人空间'}
                          {' / '}
                          {entry.path || '根目录'}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button onClick={() => moveEntry(entry.id, -1)} disabled={idx === 0} title="上移" className="p-1.5 rounded-md hover:bg-[#ECECE6] transition-colors disabled:opacity-30">
                          <ChevronUp className="w-3.5 h-3.5" style={{ color: '#6B7280' }} />
                        </button>
                        <button onClick={() => moveEntry(entry.id, 1)} disabled={idx === spaces.length - 1} title="下移" className="p-1.5 rounded-md hover:bg-[#ECECE6] transition-colors disabled:opacity-30">
                          <ChevronDown className="w-3.5 h-3.5" style={{ color: '#6B7280' }} />
                        </button>
                        <button onClick={() => openEditForm(entry)} title="编辑" className="p-1.5 rounded-md hover:bg-[#ECECE6] transition-colors">
                          <Pencil className="w-3.5 h-3.5" style={{ color: '#6B7280' }} />
                        </button>
                        <button onClick={() => deleteEntry(entry.id)} title="删除" disabled={spaces.length <= 1} className="p-1.5 rounded-md hover:bg-red-50 transition-colors disabled:opacity-30">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* 新增表单 */}
              {entryForm?.isNew && (
                <div className="rounded-xl border px-4 py-3" style={{ borderColor: '#2563EB', background: '#F0F7FF' }}>
                  <EntryFormFields form={entryForm} onChange={setEntryForm} onSave={saveEntry} onCancel={cancelEntryForm} />
                </div>
              )}

              {/* 添加按钮 */}
              {!entryForm && (
                <button
                  onClick={openAddForm}
                  className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors hover:bg-[#F0EFEA]"
                  style={{ border: '1.5px dashed #D0D0CA', color: '#6B7280' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  添加空间
                </button>
              )}
            </div>
          </section>

          {/* 状态消息 */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>配置已保存</span>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#ECECE6] flex-shrink-0">
          <button onClick={onClose} disabled={isValidating} className="px-4 py-2 text-sm rounded-lg hover:bg-[#F0EFEA] transition-colors" style={{ color: '#6B7280' }}>
            取消
          </button>
          <button
            onClick={validateAndSave}
            disabled={isValidating}
            className="px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            style={{ background: '#1A1A1A', color: '#FFFFFF' }}
          >
            {isValidating ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />验证中...</>
            ) : (
              <><Check className="w-4 h-4" />保存配置</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 内联表单组件 ──────────────────────────────────────────────────────────────

function EntryFormFields({
  form,
  onChange,
  onSave,
  onCancel,
}: {
  form: EntryFormState;
  onChange: (f: EntryFormState) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const inputCls = 'w-full px-2.5 py-1.5 border border-[#DCDCD6] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors';

  return (
    <div className="space-y-2.5">
      <div>
        <label className="block text-xs text-[#6B7280] mb-1">名称</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          placeholder="如：个人书架、医疗知识库"
          className={inputCls}
          autoFocus
        />
      </div>
      <div>
        <label className="block text-xs text-[#6B7280] mb-1">空间 ID <span style={{ color: '#9CA3AF' }}>（留空 = 个人空间）</span></label>
        <input
          type="text"
          value={form.spaceId}
          onChange={(e) => onChange({ ...form, spaceId: e.target.value })}
          placeholder="知识库空间 ID"
          className={inputCls}
        />
      </div>
      <div>
        <label className="block text-xs text-[#6B7280] mb-1">目录路径 <span style={{ color: '#9CA3AF' }}>（留空 = 根目录）</span></label>
        <input
          type="text"
          value={form.path}
          onChange={(e) => onChange({ ...form, path: e.target.value })}
          placeholder="如：Obsidian/projects"
          className={inputCls}
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-3 py-1.5 text-xs rounded-lg hover:bg-[#ECECE6] transition-colors" style={{ color: '#6B7280' }}>取消</button>
        <button onClick={onSave} className="px-3 py-1.5 text-xs rounded-lg transition-colors" style={{ background: '#1A1A1A', color: '#FFFFFF' }}>确认</button>
      </div>
    </div>
  );
}
