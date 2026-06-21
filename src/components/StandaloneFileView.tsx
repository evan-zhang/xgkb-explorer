import { useState, useEffect } from 'react';
import { BookOpen, X } from 'lucide-react';
import { FilePreview } from './FilePreview';
import { useApiClient } from '../lib/hooks';

interface StandaloneFileViewProps {
  fileId: string;
  fileName: string;
}

export function StandaloneFileView({ fileId, fileName }: StandaloneFileViewProps) {
  const { client, loadSavedClient } = useApiClient();
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSavedClient();
  }, [loadSavedClient]);

  useEffect(() => {
    if (!client) return;
    const suffix = fileName.split('.').pop()?.toLowerCase() || '';
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(suffix);
    if (isImage) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    client.getFullFileContent(fileId).then((result) => {
      if (result.ok) setContent(result.value);
      else setError(result.error);
      setIsLoading(false);
    });
  }, [client, fileId, fileName]);

  const decodedName = decodeURIComponent(fileName);

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-700 truncate">{decodedName}</span>
        </div>
        <button
          onClick={() => window.close()}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors flex-shrink-0 ml-4"
          title="关闭"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {!client && !isLoading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          未找到 API 配置，请先在主页面完成设置后重新打开此文件
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <FilePreview
            content={content}
            fileName={decodedName}
            filePath={undefined}
            isLoading={isLoading}
            error={error}
            client={client}
            fileId={fileId}
          />
        </div>
      )}
    </div>
  );
}
