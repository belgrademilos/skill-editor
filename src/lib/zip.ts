import JSZip from 'jszip';

function shouldSkipPath(path: string): boolean {
  return path.includes('__MACOSX') || path.split('/').some((part) => part.startsWith('.'));
}

function normalizePath(path: string): string {
  return path.split('/').filter(Boolean).join('/');
}

function findSkillMd(files: Map<string, string>): string | null {
  for (const key of files.keys()) {
    if (key === 'SKILL.md' || key.endsWith('/SKILL.md')) return key;
  }
  for (const key of files.keys()) {
    if (key.endsWith('.md')) return key;
  }
  return null;
}

function isMarkdownFile(path: string): boolean {
  return path === 'SKILL.md' || path.endsWith('/SKILL.md') || path.endsWith('.md');
}

export function stripCommonPrefix(files: Map<string, string>): Map<string, string> {
  const paths = Array.from(files.keys());
  if (paths.length === 0) return files;

  const parts = paths.map((path) => path.split('/'));
  const firstParts = parts[0];
  let commonDepth = 0;

  for (let i = 0; i < firstParts.length - 1; i += 1) {
    const segment = firstParts[i];
    if (parts.every((pathParts) => pathParts[i] === segment)) {
      commonDepth = i + 1;
    } else {
      break;
    }
  }

  if (commonDepth === 0) return files;

  const stripped = new Map<string, string>();
  for (const [path, content] of files) {
    const newPath = path.split('/').slice(commonDepth).join('/');
    if (newPath) stripped.set(newPath, content);
  }
  return stripped;
}

export async function readSkillMdFromArchive(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const files = new Map<string, string>();

  for (const [path, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir || shouldSkipPath(path)) continue;
    const normalizedPath = normalizePath(path);
    if (isMarkdownFile(normalizedPath)) {
      files.set(normalizedPath, await zipEntry.async('string'));
    }
  }

  const normalizedFiles = stripCommonPrefix(files);
  const skillMdPath = findSkillMd(normalizedFiles);
  if (!skillMdPath) throw new Error('No SKILL.md found in archive.');

  return normalizedFiles.get(skillMdPath)!;
}

export async function packAsSkill(content: string, skillName: string): Promise<Blob> {
  const zip = new JSZip();
  zip.file(`${skillName}/SKILL.md`, content);
  return zip.generateAsync({ type: 'blob' });
}

export function exportSingleMd(content: string): Blob {
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
