/**
 * 配置设置模态框
 * 用于设置 appKey 和服务器地址
 */

import { useState, useEffect } from 'react';
import { X, Key, Globe, FolderOpen, Check, AlertCircle } from 'lucide-react';
import { getConfig } from '../lib/config';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appKey: string, serverUrl: string, projectsPath: string) => void;
}

export function ConfigModal({ isOpen, onClose, onSave }: ConfigModalProps) {
  const [appKey, setAppKey] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [projectsPath, setProjectsPath] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 加载已保存的配置
  useEffect(() => {
    if (isOpen) {
      const config = getConfig();
      setAppKey(config.appKey || '');
      setServerUrl(config.serverUrl || 'https://sg-al-cwork-web.mediportal.com.cn/open-api/');
      setProjectsPath(config.projectsPath || 'Obsidian/projects');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  // 验证配置
  const validateAndSave = async () => {
    setError(null);
    setSuccess(false);

    if (!appKey.trim()) {
      setError('请输入 App Key');
      return;
    }

    if (!serverUrl.trim()) {
      setError('请输入服务器地址');
      return;
    }

    // 验证 URL 格式
    try {
      new URL(serverUrl);
    } catch {
      setError('服务器地址格式不正确');
      return;
    }

    setIsValidating(true);

    // 调用保存回调
    try {
      await onSave(appKey.trim(), serverUrl.trim(), projectsPath.trim());
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setError(errorMsg);
    } finally {
      setIsValidating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">配置设置</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="px-6 py-4 space-y-4">
          {/* App Key 输入 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              <Key className="w-4 h-4 inline mr-1" />
              App Key
            </label>
            <input
              type="password"
              value={appKey}
              onChange={(e) => setAppKey(e.target.value)}
              placeholder="输入玄关知识库 App Key"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isValidating}
            />
          </div>

          {/* 服务器地址输入 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              <Globe className="w-4 h-4 inline mr-1" />
              服务器地址
            </label>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="https://sg-al-cwork-web.mediportal.com.cn/open-api/"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isValidating}
            />
          </div>

          {/* 项目目录路径 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              <FolderOpen className="w-4 h-4 inline mr-1" />
              项目目录路径
            </label>
            <input
              type="text"
              value={projectsPath}
              onChange={(e) => setProjectsPath(e.target.value)}
              placeholder="Obsidian/projects"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isValidating}
            />
            <p className="text-xs text-gray-400 mt-1">知识库中存放项目的目录路径，用 / 分隔</p>
          </div>

          {/* 状态消息 */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-md text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-600 rounded-md text-sm">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>配置已保存</span>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            disabled={isValidating}
          >
            取消
          </button>
          <button
            onClick={validateAndSave}
            disabled={isValidating}
            className="px-4 py-2 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isValidating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                验证中...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                保存配置
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
