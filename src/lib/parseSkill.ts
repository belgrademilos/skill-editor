import { readSkillMdFromArchive } from './zip';
import { parseFrontmatter } from './frontmatter';

export interface ParsedSkill {
  name: string;
  content: string;
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

export async function parseSkillFromGitHub(url: string): Promise<ParsedSkill> {
  const match = url.trim().match(/^https?:\/\/github\.com\/([^/]+)\/([^/\s#?]+)/);
  if (!match) throw new Error('Invalid link');

  const owner = match[1];
  const repo = match[2].replace(/\.git$/, '');

  for (const branch of ['main', 'master']) {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/SKILL.md`;
    try {
      const res = await fetch(rawUrl);
      if (res.ok) {
        const content = await res.text();
        const name = parseFrontmatter(content).frontmatter.name || repo;
        return { name, content };
      }
    } catch {
      // try next branch
    }
  }

  throw new Error('Invalid link');
}
