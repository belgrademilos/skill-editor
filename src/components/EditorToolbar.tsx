import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown } from 'lucide-react';

interface EditorToolbarProps {
  skillName: string;
  onExportSkill: () => void;
  onExportMd: () => void;
}

export function EditorToolbar({
  skillName,
  onExportSkill,
  onExportMd,
}: EditorToolbarProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [exportOpen]);

  return (
    <div className="flex h-11 shrink-0 items-center justify-between px-4 border-b border-border bg-bg-primary">
      <span className="text-sm font-medium leading-none text-text-primary truncate max-w-[300px] min-w-0">
        {skillName || 'Untitled Skill'}
      </span>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setExportOpen(!exportOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-bg-surface border border-border hover:bg-bg-hover hover:border-text-muted transition-colors text-text-primary"
        >
          <Download className="w-3.5 h-3.5" />
          Export
          <ChevronDown className="w-3 h-3 text-text-muted" />
        </button>
        {exportOpen && (
          <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg bg-bg-surface border border-border shadow-lg py-1">
            <button
              type="button"
              onClick={() => {
                onExportSkill();
                setExportOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-hover transition-colors"
            >
              Export as .skill
            </button>
            <button
              type="button"
              onClick={() => {
                onExportMd();
                setExportOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-hover transition-colors"
            >
              Export as .md
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
