import { useEffect, useRef } from 'react';

export interface MenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

const MENU_WIDTH = 188;

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  const menuHeight = items.length * 40 + 8;
  const left = x + MENU_WIDTH > window.innerWidth ? x - MENU_WIDTH : x;
  const top = y + menuHeight > window.innerHeight ? y - menuHeight : y;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left,
        top,
        zIndex: 9999,
        minWidth: MENU_WIDTH,
        background: '#FFFFFF',
        borderRadius: 12,
        boxShadow: '0 4px 24px rgba(0,0,0,0.14)',
        border: '1px solid #ECECE6',
        padding: '4px 0',
        overflow: 'hidden',
      }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => { if (!item.disabled) item.onClick(); }}
          disabled={item.disabled}
          className="w-full flex items-center gap-3 transition-colors hover:bg-[#F5F3EE]"
          style={{
            padding: '9px 16px',
            fontSize: 13,
            color: item.disabled ? '#C0C0B8' : '#1A1A1A',
            cursor: item.disabled ? 'not-allowed' : 'pointer',
            background: 'none',
            border: 'none',
            textAlign: 'left',
          }}
        >
          <span style={{ color: item.disabled ? '#C0C0B8' : '#6B7280', flexShrink: 0, display: 'flex' }}>
            {item.icon}
          </span>
          {item.label}
        </button>
      ))}
    </div>
  );
}
