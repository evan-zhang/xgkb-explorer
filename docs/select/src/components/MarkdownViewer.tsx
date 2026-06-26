import React from 'react';
import { X, Copy, Check, Download, Share2 } from 'lucide-react';
import { FileItem } from '../data';

interface MarkdownViewerProps {
  file: FileItem;
  onClose: () => void;
  onActionToast: (message: string) => void;
}

export default function MarkdownViewer({
  file,
  onClose,
  onActionToast,
}: MarkdownViewerProps) {
  const [copied, setCopied] = React.useState(false);
  const [shared, setShared] = React.useState(false);

  const handleCopy = () => {
    if (file.content) {
      navigator.clipboard.writeText(file.content);
      setCopied(true);
      onActionToast('文档内容已复制到剪贴板！');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/share/file/${encodeURIComponent(file.name)}`;
    navigator.clipboard.writeText(shareUrl);
    setShared(true);
    onActionToast(`文件 [${file.name}] 分享链接已复制到剪贴板！`);
    setTimeout(() => setShared(false), 2000);
  };

  const handleDownload = () => {
    if (file.content) {
      const element = document.createElement('a');
      const fileBlob = new Blob([file.content], { type: 'text/plain' });
      element.href = URL.createObjectURL(fileBlob);
      element.download = file.name;
      document.body.appendChild(element);
      element.click();
      onActionToast(`正在下载文件: ${file.name}`);
      document.body.removeChild(element);
    }
  };

  // Basic HTML rendering of our markdown structure
  const renderMockMarkdown = (text: string) => {
    const lines = text.split('\n');
    let inList = false;
    const elements: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Heading 1
      if (trimmed.startsWith('# ')) {
        closeList(elements, inList);
        inList = false;
        elements.push(
          <h1 key={`h1-${index}`} className="text-2xl font-bold text-gray-900 mt-6 mb-3 border-b border-gray-100 pb-2">
            {trimmed.substring(2)}
          </h1>
        );
      }
      // Heading 2
      else if (trimmed.startsWith('## ')) {
        closeList(elements, inList);
        inList = false;
        elements.push(
          <h2 key={`h2-${index}`} className="text-xl font-semibold text-gray-800 mt-5 mb-2.5">
            {trimmed.substring(3)}
          </h2>
        );
      }
      // Heading 3
      else if (trimmed.startsWith('### ')) {
        closeList(elements, inList);
        inList = false;
        elements.push(
          <h3 key={`h3-${index}`} className="text-lg font-medium text-gray-800 mt-4 mb-2">
            {trimmed.substring(4)}
          </h3>
        );
      }
      // Bullet list items
      else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (!inList) {
          inList = true;
          elements.push(<ul key={`ul-start-${index}`} className="list-disc pl-5 my-2 space-y-1.5 text-gray-600 text-sm"></ul>);
        }
        
        const currentContent = trimmed.substring(2);
        const formattedContent = parseInlineBolding(currentContent);

        elements.push(
          <li key={`li-${index}`} className="list-disc pl-1 text-gray-600 text-[13.5px] leading-relaxed">
            {formattedContent}
          </li>
        );
      }
      // Numbered list items
      else if (/^\d+\.\s/.test(trimmed)) {
        closeList(elements, inList);
        inList = false;
        const content = trimmed.replace(/^\d+\.\s/, '');
        elements.push(
          <div key={`ol-${index}`} className="flex items-start space-x-2 my-2 text-gray-600 text-[13.5px] leading-relaxed pl-1">
            <span className="font-semibold text-blue-600 shrink-0">{trimmed.match(/^\d+/)?.[0]}.</span>
            <span>{parseInlineBolding(content)}</span>
          </div>
        );
      }
      // Blockquotes
      else if (trimmed.startsWith('> ')) {
        closeList(elements, inList);
        inList = false;
        elements.push(
          <blockquote key={`bq-${index}`} className="border-l-4 border-amber-500 bg-amber-50/50 px-4 py-3 rounded-r-lg text-[13px] text-gray-600 italic my-4 leading-relaxed">
            {trimmed.substring(2)}
          </blockquote>
        );
      }
      // Blank lines
      else if (trimmed === '') {
        closeList(elements, inList);
        inList = false;
        elements.push(<div key={`blank-${index}`} className="h-2" />);
      }
      // Normal paragraphs
      else {
        closeList(elements, inList);
        inList = false;
        elements.push(
          <p key={`p-${index}`} className="text-gray-600 text-[13.5px] leading-relaxed my-3 text-justify">
            {parseInlineBolding(trimmed)}
          </p>
        );
      }
    });

    return <div className="space-y-1">{elements}</div>;
  };

  const closeList = (elements: React.ReactNode[], inList: boolean) => {
    // Unused in basic React rendering
  };

  const parseInlineBolding = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    if (parts.length === 1) return text;
    
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-semibold text-gray-900">{part}</strong>;
      }
      return part;
    });
  };

  const markdownContent = file.content || `# ${file.name}\n\n该文件暂无详细内容。`;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center select-text">
      {/* Dark backdrop shadow */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Full-width elegant viewport container (instead of half-screen) */}
      <div className="relative w-full h-full bg-white flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-gray-100 shadow-xs">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate" title={file.name}>
              {file.name}
            </h3>
            <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1 font-light">
              <span>大小: {file.size}</span>
              <span>•</span>
              <span>更新时间: {file.date}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleShare}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
              title="复制分享链接"
            >
              {shared ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5 text-gray-500" />}
              <span>复制分享链接</span>
            </button>
            <div className="h-4 w-[1px] bg-gray-200 mx-1" />
            <button
              onClick={handleCopy}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              title="复制全部"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDownload}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              title="下载文件"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors ml-2"
              title="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content - centered with readable content container */}
        <div className="flex-1 overflow-y-auto px-8 py-10 bg-gray-50/50">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-10 max-w-4xl mx-auto prose prose-slate">
            {renderMockMarkdown(markdownContent)}
          </div>
        </div>
      </div>
    </div>
  );
}
