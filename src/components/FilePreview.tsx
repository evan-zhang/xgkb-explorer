/**
 * 文件内容预览组件
 * 支持 Markdown 渲染（含内嵌 HTML）、代码高亮、HTML 预览、图片预览
 */

import { useMemo, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FileText, AlertCircle, Image as ImageIcon, Eye, Code2 } from 'lucide-react';
import type { KbApiClient } from '../lib/api';

interface FilePreviewProps {
  content: string | null;
  fileName?: string;
  filePath?: string;
  isLoading: boolean;
  error: string | null;
  client: KbApiClient | null;
  fileId?: string;
}

// 图片扩展名
const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'];

// 代码语言映射
const LANG_MAP: Record<string, string> = {
  js: 'javascript', jsx: 'jsx', ts: 'typescript', tsx: 'tsx',
  json: 'json', py: 'python', rs: 'rust', go: 'go',
  java: 'java', c: 'c', cpp: 'cpp', h: 'c', hpp: 'cpp',
  sh: 'bash', bash: 'bash', zsh: 'bash', fish: 'bash',
  yml: 'yaml', yaml: 'yaml', toml: 'toml',
  html: 'markup', xml: 'markup', vue: 'markup',
  css: 'css', scss: 'scss', less: 'less',
  sql: 'sql', graphql: 'graphql',
  dockerfile: 'docker', makefile: 'makefile',
  php: 'php', rb: 'ruby', swift: 'swift', kt: 'kotlin',
  dart: 'dart', lua: 'lua', r: 'r', scala: 'scala',
};

