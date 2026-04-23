import { readSkillMdFromArchive } from './zip';
import { parseFrontmatter } from './frontmatter';

export interface ParsedSkill {
  name: string;
  content: string;
}

const DEFAULT_BRANCHES = ['main', 'master'];

interface RawCandidate {
  url: string;
  fallbackName: string;
}

export async function parseSkillFile(file: File): Promise<ParsedSkill> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'md') {
    const content = await file.text();
    const parsed = parseFrontmatter(content);
    if (!parsed.frontmatter.name || !parsed.frontmatter.description) {
      throw new Error('Invalid skill.md file.');
    }
    return { name: parsed.frontmatter.name, content };
  }

  if (ext === 'skill' || ext === 'zip') {
    const content = await readSkillMdFromArchive(file);
    const name = parseFrontmatter(content).frontmatter.name || 'untitled';
    return { name, content };
  }

  throw new Error('Unsupported file. Use .skill, .zip, or .md');
}

function joinRawPath(parts: string[]): string {
  return parts.map((part) => encodeURIComponent(part)).join('/');
}

function rawGitHubUrl(owner: string, repo: string, path: string[]): string {
  return `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${joinRawPath(path)}`;
}

function addCandidate(candidates: RawCandidate[], seen: Set<string>, url: string, fallbackName: string) {
  if (seen.has(url)) return;
  seen.add(url);
  candidates.push({ url, fallbackName });
}

function gitHubRawCandidates(input: string): RawCandidate[] {
  let parsed: URL;
  try {
    parsed = new URL(input.trim());
  } catch {
    throw new Error('Invalid link');
  }

  const candidates: RawCandidate[] = [];
  const seen = new Set<string>();

  if (parsed.hostname === 'raw.githubusercontent.com') {
    const [, repo = 'untitled'] = parsed.pathname.split('/').filter(Boolean).map(decodeURIComponent);
    addCandidate(candidates, seen, parsed.toString(), repo.replace(/\.git$/, ''));
    return candidates;
  }

  if (parsed.hostname !== 'github.com') {
    throw new Error('Invalid link');
  }

  const segments = parsed.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  const [owner, repoWithGit, viewType, ...rest] = segments;

  if (!owner || !repoWithGit) {
    throw new Error('Invalid link');
  }

  const repo = repoWithGit.replace(/\.git$/, '');

  if (viewType === 'blob' || viewType === 'tree') {
    if (rest.length === 0) {
      throw new Error('Invalid link');
    }

    const path = viewType === 'blob' ? rest : [...rest, 'SKILL.md'];
    addCandidate(candidates, seen, rawGitHubUrl(owner, repo, path), repo);
    return candidates;
  }

  for (const branch of DEFAULT_BRANCHES) {
    addCandidate(candidates, seen, rawGitHubUrl(owner, repo, [branch, 'SKILL.md']), repo);
  }

  return candidates;
}

export async function parseSkillFromGitHub(url: string): Promise<ParsedSkill> {
  for (const candidate of gitHubRawCandidates(url)) {
    try {
      const res = await fetch(candidate.url);
      if (res.ok) {
        const content = await res.text();
        const name = parseFrontmatter(content).frontmatter.name || candidate.fallbackName;
        return { name, content };
      }
    } catch {
      // Try the next candidate.
    }
  }

  throw new Error('Invalid link');
}
