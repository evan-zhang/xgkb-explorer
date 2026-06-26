import React from 'react';
import { Settings, LogOut, ChevronDown } from 'lucide-react';

interface HeaderProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  onSettingsClick: () => void;
  onLogoutClick: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  showSearch?: boolean;
}

export default function Header({
  currentFilter,
  onFilterChange,
  onSettingsClick,
  onLogoutClick,
  searchQuery,
  onSearchQueryChange,
  showSearch = true,
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const filters = [
    { label: 'TPR项目', value: 'TPR' },
    { label: 'FINA项目', value: 'FINA' },
    { label: '全部项目', value: 'ALL' },
  ];

  const currentLabel = filters.find(f => f.value === currentFilter)?.label || 'TPR项目';

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between h-14 px-6 bg-white border-b border-gray-100 shadow-xs select-none">
      {/* Left logo and branding */}
      <div className="flex items-center space-x-4 shrink-0">
        <div className="flex items-center space-x-2">
          {/* Custom logo to match '玄' */}
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#242526] text-white font-medium text-sm shadow-sm">
            玄
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-gray-900 font-medium text-sm tracking-tight">玄关知识库</span>
            <span className="text-gray-400 text-xs font-light">/</span>
            <span className="text-gray-400 text-xs font-normal">Explorer</span>
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-normal text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors focus:outline-hidden"
          >
            <span>{currentLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {dropdownOpen && (
            <>
              {/* Overlay background to dismiss */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute left-0 mt-1 w-32 bg-white border border-gray-100 rounded-lg shadow-lg z-50 py-1 origin-top-left animate-in fade-in slide-in-from-top-1 duration-100">
                {filters.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => {
                      onFilterChange(f.value);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-1.5 text-xs transition-colors ${
                      currentFilter === f.value
                        ? 'bg-gray-50 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Centered Global Search Box */}
      {showSearch ? (
        <div className="flex-1 max-w-md mx-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="跨空间检索文件名或内容 (输入回车即刻过滤)..."
            className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-gray-50 hover:bg-gray-100/70 focus:bg-white text-gray-800 border border-gray-200 focus:border-gray-300 rounded-lg transition-all focus:outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchQueryChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[10px] text-gray-400 hover:text-gray-600"
            >
              清除
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* Right action buttons */}
      <div className="flex items-center space-x-3 shrink-0">
        <button
          onClick={onSettingsClick}
          className="p-1.5 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors focus:outline-hidden"
          title="系统设置"
        >
          <Settings className="w-5 h-5" />
        </button>
        <button
          onClick={onLogoutClick}
          className="p-1.5 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors focus:outline-hidden"
          title="退出登录"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