export function FilePreview({ content, fileName, filePath, isLoading, error, client, fileId }: FilePreviewProps) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [htmlView, setHtmlView] = useState<'preview' | 'source'>('preview');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 判断文件类型
  const fileType = useMemo(() => {
    if (!fileName) return 'text';
    const suffix = fileName.split('.').pop()?.toLowerCase() || '';
    if (['md', 'markdown', 'mdown', 'mkd'].includes(suffix)) return 'markdown';
    if (suffix === 'html' || suffix === 'htm') return 'html';
    if (IMAGE_EXTS.includes(suffix)) return 'image';
    if (LANG_MAP[suffix]) return 'code';
    return 'text';
  }, [fileName]);

  // 获取图片 URL（放在 useEffect 里更正确，但 useMemo 也能 work）
  useMemo(() => {
    if (fileType !== 'image' || !client || !fileId) {
      setImgUrl(null);
      return;
    }
    setImgLoading(true);
    client.getDownloadInfo(fileId).then(result => {
      if (result.ok && result.value.downloadUrl) {
        setImgUrl(result.value.downloadUrl);
      } else {
        setImgUrl(null);
      }
      setImgLoading(false);
    }).catch(() => {
      setImgUrl(null);
      setImgLoading(false);
    });
  }, [fileType, fileId, client]);

  // 重置 HTML 视图模式
  useMemo(() => {
    setHtmlView('preview');
  }, [fileName]);

  // 加载状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4" />
          <p>加载文件内容...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-500 px-8">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p className="mb-2">加载失败</p>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      </div>
    );
  }

  // 空内容状态
  if (!content && fileType !== 'image') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>请从左侧选择一个文件</p>
        </div>
      </div>
    );
  }

  // 渲染内容
  const renderContent = () => {
    // ===== 图片预览 =====
    if (fileType === 'image') {
      return (
        <div className="flex items-center justify-center p-8 min-h-full">
          {imgLoading ? (
            <div className="text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2" />
              <p className="text-sm">加载图片...</p>
            </div>
          ) : imgUrl ? (
            <img
              src={imgUrl}
              alt={fileName || '图片'}
              className="max-w-full max-h-[calc(100vh-200px)] object-contain rounded-lg shadow-md"
            />
          ) : (
            <div className="text-center text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-2" />
              <p>无法预览此图片</p>
            </div>
          )}
        </div>
      );
    }

    // ===== HTML 文件预览 =====
    if (fileType === 'html') {
      // getFullFileContent returns AI-extracted Markdown text, not raw HTML bytes.
      // Only use the iframe path if the content is genuine HTML markup.
      const trimmed = content?.trimStart() ?? '';
      const isActualHtml =
        trimmed.startsWith('<!DOCTYPE') ||
        trimmed.startsWith('<!doctype') ||
        trimmed.startsWith('<html') ||
        /^<[a-z][^>]*>/i.test(trimmed);

      if (!isActualHtml) {
        // AI-extracted content — render as Markdown (same path as .md files)
        return (
          <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:border-b prose-headings:pb-2 prose-headings:border-gray-200 prose-a:text-blue-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-pink-600 prose-pre:bg-gray-900 prose-pre:text-gray-100 px-8 py-6">
            <ReactMarkdown
              rehypePlugins={[rehypeRaw]}
              components={{
                code(props) {
                  const { className, children } = props;
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  return language ? (
                    <SyntaxHighlighter
                      style={oneLight as any}
                      language={LANG_MAP[language] || language}
                      PreTag="div"
                      className="rounded-md text-sm"
                      customStyle={{ margin: 0, borderRadius: '8px', fontSize: '13px' }}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-pink-600">
                      {children}
                    </code>
                  );
                },
                table({ children }) {
                  return (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border-collapse border border-gray-300 text-sm">{children}</table>
                    </div>
                  );
                },
                th({ children }) {
                  return <th className="border border-gray-300 px-3 py-1.5 bg-gray-100 font-semibold text-left">{children}</th>;
                },
                td({ children }) {
                  return <td className="border border-gray-300 px-3 py-1.5">{children}</td>;
                },
                img({ src, alt }) {
                  return <img src={src as string} alt={alt || ''} className="max-w-full rounded-md my-2" />;
                },
                a({ href, children }) {
                  return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">{children}</a>;
                },
                blockquote({ children }) {
                  return <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-2">{children}</blockquote>;
                },
              }}
            >
              {content || ''}
            </ReactMarkdown>
          </div>
        );
      }

      return (
        <div className="h-full flex flex-col">
          {/* 切换栏 */}
          <div className="flex items-center gap-1 px-3 py-1.5 border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setHtmlView('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors ${
                htmlView === 'preview' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              渲染预览
            </button>
            <button
              onClick={() => setHtmlView('source')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors ${
                htmlView === 'source' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              源代码
            </button>
          </div>

          {htmlView === 'preview' ? (
            <iframe
              ref={iframeRef}
              srcDoc={content || ''}
              title="HTML 预览"
              sandbox="allow-same-origin"
              className="flex-1 w-full bg-white border-0"
            />
          ) : (
            <div className="flex-1 overflow-auto px-4 py-4">
              <SyntaxHighlighter
                style={oneLight as any}
                language="markup"
                showLineNumbers
                className="rounded-md text-sm"
                customStyle={{ margin: 0, borderRadius: '8px', fontSize: '13px' }}
              >
                {content || ''}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      );
    }

    // ===== Markdown 渲染 =====
    if (fileType === 'markdown') {
      return (
        <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:border-b prose-headings:pb-2 prose-headings:border-gray-200 prose-a:text-blue-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-pink-600 prose-pre:bg-gray-900 prose-pre:text-gray-100 px-8 py-6">
          <ReactMarkdown
            rehypePlugins={[rehypeRaw]}
            components={{
              // 代码块
              code(props) {
                const { className, children } = props;
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                return language ? (
                  <SyntaxHighlighter
                    style={oneLight as any}
                    language={LANG_MAP[language] || language}
                    PreTag="div"
                    className="rounded-md text-sm"
                    customStyle={{ margin: 0, borderRadius: '8px', fontSize: '13px' }}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-pink-600">
                    {children}
                  </code>
                );
              },
              // 表格
              table({ children }) {
                return (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border-collapse border border-gray-300 text-sm">
                      {children}
                    </table>
                  </div>
                );
              },
              th({ children }) {
                return <th className="border border-gray-300 px-3 py-1.5 bg-gray-100 font-semibold text-left">{children}</th>;
              },
              td({ children }) {
                return <td className="border border-gray-300 px-3 py-1.5">{children}</td>;
              },
              // 图片
              img({ src, alt }) {
                return <img src={src as string} alt={alt || ''} className="max-w-full rounded-md my-2" />;
              },
              // 链接
              a({ href, children }) {
                return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">{children}</a>;
              },
              // 引用
              blockquote({ children }) {
                return <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-2">{children}</blockquote>;
              },
            }}
          >
            {content || ''}
          </ReactMarkdown>
        </div>
      );
    }

    // ===== 代码文件渲染 =====
    if (fileType === 'code') {
      const suffix = fileName?.split('.').pop()?.toLowerCase() || 'text';
      const language = LANG_MAP[suffix] || suffix;
      return (
        <div className="px-4 py-4">
          <SyntaxHighlighter
            style={oneLight as any}
            language={language}
            showLineNumbers
            className="rounded-md text-sm"
            customStyle={{ margin: 0, borderRadius: '8px', fontSize: '13px' }}
          >
            {content || ''}
          </SyntaxHighlighter>
        </div>
      );
    }

    // ===== 纯文本渲染 =====
    return (
      <div className="px-8 py-6">
        <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-md overflow-x-auto text-gray-800">
          {content}
        </pre>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 面包屑导航 */}
      {filePath && (
        <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-gray-400" />
          <p className="text-sm text-gray-600 truncate flex-1">{filePath}</p>
          {fileName && (
            <span className="text-xs text-gray-400 uppercase tracking-wide">
              {fileName.split('.').pop()}
            </span>
          )}
        </div>
      )}

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">{renderContent()}</div>
    </div>
  );
}
