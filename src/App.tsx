/**
 * 主应用组件
 */

import { useState, useEffect, useCallback } from 'react';
import { Settings, Search, BookOpen } from 'lucide-react';
import { ConfigModal } from './components/ConfigModal';
import { FileTree } from './components/FileTree';
import { FilePreview } from './components/FilePreview';
import { useApiClient, useFileContent, useProject } from './lib/hooks';
import type { FileListItem } from './lib/types';

function App() {
  // API 客户端
  const { client, isLoading: clientLoading, error: clientError, initClient, loadSavedClient } = useApiClient();

  // 项目 ID
  const { projectId, isLoading: projectLoading, loadPersonalProjectId } = useProject(client);

  // 文件内容
  const { content, isLoading: contentLoading, error: contentError, loadFileContent, clearContent } =
    useFileContent(client);

  // UI 状态
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileListItem | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('');

  // 初始化：尝试加载保存的配置
  useEffect(() => {
    const hasConfig = loadSavedClient();
    if (!hasConfig) {
      // 没有保存的配置，打开设置对话框
      setIsConfigModalOpen(true);
    }
  }, [loadSavedClient]);

  // 配置保存后，加载项目 ID
  useEffect(() => {
    if (client && !projectId) {
      loadPersonalProjectId();
    }
  }, [client, projectId, loadPersonalProjectId]);

  // 处理配置保存
  const handleConfigSave = useCallback(async (appKey: string, serverUrl: string) => {
    const success = initClient(appKey, serverUrl);
    if (!success) {
      throw new Error('Failed to initialize API client');
    }
  }, [initClient]);

  // 处理文件选择
  const handleFileSelect = useCallback((file: FileListItem, path: string) => {
    setSelectedFile(file);
    setSelectedFilePath(path);
    clearContent();
    
    // 图片不走文本接口，FilePreview 组件会自己拉下载链接
    const suffix = file.name.split('.').pop()?.toLowerCase() || '';
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(suffix);
    if (!isImage) {
      loadFileContent(String(file.id), file.name);
    }
  }, [clearContent, loadFileContent]);

  // 搜索功能（简化版：按文件名搜索）
  const [searchQuery, setSearchQuery] = useState('');
  const handleSearch = useCallback(() => {
    // TODO: 实现搜索功能
    console.log('搜索:', searchQuery);
  }, [searchQuery]);

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* 顶部导航栏 */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-blue-500" />
          <h1 className="text-lg font-semibold">玄关知识库浏览器</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* 搜索框 */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索文件..."
              className="pl-8 pr-4 py-1.5 text-sm border border-gray-300 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
            <Search className="w-4 h-4 absolute left-2.5 top-2 text-gray-400" />
          </div>

          {/* 设置按钮 */}
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="p-2 hover:bg-gray-200 rounded-md"
            title="设置"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 主内容区：分栏布局 */}
      <main className="flex-1 flex overflow-hidden">
        {/* 左侧：文件树 */}
        <aside className="w-64 border-r border-gray-200 overflow-hidden flex flex-col">
          {projectId && client ? (
            <FileTree client={client} projectId={projectId} onFileSelect={handleFileSelect} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                {clientLoading || projectLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mx-auto mb-2" />
                    <p className="text-sm">加载中...</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm mb-2">无法连接到知识库</p>
                    <p className="text-xs text-gray-400">{clientError}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* 右侧：文件预览 */}
        <section className="flex-1 overflow-hidden">
          <FilePreview
            content={content}
            fileName={selectedFile?.name}
            filePath={selectedFilePath}
            isLoading={contentLoading}
            error={contentError}
            client={client}
            fileId={selectedFile ? String(selectedFile.id) : undefined}
          />
        </section>
      </main>

      {/* 配置模态框 */}
      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={handleConfigSave}
      />
    </div>
  );
}

export default App;
