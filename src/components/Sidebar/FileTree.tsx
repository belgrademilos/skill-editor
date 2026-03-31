import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  FolderOpen,
  FolderClosed,
  Plus,
} from 'lucide-react';
import { useSkillStore } from '../../store/skillStore';
import type { FileNode } from '../../lib/zip';

// Internal drag-and-drop MIME type to distinguish from external file drops
const INTERNAL_DRAG_MIME = 'application/x-skill-editor-path';

// --- File reading helpers ---

interface DropData {
  entries: FileSystemEntry[];
  files: File[];
}

function captureDropData(dt: DataTransfer): DropData {
  const entries: FileSystemEntry[] = [];
  const files: File[] = [];

  if (dt.items && dt.items.length > 0) {
    for (let i = 0; i < dt.items.length; i++) {
      const item = dt.items[i];
      const entry = item.webkitGetAsEntry?.();
      if (entry) {
        entries.push(entry);
      } else if (item.kind === 'file') {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
  } else if (dt.files.length > 0) {
    for (let i = 0; i < dt.files.length; i++) {
      files.push(dt.files[i]);
    }
  }

  return { entries, files };
}

async function readDropData(data: DropData): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (data.entries.length > 0) {
    await processEntries(data.entries, '', result);
  } else {
    for (const file of data.files) {
      const content = await file.text();
      result.set(file.name, content);
    }
  }
  return result;
}

async function processEntries(
  entries: FileSystemEntry[],
  basePath: string,
  result: Map<string, string>
) {
  for (const entry of entries) {
    const path = basePath ? `${basePath}/${entry.name}` : entry.name;
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) =>
        (entry as FileSystemFileEntry).file(resolve, reject)
      );
      const content = await file.text();
      result.set(path, content);
    } else if (entry.isDirectory) {
      const children = await new Promise<FileSystemEntry[]>((resolve, reject) => {
        const reader = (entry as FileSystemDirectoryEntry).createReader();
        const all: FileSystemEntry[] = [];
        const readBatch = () => {
          reader.readEntries((batch) => {
            if (batch.length === 0) resolve(all);
            else { all.push(...batch); readBatch(); }
          }, reject);
        };
        readBatch();
      });
      await processEntries(children, path, result);
    }
  }
}

async function readFilesFromInput(fileList: FileList): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const path = file.webkitRelativePath || file.name;
    const content = await file.text();
    result.set(path, content);
  }
  return result;
}

// --- Components ---

// Drop indicator: where the line or folder highlight should appear
interface DropIndicator {
  path: string;           // The node path being hovered
  position: 'above' | 'below' | 'inside';  // Line above/below, or folder highlight
}

/** Given a node element and mouse Y, determine drop position */
function getDropPosition(el: HTMLElement, clientY: number, isFolder: boolean): 'above' | 'below' | 'inside' {
  const rect = el.getBoundingClientRect();
  const y = clientY - rect.top;
  const ratio = y / rect.height;
  if (isFolder) {
    if (ratio < 0.25) return 'above';
    if (ratio > 0.75) return 'below';
    return 'inside';
  }
  return ratio < 0.5 ? 'above' : 'below';
}

/** Resolve which parent folder a drop indicator targets */
function resolveTargetFolder(indicator: DropIndicator | null): string | null {
  if (!indicator) return null;
  if (indicator.position === 'inside') {
    // Dropping into this folder
    return indicator.path;
  }
  // Dropping above/below a node → same parent as that node
  const idx = indicator.path.lastIndexOf('/');
  return idx >= 0 ? indicator.path.slice(0, idx) : null; // null = root
}

