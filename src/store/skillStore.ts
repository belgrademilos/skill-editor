import { create } from 'zustand';
import { unpackSkill, stripCommonPrefix, buildTree, type FileNode } from '../lib/zip';
import { parseFrontmatter, serializeFrontmatter, type SkillFrontmatter } from '../lib/frontmatter';
import { saveSession, loadSession, clearSession, type StoredSession } from '../lib/storage';

interface SkillState {
  // Skill data
  skillName: string;
  skillDescription: string;
  frontmatter: SkillFrontmatter | null;
  frontmatterMap: Map<string, SkillFrontmatter>;
  files: Map<string, string>;
  fileOrder: string[];
  fileTree: FileNode[];
  isDirty: boolean;

  // UI state
  saveStatus: 'idle' | 'saving' | 'saved';
  activeFile: string | null;
  openTabs: string[];
  view: 'intro' | 'editor';
  contextMenu: { x: number; y: number; path: string; type: 'file' | 'folder' } | null;
  modal: {
    type: 'new-file' | 'new-folder' | 'rename';
    parentPath: string;
    defaultValue?: string;
    originalPath?: string;
  } | null;

  // Actions
  loadSkillFile: (file: File) => Promise<void>;
  loadMdFile: (file: File) => Promise<void>;
  restoreSession: () => Promise<boolean>;
  updateFile: (path: string, content: string) => void;
  setActiveFile: (path: string) => void;
  closeTab: (path: string) => void;
  renameFile: (oldPath: string, newPath: string) => void;
  reorderFile: (sourcePath: string, targetPath: string, position: 'above' | 'below') => void;
  deleteFile: (path: string) => void;
  createFile: (parentPath: string, name: string) => void;
  createFolder: (parentPath: string, name: string) => void;
  addFiles: (incoming: Map<string, string>) => void;
  duplicateFile: (path: string) => void;
  duplicateSkill: () => void;
  updateSkillName: (name: string) => void;
  updateSkillDescription: (desc: string) => void;
  setView: (view: SkillState['view']) => void;
  setContextMenu: (menu: SkillState['contextMenu']) => void;
  setModal: (modal: SkillState['modal']) => void;
  startFromScratch: () => void;
  closeSkill: () => void;
  getSkillMdContent: () => string;
  persistSession: (showSaveStatus?: boolean) => void;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let savedTimeout: ReturnType<typeof setTimeout> | null = null;

/** Default file order: SKILL.md first, then alphabetical */
function defaultFileOrder(files: Map<string, string>): string[] {
  return Array.from(files.keys()).sort((a, b) => {
    const aIsSkill = a.endsWith('SKILL.md') || a === 'SKILL.md';
    const bIsSkill = b.endsWith('SKILL.md') || b === 'SKILL.md';
    if (aIsSkill && !bIsSkill) return -1;
    if (!aIsSkill && bIsSkill) return 1;
    return a.localeCompare(b);
  });
}

/** Keep fileOrder in sync with files map: preserve order for existing paths, append new ones */
function syncFileOrder(currentOrder: string[], newFiles: Map<string, string>): string[] {
  const fileSet = new Set(newFiles.keys());
  const kept = currentOrder.filter(p => fileSet.has(p));
  const keptSet = new Set(kept);
  const added = Array.from(fileSet).filter(p => !keptSet.has(p));
  return [...kept, ...added];
}

function findSkillMdPath(files: Map<string, string>): string | null {
  for (const key of files.keys()) {
    if (key === 'SKILL.md' || key.endsWith('/SKILL.md')) {
      return key;
    }
  }
  return null;
}

export const useSkillStore = create<SkillState>((set, get) => ({
  skillName: '',
  skillDescription: '',
  frontmatter: null,
  frontmatterMap: new Map(),
  files: new Map(),
  fileOrder: [],
  fileTree: [],
  isDirty: false,
  saveStatus: 'idle',
  activeFile: null,
  openTabs: [],
  view: 'intro',
  contextMenu: null,
  modal: null,

  loadSkillFile: async (file: File) => {
    const { files: rawFiles } = await unpackSkill(file);
    const files = stripCommonPrefix(rawFiles);

    // Parse frontmatter for all .md files that have name + description
    const fmMap = new Map<string, SkillFrontmatter>();
    for (const [path, content] of files) {
      if (path.endsWith('.md')) {
        const parsed = parseFrontmatter(content);
        if (parsed.frontmatter.name && parsed.frontmatter.description) {
          fmMap.set(path, parsed.frontmatter);
          // Store only the body in files map (frontmatter is managed separately)
          files.set(path, parsed.body);
        }
      }
    }

    const fileOrder = defaultFileOrder(files);
    const tree = buildTree(files, fileOrder);

    // Primary SKILL.md is whichever we'll open first
    const skillMdPath = findSkillMdPath(files);
    const frontmatter = skillMdPath ? fmMap.get(skillMdPath)! : { name: '', description: '' };

    set({
      skillName: frontmatter.name || file.name.replace(/\.(skill|zip)$/, ''),
      skillDescription: frontmatter.description || '',
      frontmatter,
      frontmatterMap: fmMap,
      files,
      fileOrder,
      fileTree: tree,
      activeFile: skillMdPath || (tree.length > 0 ? tree[0].path : null),
      openTabs: skillMdPath ? [skillMdPath] : [],
      view: 'editor',
      isDirty: false,
    });

    get().persistSession();
  },

  loadMdFile: async (file: File) => {
    const text = await file.text();
    const parsed = parseFrontmatter(text);

    // Validate: must have YAML frontmatter with both name and description
    if (!parsed.frontmatter.name || !parsed.frontmatter.description) {
      throw new Error('Invalid skill.md file.');
    }

    // Preserve original filename (use SKILL.md as fallback)
    const path = file.name || 'SKILL.md';
    const fmMap = new Map<string, SkillFrontmatter>();
    fmMap.set(path, parsed.frontmatter);

    const files = new Map<string, string>();
    files.set(path, parsed.body);
    const fileOrder = [path];

    set({
      skillName: parsed.frontmatter.name,
      skillDescription: parsed.frontmatter.description,
      frontmatter: parsed.frontmatter,
      frontmatterMap: fmMap,
      files,
      fileOrder,
      fileTree: buildTree(files, fileOrder),
      activeFile: path,
      openTabs: [path],
      view: 'editor',
      isDirty: false,
    });

    get().persistSession();
  },

  restoreSession: async () => {
    const session = await loadSession();
    if (!session) return false;

    const files = new Map(session.files);
    const fileOrder = session.fileOrder || defaultFileOrder(files);
    const tree = buildTree(files, fileOrder);

    // Restore frontmatter map from session, or fall back to parsing .md files
    const fmMap = session.frontmatterMap
      ? new Map<string, SkillFrontmatter>(session.frontmatterMap)
      : new Map<string, SkillFrontmatter>();
    if (!session.frontmatterMap) {
      // Legacy sessions: try to parse frontmatter from .md file content
      for (const [path, content] of files) {
        if (path.endsWith('.md')) {
          const parsed = parseFrontmatter(content);
          if (parsed.frontmatter.name && parsed.frontmatter.description) {
            fmMap.set(path, parsed.frontmatter);
            files.set(path, parsed.body);
          }
        }
      }
    }

    const activeFile = session.activeFile;
    const activeFm = activeFile ? fmMap.get(activeFile) : null;
    const frontmatter = activeFm || fmMap.values().next().value || { name: session.skillName, description: '' };

    set({
      skillName: frontmatter.name,
      skillDescription: frontmatter.description,
      files,
      fileOrder,
      fileTree: tree,
      activeFile,
      openTabs: session.openTabs,
      view: 'editor',
      isDirty: false,
      frontmatter,
      frontmatterMap: fmMap,
    });

    return true;
  },

  updateFile: (path: string, content: string) => {
    const { files, fileOrder } = get();
    const newFiles = new Map(files);
    newFiles.set(path, content);
    const tree = buildTree(newFiles, fileOrder);
    set({ files: newFiles, fileTree: tree, isDirty: true });
    get().persistSession(true);
  },

  setActiveFile: (path: string) => {
    const { openTabs, frontmatterMap } = get();
    const newTabs = openTabs.includes(path) ? openTabs : [...openTabs, path];
    const updates: Partial<SkillState> = { activeFile: path, openTabs: newTabs };

    // When switching to a .md file with frontmatter, load it into the active fields
    const fm = frontmatterMap.get(path);
    if (fm) {
      updates.skillName = fm.name;
      updates.skillDescription = fm.description;
      updates.frontmatter = fm;
    }

    set(updates);
    get().persistSession();
  },

  closeTab: (path: string) => {
    const { openTabs, activeFile } = get();
    const newTabs = openTabs.filter(t => t !== path);
    let newActive = activeFile;
    if (activeFile === path) {
      const idx = openTabs.indexOf(path);
      newActive = newTabs[Math.min(idx, newTabs.length - 1)] || null;
    }
    set({ openTabs: newTabs, activeFile: newActive });
    get().persistSession();
  },

  renameFile: (oldPath: string, newPath: string) => {
    const { files, openTabs, activeFile, fileOrder } = get();
    const newFiles = new Map<string, string>();

    for (const [path, content] of files) {
      if (path === oldPath) {
        newFiles.set(newPath, content);
      } else if (path.startsWith(oldPath + '/')) {
        newFiles.set(newPath + path.slice(oldPath.length), content);
      } else {
        newFiles.set(path, content);
      }
    }

    // Preserve the source folder if it's now empty (e.g. after dragging the last file out)
    const oldParent = oldPath.includes('/') ? oldPath.slice(0, oldPath.lastIndexOf('/')) : '';
    if (oldParent) {
      const folderStillHasFiles = Array.from(newFiles.keys()).some(
        p => p.startsWith(oldParent + '/') && p !== oldParent + '/.gitkeep'
      );
      if (!folderStillHasFiles) {
        newFiles.set(oldParent + '/.gitkeep', '');
      }
    }

    // Remove .gitkeep from the target folder since it now has a real file
    const newParent = newPath.includes('/') ? newPath.slice(0, newPath.lastIndexOf('/')) : '';
    if (newParent && newFiles.has(newParent + '/.gitkeep')) {
      newFiles.delete(newParent + '/.gitkeep');
    }

    const remapPath = (p: string) => {
      if (p === oldPath) return newPath;
      if (p.startsWith(oldPath + '/')) return newPath + p.slice(oldPath.length);
      return p;
    };

    // Build new fileOrder: remap paths, then replace the moved path with .gitkeep
    // if the source folder is now empty (so the folder stays in its original position)
    const gitkeepPath = oldParent ? oldParent + '/.gitkeep' : '';
    const folderNowEmpty = gitkeepPath && newFiles.has(gitkeepPath);
    let remappedOrder = fileOrder.map(remapPath);
    if (folderNowEmpty) {
      // Insert .gitkeep right where the moved file was (before syncing removes it)
      const movedIdx = remappedOrder.indexOf(newPath);
      if (movedIdx >= 0) {
        remappedOrder.splice(movedIdx, 0, gitkeepPath);
      }
    }
    // Remove .gitkeep entries from target folder if it was cleaned up
    const targetGitkeep = newParent ? newParent + '/.gitkeep' : '';
    if (targetGitkeep && !newFiles.has(targetGitkeep)) {
      remappedOrder = remappedOrder.filter(p => p !== targetGitkeep);
    }
    const newOrder = syncFileOrder(remappedOrder, newFiles);

    const tree = buildTree(newFiles, newOrder);
    const newTabs = openTabs.map(remapPath);
    const newActive = activeFile ? remapPath(activeFile) : activeFile;

    set({ files: newFiles, fileOrder: newOrder, fileTree: tree, openTabs: newTabs, activeFile: newActive, isDirty: true });
    get().persistSession(true);
  },

  reorderFile: (sourcePath: string, targetPath: string, position: 'above' | 'below') => {
    const { fileOrder, files } = get();
    const sourceIsFile = files.has(sourcePath);

    // Collect all paths belonging to source node (single file or entire folder)
    const sourcePaths = sourceIsFile
      ? [sourcePath]
      : fileOrder.filter(p => p.startsWith(sourcePath + '/'));
    if (sourcePaths.length === 0) return;

    // Remove source paths from order
    const remaining = fileOrder.filter(p => !sourcePaths.includes(p));

    // Find insert index based on target
    const targetIsFile = files.has(targetPath);
    let insertIdx: number;
    if (targetIsFile) {
      const idx = remaining.indexOf(targetPath);
      if (idx === -1) return;
      insertIdx = position === 'above' ? idx : idx + 1;
    } else {
      // Target is a folder — find its first/last path
      if (position === 'above') {
        insertIdx = remaining.findIndex(p => p.startsWith(targetPath + '/'));
        if (insertIdx === -1) insertIdx = remaining.length;
      } else {
        let last = -1;
        remaining.forEach((p, i) => { if (p.startsWith(targetPath + '/')) last = i; });
        insertIdx = last + 1;
      }
    }

    remaining.splice(insertIdx, 0, ...sourcePaths);
    const tree = buildTree(files, remaining);
    set({ fileOrder: remaining, fileTree: tree, isDirty: true });
    get().persistSession(true);
  },

  deleteFile: (path: string) => {
    const { files, openTabs, activeFile, fileOrder } = get();
    const newFiles = new Map<string, string>();

    for (const [p, content] of files) {
      if (p === path || p.startsWith(path + '/')) continue;
      newFiles.set(p, content);
    }

    const newOrder = syncFileOrder(fileOrder, newFiles);
    const tree = buildTree(newFiles, newOrder);
    const newTabs = openTabs.filter(t => t !== path && !t.startsWith(path + '/'));
    let newActive = activeFile;
    if (activeFile === path || activeFile?.startsWith(path + '/')) {
      newActive = newTabs[0] || null;
    }

    set({ files: newFiles, fileOrder: newOrder, fileTree: tree, openTabs: newTabs, activeFile: newActive, isDirty: true });
    get().persistSession(true);
  },

  createFile: (parentPath: string, name: string) => {
    const { files, fileOrder } = get();
    const newPath = parentPath ? `${parentPath}/${name}` : name;
    if (files.has(newPath)) return;

    const newFiles = new Map(files);
    newFiles.set(newPath, '');
    // Remove .gitkeep if folder is no longer empty
    if (parentPath && newFiles.has(parentPath + '/.gitkeep')) {
      newFiles.delete(parentPath + '/.gitkeep');
    }
    const newOrder = syncFileOrder(fileOrder, newFiles);
    const tree = buildTree(newFiles, newOrder);
    set({ files: newFiles, fileOrder: newOrder, fileTree: tree, isDirty: true });
    get().setActiveFile(newPath);
    get().persistSession(true);
  },

  createFolder: (parentPath: string, name: string) => {
    const { files, fileOrder } = get();
    // Create a placeholder file to represent the folder
    const newPath = parentPath ? `${parentPath}/${name}/.gitkeep` : `${name}/.gitkeep`;
    if (files.has(newPath)) return;

    const newFiles = new Map(files);
    newFiles.set(newPath, '');
    const newOrder = syncFileOrder(fileOrder, newFiles);
    const tree = buildTree(newFiles, newOrder);
    set({ files: newFiles, fileOrder: newOrder, fileTree: tree, isDirty: true });
    get().persistSession(true);
  },

  addFiles: (incoming: Map<string, string>) => {
    const { files, fileOrder } = get();
    const newFiles = new Map(files);
    let lastPath = '';
    for (const [path, content] of incoming) {
      newFiles.set(path, content);
      lastPath = path;
      // Remove .gitkeep if folder now has a real file
      const parent = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
      if (parent && newFiles.has(parent + '/.gitkeep')) {
        newFiles.delete(parent + '/.gitkeep');
      }
    }
    const newOrder = syncFileOrder(fileOrder, newFiles);
    const tree = buildTree(newFiles, newOrder);
    set({ files: newFiles, fileOrder: newOrder, fileTree: tree, isDirty: true });
    if (lastPath) get().setActiveFile(lastPath);
    get().persistSession(true);
  },

  duplicateFile: (path: string) => {
    const { files, fileOrder } = get();
    const content = files.get(path);
    if (content === undefined) return;

    const ext = path.lastIndexOf('.');
    const newPath = ext > 0
      ? `${path.slice(0, ext)}-copy${path.slice(ext)}`
      : `${path}-copy`;

    const newFiles = new Map(files);
    newFiles.set(newPath, content);
    // Insert copy right after original in order
    const newOrder = [...fileOrder];
    const idx = newOrder.indexOf(path);
    if (idx >= 0) {
      newOrder.splice(idx + 1, 0, newPath);
    } else {
      newOrder.push(newPath);
    }
    const tree = buildTree(newFiles, newOrder);
    set({ files: newFiles, fileOrder: newOrder, fileTree: tree, isDirty: true });
    get().setActiveFile(newPath);
    get().persistSession(true);
  },

  duplicateSkill: () => {
    const { skillName, files, fileOrder, frontmatter, frontmatterMap, activeFile } = get();
    const newName = `${skillName}-copy`;
    const newFiles = new Map(files);
    const newFrontmatter = frontmatter ? { ...frontmatter, name: newName } : { name: newName, description: '' };
    const newMap = new Map(frontmatterMap);
    if (activeFile && frontmatterMap.has(activeFile)) {
      newMap.set(activeFile, newFrontmatter);
    }

    set({
      skillName: newName,
      frontmatter: newFrontmatter,
      frontmatterMap: newMap,
      files: newFiles,
      fileTree: buildTree(newFiles, fileOrder),
      isDirty: true,
    });
    get().persistSession(true);
  },

  updateSkillName: (name: string) => {
    const { frontmatter, frontmatterMap, activeFile } = get();
    const updatedFm = frontmatter ? { ...frontmatter, name } : { name, description: '' };
    const newMap = new Map(frontmatterMap);
    if (activeFile && frontmatterMap.has(activeFile)) {
      newMap.set(activeFile, updatedFm);
    }
    set({
      skillName: name,
      frontmatter: updatedFm,
      frontmatterMap: newMap,
      isDirty: true,
    });
    get().persistSession(true);
  },

  updateSkillDescription: (desc: string) => {
    const { frontmatter, frontmatterMap, activeFile } = get();
    const updatedFm = frontmatter ? { ...frontmatter, description: desc } : { name: '', description: desc };
    const newMap = new Map(frontmatterMap);
    if (activeFile && frontmatterMap.has(activeFile)) {
      newMap.set(activeFile, updatedFm);
    }
    set({
      skillDescription: desc,
      frontmatter: updatedFm,
      frontmatterMap: newMap,
      isDirty: true,
    });
    get().persistSession(true);
  },

  setView: (view) => set({ view }),
  setContextMenu: (menu) => set({ contextMenu: menu }),
  setModal: (modal) => set({ modal }),

  startFromScratch: () => {
    const path = 'SKILL.md';
    const fm: SkillFrontmatter = { name: 'untitled-skill', description: '' };
    const fmMap = new Map<string, SkillFrontmatter>();
    fmMap.set(path, fm);

    const files = new Map<string, string>();
    files.set(path, '');
    const fileOrder = [path];

    set({
      skillName: 'untitled-skill',
      skillDescription: '',
      frontmatter: fm,
      frontmatterMap: fmMap,
      files,
      fileOrder,
      fileTree: buildTree(files, fileOrder),
      activeFile: path,
      openTabs: [path],
      view: 'editor',
      isDirty: false,
    });

    get().persistSession();
  },

  closeSkill: () => {
    clearSession();
    set({
      skillName: '',
      skillDescription: '',
      frontmatter: null,
      frontmatterMap: new Map(),
      files: new Map(),
      fileOrder: [],
      fileTree: [],
      activeFile: null,
      openTabs: [],
      view: 'intro',
      isDirty: false,
      saveStatus: 'idle',
      contextMenu: null,
      modal: null,
    });
  },

  getSkillMdContent: () => {
    const { files, frontmatter, activeFile, frontmatterMap } = get();
    // If active file has frontmatter, return that; otherwise fall back to first SKILL.md
    const targetPath = (activeFile && frontmatterMap.has(activeFile))
      ? activeFile
      : findSkillMdPath(files);
    if (!targetPath) return '';
    const fm = frontmatterMap.get(targetPath) || frontmatter;
    if (!fm) return '';
    const body = files.get(targetPath) || '';
    return serializeFrontmatter(fm, body);
  },

  persistSession: (showSaveStatus = false) => {
    if (saveTimeout) clearTimeout(saveTimeout);
    const showStatus = showSaveStatus && get().isDirty;
    if (showStatus) {
      if (savedTimeout) clearTimeout(savedTimeout);
      set({ saveStatus: 'saving' });
    }
    saveTimeout = setTimeout(async () => {
      const { skillName, files, activeFile, openTabs, fileOrder, frontmatterMap } = get();
      const session: StoredSession = {
        skillName,
        files: Array.from(files.entries()),
        activeFile,
        openTabs,
        fileOrder,
        frontmatterMap: Array.from(frontmatterMap.entries()),
        timestamp: Date.now(),
      };
      await saveSession(session);
      if (showStatus) {
        set({ saveStatus: 'saved' });
        savedTimeout = setTimeout(() => set({ saveStatus: 'idle' }), 2000);
      }
    }, 1000);
  },
}));
