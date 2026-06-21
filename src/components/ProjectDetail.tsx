/**
 * 项目详情页：左侧文件树（限定在项目目录内）+ 右侧文件预览
 * 进入时自动加载并预览 README.md 或 index.md
 */

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';
import { FileTree } from './FileTree';
import { FilePreview } from './FilePreview';
import type { KbApiClient } from '../lib/api';
import type { FileListItem } from '../lib/types';

interface ProjectDetailProps {
  client: KbApiClient;
  projectId: string;
  project: FileListItem;
  onBack: () => void;
}

export function ProjectDetail({ client, projectId, project, onBack }: ProjectDetailProps) {
  const [selectedFile, setSelectedFile] = useState<FileListItem | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState('');
  const [content, setContent] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  // 进入时自动找 README.md / index.md 并预览
  useEffect(() => {
    let cancelled = false;
    client.getChildFiles(String(project.id)).then(async (result) => {
      if (cancelled || !result.ok) return;
      const readme = result.value.find(
        (f) => f.type !== 1 && /^(readme|index)\.(md|markdown)$/i.test(f.name),
      );
      if (!readme) return;
      if (cancelled) return;
      setSelectedFile(readme);
      setSelectedFilePath(`${project.name}/${readme.name}`);
      setContentLoading(true);
      setContent(null);
      setContentError(null);
      const content = await client.getFullFileContent(String(readme.id));
      if (cancelled) return;
      if (content.ok) setContent(content.value);
      else setContentError(content.error);
      setContentLoading(false);
    });
    return () => { cancelled = true; };
  }, [client, project]);

  const handleFileSelect = useCallback(async (file: FileListItem, path: string) => {
    setSelectedFile(file);
    setSelectedFilePath(`${project.name}/${path}`);
    setContent(null);
    setContentError(null);

    const suffix = file.name.split('.').pop()?.toLowerCase() || '';
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(suffix);
    if (!isImage) {
      setContentLoading(true);
      const result = await client.getFullFileContent(String(file.id));
      if (result.ok) setContent(result.value);
      else setContentError(result.error);
      setContentLoading(false);
    }
  }, [client, project.name]);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* 左侧：文件树（限定在项目目录内） */}
      <aside className="w-64 border-r border-gray-200 overflow-hidden flex flex-col">
        {/* 返回按钮 */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-50 border-b border-gray-200 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          我的项目
        </button>

        {/* 项目名 */}
        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide truncate">
            {project.name}
          </p>
        </div>

        {/* 文件树（从项目目录开始） */}
        <div className="flex-1 overflow-hidden">
          <FileTree
            client={client}
            projectId={projectId}
            rootFileId={String(project.id)}
            onFileSelect={handleFileSelect}
          />
        </div>
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
    </div>
  );
}