export function FileTree() {
  const { fileTree, activeFile, setModal, addFiles } = useSkillStore();
  const [isDragging, setIsDragging] = useState(false);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const dragCounterRef = useRef(0);
  const dropIndicatorRef = useRef<DropIndicator | null>(null);

  // Keep ref in sync with state for use in native event handlers
  dropIndicatorRef.current = dropIndicator;

  // Close add menu on outside click
  useEffect(() => {
    if (!showAddMenu) return;
    const handler = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAddMenu]);

  /** Move a file/folder to a new parent folder (or root if targetFolder is null).
   *  Reads fresh state from the store to avoid stale closures in native event handlers. */
  const moveNode = useCallback(
    (sourcePath: string, targetFolder: string | null) => {
      const { files, renameFile } = useSkillStore.getState();
      const name = sourcePath.split('/').pop()!;
      const sourceParent = sourcePath.includes('/') ? sourcePath.slice(0, sourcePath.lastIndexOf('/')) : '';
      const targetParent = targetFolder || '';

      // No-op if dropping into the same folder
      if (sourceParent === targetParent) return;

      // Prevent dropping a folder into itself or its own descendants
      if (targetFolder && (targetFolder === sourcePath || targetFolder.startsWith(sourcePath + '/'))) return;

      const newPath = targetParent ? `${targetParent}/${name}` : name;

      // Check for name collision at destination
      if (files.has(newPath)) return;
      for (const key of files.keys()) {
        if (key.startsWith(newPath + '/')) return;
      }

      renameFile(sourcePath, newPath);
    },
    []
  );

  // Register native drag events on the container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current++;
      if (dragCounterRef.current === 1) {
        setIsDragging(true);
      }
    };

    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setIsDragging(false);
        setDropIndicator(null);
      }
    };

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
      }

      // Find the closest tree row element
      const target = e.target as HTMLElement;
      const rowEl = target.closest('[data-node-path]') as HTMLElement | null;

      if (rowEl) {
        const nodePath = rowEl.dataset.nodePath!;
        const isFolder = rowEl.dataset.nodeType === 'folder';
        const position = getDropPosition(rowEl, e.clientY, isFolder);
        setDropIndicator({ path: nodePath, position });
      } else {
        // Hovering over empty space → root drop
        setDropIndicator(null);
      }
    };

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);

      const indicator = dropIndicatorRef.current;
      const targetFolder = resolveTargetFolder(indicator);
      setDropIndicator(null);

      if (!e.dataTransfer) return;

      // --- Internal move (dragging existing tree items) ---
      const draggedPath = e.dataTransfer.getData(INTERNAL_DRAG_MIME);
      if (draggedPath) {
        // Check if this is a reorder within the same parent (above/below a sibling)
        if (indicator && indicator.position !== 'inside') {
          const sourceParent = draggedPath.includes('/') ? draggedPath.slice(0, draggedPath.lastIndexOf('/')) : '';
          const targetParent = indicator.path.includes('/') ? indicator.path.slice(0, indicator.path.lastIndexOf('/')) : '';
          if (sourceParent === targetParent && draggedPath !== indicator.path) {
            const { reorderFile } = useSkillStore.getState();
            reorderFile(draggedPath, indicator.path, indicator.position);
            return;
          }
        }
        moveNode(draggedPath, targetFolder);
        return;
      }

      // --- External file drop ---
      const data = captureDropData(e.dataTransfer);

      readDropData(data).then((rawFiles) => {
        if (rawFiles.size === 0) return;
        if (targetFolder) {
          const prefixed = new Map<string, string>();
          for (const [path, content] of rawFiles) {
            prefixed.set(`${targetFolder}/${path}`, content);
          }
          addFiles(prefixed);
        } else {
          addFiles(rawFiles);
        }
      });
    };

    el.addEventListener('dragenter', onDragEnter);
    el.addEventListener('dragleave', onDragLeave);
    el.addEventListener('dragover', onDragOver);
    el.addEventListener('drop', onDrop);

    return () => {
      el.removeEventListener('dragenter', onDragEnter);
      el.removeEventListener('dragleave', onDragLeave);
      el.removeEventListener('dragover', onDragOver);
      el.removeEventListener('drop', onDrop);
    };
  }, [addFiles, moveNode]);

  const handleInternalDragStart = useCallback((e: React.DragEvent, path: string) => {
    e.dataTransfer.setData(INTERNAL_DRAG_MIME, path);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (!fileList || fileList.length === 0) return;
      const files = await readFilesFromInput(fileList);
      if (files.size > 0) addFiles(files);
      e.target.value = '';
    },
    [addFiles]
  );

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full relative transition-colors ${
        isDragging ? 'ring-2 ring-inset ring-accent/40 bg-accent/5' : ''
      }`}
    >
      {/* Sidebar Header */}
      <div className="px-3 py-3 border-b border-border flex items-center justify-between">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Skill Explorer
        </span>
        <div className="relative" ref={addMenuRef}>
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            title="Add..."
            className="p-1 rounded hover:bg-bg-hover text-text-muted hover:text-text-secondary transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          {showAddMenu && (
            <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-bg-primary border border-border rounded-lg shadow-lg py-1">
              <button
                className="w-full text-left px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-hover transition-colors"
                onClick={() => {
                  const store = useSkillStore.getState();
                  const { files } = store;
                  // Find a unique folder name
                  let folderName = 'untitled-skill';
                  let counter = 1;
                  while (
                    files.has(`${folderName}/SKILL.md`) ||
                    files.has(`${folderName}/.gitkeep`)
                  ) {
                    folderName = `untitled-skill-${counter}`;
                    counter++;
                  }
                  store.createFolder('', folderName);
                  store.createFile(folderName, 'SKILL.md');
                  setShowAddMenu(false);
                }}
              >
                New SKILL.md
              </button>
              <button
                className="w-full text-left px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-hover transition-colors"
                onClick={() => {
                  setModal({ type: 'new-file', parentPath: '' });
                  setShowAddMenu(false);
                }}
              >
                New Markdown
              </button>
              <button
                className="w-full text-left px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-hover transition-colors"
                onClick={() => {
                  setModal({ type: 'new-folder', parentPath: '' });
                  setShowAddMenu(false);
                }}
              >
                New Folder
              </button>
              <button
                className="w-full text-left px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-hover transition-colors"
                onClick={() => {
                  handleUploadClick();
                  setShowAddMenu(false);
                }}
              >
                Upload
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1 relative">
        {/* Root drop zone: shows line at top of tree when dragging over empty space */}
        {isDragging && !dropIndicator && (
          <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
            <DropLine depth={0} />
          </div>
        )}
        {fileTree.map(node => (
          <TreeNode
            key={node.path}
            node={node}
            depth={0}
            activeFile={activeFile}
            dropIndicator={dropIndicator}
            onDragStart={handleInternalDragStart}
          />
        ))}
      </div>
    </div>
  );
}

/** Horizontal drop indicator line */
function DropLine({ depth }: { depth: number }) {
  return (
    <div
      className="absolute left-0 right-0 z-10 pointer-events-none"
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
    >
      <div className="flex items-center">
        <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
        <div className="h-[2px] bg-accent flex-1" />
      </div>
    </div>
  );
}

function TreeNode({
  node,
  depth,
  activeFile,
  dropIndicator,
  onDragStart,
}: {
  node: FileNode;
  depth: number;
  activeFile: string | null;
  dropIndicator: DropIndicator | null;
  onDragStart: (e: React.DragEvent, path: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { setActiveFile, setContextMenu } = useSkillStore();
  const isActive = activeFile === node.path;
  const isSkillMd = node.name === 'SKILL.md';

  const isTarget = dropIndicator?.path === node.path;
  const showLineAbove = isTarget && dropIndicator.position === 'above';
  const showLineBelow = isTarget && dropIndicator.position === 'below';
  const showInside = isTarget && dropIndicator.position === 'inside';

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      path: node.path,
      type: node.type,
    });
  };

  if (node.type === 'folder') {
    return (
      <div>
        <div className="relative">
          {showLineAbove && <div className="absolute top-0 left-0 right-0 z-10"><DropLine depth={depth} /></div>}
          <div
            draggable
            onDragStart={(e) => onDragStart(e, node.path)}
            data-node-path={node.path}
            data-node-type="folder"
            onClick={() => setExpanded(!expanded)}
            onContextMenu={handleContextMenu}
            className={`
              w-full flex items-center gap-1.5 px-2 py-1 text-sm cursor-pointer
              transition-colors text-left select-none
              ${showInside
                ? 'bg-accent/15 text-accent'
                : 'hover:bg-bg-hover'
              }
            `}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {expanded ? (
              <ChevronDown className={`w-3.5 h-3.5 shrink-0 ${showInside ? 'text-accent' : 'text-text-muted'}`} />
            ) : (
              <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${showInside ? 'text-accent' : 'text-text-muted'}`} />
            )}
            {expanded ? (
              <FolderOpen className={`w-4 h-4 shrink-0 ${showInside ? 'text-accent' : 'text-accent/70'}`} />
            ) : (
              <FolderClosed className={`w-4 h-4 shrink-0 ${showInside ? 'text-accent' : 'text-accent/70'}`} />
            )}
            <span className={`truncate ${showInside ? 'text-accent font-medium' : 'text-text-secondary'}`}>
              {node.name}
            </span>
          </div>
          {showLineBelow && <div className="absolute bottom-0 left-0 right-0 z-10"><DropLine depth={depth} /></div>}
        </div>
        {expanded &&
          node.children?.map(child => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              activeFile={activeFile}
              dropIndicator={dropIndicator}
              onDragStart={onDragStart}
            />
          ))}
      </div>
    );
  }

  if (node.name === '.gitkeep') return null;

  return (
    <div className="relative">
      {showLineAbove && <div className="absolute top-0 left-0 right-0 z-10"><DropLine depth={depth} /></div>}
      <button
        draggable
        onDragStart={(e) => onDragStart(e, node.path)}
        data-node-path={node.path}
        data-node-type="file"
        onClick={() => setActiveFile(node.path)}
        onContextMenu={handleContextMenu}
        className={`
          w-full flex items-center gap-1.5 px-2 py-1 text-sm
          transition-colors text-left
          ${isActive
            ? 'bg-bg-active text-text-primary'
            : 'hover:bg-bg-hover text-text-secondary'
          }
        `}
        style={{ paddingLeft: `${depth * 12 + 22}px` }}
      >
        <FileText
          className={`w-4 h-4 shrink-0 ${isSkillMd ? 'text-accent' : 'text-text-muted'}`}
        />
        <span className={`truncate ${isSkillMd ? 'font-medium text-accent' : ''}`}>
          {node.name}
        </span>
      </button>
      {showLineBelow && <div className="absolute bottom-0 left-0 right-0 z-10"><DropLine depth={depth} /></div>}
    </div>
  );
}
