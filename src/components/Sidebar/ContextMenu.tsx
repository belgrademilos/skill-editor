import { useEffect, useRef } from 'react';
import { Copy, Trash2, Pencil, FilePlus, FolderPlus } from 'lucide-react';
import { useSkillStore } from '../../store/skillStore';

export function ContextMenu() {
  const { contextMenu, setContextMenu, deleteFile, duplicateFile, setModal } =
    useSkillStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [setContextMenu]);

  if (!contextMenu) return null;

  const isSkillMd = contextMenu.path === 'SKILL.md' || contextMenu.path.endsWith('/SKILL.md');
  const isFolder = contextMenu.type === 'folder';

  const items = [
    ...(isFolder
      ? [
          {
            label: 'New File',
            icon: <FilePlus className="w-3.5 h-3.5" />,
            action: () => {
              setModal({ type: 'new-file', parentPath: contextMenu.path });
            },
          },
          {
            label: 'New Folder',
            icon: <FolderPlus className="w-3.5 h-3.5" />,
            action: () => {
              setModal({ type: 'new-folder', parentPath: contextMenu.path });
            },
          },
        ]
      : []),
    ...(!isSkillMd
      ? [
          {
            label: 'Rename',
            icon: <Pencil className="w-3.5 h-3.5" />,
            action: () => {
              setModal({
                type: 'rename',
                parentPath: contextMenu.path.split('/').slice(0, -1).join('/'),
                defaultValue: contextMenu.path.split('/').pop(),
                originalPath: contextMenu.path,
              });
            },
          },
        ]
      : []),
    ...(!isSkillMd && !isFolder
      ? [
          {
            label: 'Duplicate',
            icon: <Copy className="w-3.5 h-3.5" />,
            action: () => duplicateFile(contextMenu.path),
          },
        ]
      : []),
    ...(!isSkillMd
      ? [
          {
            label: 'Delete',
            icon: <Trash2 className="w-3.5 h-3.5" />,
            action: () => {
              if (confirm(`Delete "${contextMenu.path.split('/').pop()}"?`)) {
                deleteFile(contextMenu.path);
              }
            },
            danger: true,
          },
        ]
      : []),
  ];

  if (items.length === 0) return null;

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[160px] bg-bg-surface border border-border rounded-lg shadow-xl py-1 animate-in fade-in"
      style={{ left: contextMenu.x, top: contextMenu.y }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => {
            item.action();
            setContextMenu(null);
          }}
          className={`
            w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left
            transition-colors
            ${item.danger
              ? 'text-danger hover:bg-danger/10'
              : 'text-text-primary hover:bg-bg-hover'
            }
          `}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}
