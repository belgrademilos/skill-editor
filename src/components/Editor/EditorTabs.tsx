import { X, FileText } from 'lucide-react';
import { useSkillStore } from '../../store/skillStore';

export function EditorTabs() {
  const { openTabs, activeFile, setActiveFile, closeTab } = useSkillStore();

  if (openTabs.length === 0) return null;

  return (
    <div className="flex items-center border-b border-border bg-bg-primary overflow-x-auto">
      {openTabs.map(tab => {
        const isActive = tab === activeFile;
        const fileName = tab.split('/').pop() || tab;
        const isSkillMd = fileName === 'SKILL.md';

        return (
          <div
            key={tab}
            className={`
              group flex items-center gap-1.5 px-3 py-2 text-sm cursor-pointer
              border-r border-border shrink-0 select-none
              transition-colors
              ${isActive
                ? 'bg-bg-surface text-text-primary border-b-2 border-b-accent'
                : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              }
            `}
            onClick={() => setActiveFile(tab)}
          >
            <FileText
              className={`w-3.5 h-3.5 shrink-0 ${isSkillMd ? 'text-accent' : 'text-text-muted'}`}
            />
            <span className={`truncate max-w-[120px] ${isSkillMd ? 'font-medium' : ''}`}>
              {fileName}
            </span>
            <button
              onClick={e => {
                e.stopPropagation();
                closeTab(tab);
              }}
              className="
                ml-1 p-0.5 rounded
                opacity-0 group-hover:opacity-100
                hover:bg-bg-active text-text-muted hover:text-text-primary
                transition-all
              "
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
