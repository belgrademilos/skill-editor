import JSZip from 'jszip';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

const IMAGE_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico', '.avif',
]);

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
};

export function isImageFile(path: string): boolean {
  const ext = path.substring(path.lastIndexOf('.')).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

function getMimeType(path: string): string {
  const ext = path.substring(path.lastIndexOf('.')).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

export async function unpackSkill(
  file: File
): Promise<{ tree: FileNode[]; files: Map<string, string> }> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const files = new Map<string, string>();

  const entries = Object.entries(zip.files);
  for (const [path, zipEntry] of entries) {
    if (zipEntry.dir) continue;
    // Skip macOS resource forks and hidden files
    if (path.includes('__MACOSX') || path.split('/').some(s => s.startsWith('.'))) continue;

    const normalizedPath = normalizePath(path);

    if (isImageFile(normalizedPath)) {
      // Extract binary files as base64 data URLs
      const base64 = await zipEntry.async('base64');
      const mime = getMimeType(normalizedPath);
      files.set(normalizedPath, `data:${mime};base64,${base64}`);
    } else {
      const content = await zipEntry.async('string');
      files.set(normalizedPath, content);
    }
  }

  const tree = buildTree(files);
  return { tree, files };
}

function normalizePath(path: string): string {
  // Remove leading directory if all files share a common root
  const parts = path.split('/').filter(Boolean);
  return parts.join('/');
}

export function stripCommonPrefix(files: Map<string, string>): Map<string, string> {
  const paths = Array.from(files.keys());
  if (paths.length === 0) return files;

  // Find common prefix directory
  const parts = paths.map(p => p.split('/'));
  const firstParts = parts[0];
  let commonDepth = 0;

  for (let i = 0; i < firstParts.length - 1; i++) {
    const segment = firstParts[i];
    if (parts.every(p => p[i] === segment)) {
      commonDepth = i + 1;
    } else {
      break;
    }
  }

  if (commonDepth === 0) return files;

  const result = new Map<string, string>();
  for (const [path, content] of files) {
    const newPath = path.split('/').slice(commonDepth).join('/');
    if (newPath) result.set(newPath, content);
  }
  return result;
}

export function buildTree(files: Map<string, string>, orderedPaths?: string[]): FileNode[] {
  const root: FileNode[] = [];

  // Use explicit order when provided, otherwise default sort (SKILL.md first, then alphabetical)
  let paths: string[];
  if (orderedPaths) {
    // Filter to only paths that exist in files, then append any missing ones
    const fileKeys = new Set(files.keys());
    const ordered = orderedPaths.filter(p => fileKeys.has(p));
    const orderedSet = new Set(ordered);
    const extra = Array.from(fileKeys).filter(p => !orderedSet.has(p));
    paths = [...ordered, ...extra];
  } else {
    paths = Array.from(files.keys()).sort((a, b) => {
      const aIsSkill = a.endsWith('SKILL.md') || a === 'SKILL.md';
      const bIsSkill = b.endsWith('SKILL.md') || b === 'SKILL.md';
      if (aIsSkill && !bIsSkill) return -1;
      if (!aIsSkill && bIsSkill) return 1;
      return a.localeCompare(b);
    });
  }

  for (const filePath of paths) {
    const parts = filePath.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');

      const existing = current.find(n => n.name === part);
      if (existing) {
        if (existing.children) {
          current = existing.children;
        }
      } else {
        const node: FileNode = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'folder',
          ...(isFile ? {} : { children: [] }),
        };
        current.push(node);
        if (!isFile && node.children) {
          current = node.children;
        }
      }
    }
  }

  return root;
}

export async function packAsSkill(
  files: Map<string, string>,
  skillName: string
): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder(skillName);
  if (!folder) throw new Error('Failed to create zip folder');

  for (const [path, content] of files) {
    // Skip placeholder files used to preserve empty folders
    if (path.endsWith('/.gitkeep')) continue;
    if (isImageFile(path) && content.startsWith('data:')) {
      // Convert data URL back to binary
      const base64 = content.split(',')[1];
      folder.file(path, base64, { base64: true });
    } else {
      folder.file(path, content);
    }
  }

  return zip.generateAsync({ type: 'blob' });
}

export async function packAsZip(
  files: Map<string, string>,
  skillName: string
): Promise<Blob> {
  return packAsSkill(files, skillName);
}

export function exportSingleMd(content: string, _filename: string): Blob {
  return new Blob([content], { type: 'text/markdown' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
