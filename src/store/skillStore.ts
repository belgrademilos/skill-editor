import { create } from 'zustand';
import { unpackSkill, stripCommonPrefix } from '../lib/zip';
import { parseFrontmatter, serializeFrontmatter } from '../lib/frontmatter';
import { saveSession, loadSession, type StoredSession } from '../lib/storage';
import {
  PLACEHOLDER_SKILLS,
  syncLibraryWithRestoredContent,
  useSkillLibraryStore,
} from './skillLibraryStore';

interface SkillState {
  /** Full document content including YAML frontmatter */
  content: string;
  isDirty: boolean;

  // Derived (kept in sync reactively)
  skillName: string;

  // Actions
  loadSkillFile: (file: File) => Promise<void>;
  loadMdFile: (file: File) => Promise<void>;
  loadFromGitHub: (url: string) => Promise<void>;
  restoreSession: () => Promise<boolean>;
  updateContent: (content: string) => void;
  setActiveContent: (content: string) => void;
  startFromScratch: () => void;
  persistSession: () => void;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

const DEFAULT_SKILL = `---
name: untitled-skill
description:
---

`;

function extractSkillName(content: string): string {
  try {
    const parsed = parseFrontmatter(content);
    return parsed.frontmatter.name || 'Untitled Skill';
  } catch {
    return 'Untitled Skill';
  }
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

const INITIAL_SKILL = PLACEHOLDER_SKILLS[0];

export const useSkillStore = create<SkillState>((set, get) => ({
  content: INITIAL_SKILL?.content ?? '',
  isDirty: false,
  skillName: INITIAL_SKILL?.name ?? '',

  loadSkillFile: async (file: File) => {
    const { files: rawFiles } = await unpackSkill(file);
    const files = stripCommonPrefix(rawFiles);

    const skillMdPath = findSkillMd(files);
    if (!skillMdPath) throw new Error('No SKILL.md found in archive.');

    const content = files.get(skillMdPath)!;
    set({
      content,
      skillName: extractSkillName(content),
      isDirty: false,
    });
    get().persistSession();
  },

  loadFromGitHub: async (url: string) => {
    // Parse GitHub repo URL
    const match = url.trim().match(
      /^https?:\/\/github\.com\/([^/]+)\/([^/\s#?]+)/
    );
    if (!match) throw new Error('Invalid link');

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, '');

    // Try fetching SKILL.md from common default branches
    let content: string | null = null;
    for (const branch of ['main', 'master']) {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/SKILL.md`;
      try {
        const res = await fetch(rawUrl);
        if (res.ok) {
          content = await res.text();
          break;
        }
      } catch {
        // Try next branch
      }
    }

    if (!content) throw new Error('Invalid link');

    set({
      content,
      skillName: extractSkillName(content),
      isDirty: false,
    });
    get().persistSession();
  },

  loadMdFile: async (file: File) => {
    const text = await file.text();
    const parsed = parseFrontmatter(text);

    if (!parsed.frontmatter.name || !parsed.frontmatter.description) {
      throw new Error('Invalid skill.md file.');
    }

    set({
      content: text,
      skillName: parsed.frontmatter.name,
      isDirty: false,
    });
    get().persistSession();
  },

  restoreSession: async () => {
    const session = await loadSession();
    if (!session) return false;

    let content = '';

    if (session.files && session.files.length > 0) {
      const files = new Map(session.files);
      const skillMdPath = findSkillMd(files);
      if (skillMdPath) {
        const body = files.get(skillMdPath) || '';
        // Old sessions stored frontmatter separately — recombine
        if (session.frontmatterMap && session.frontmatterMap.length > 0) {
          const fmMap = new Map(session.frontmatterMap);
          const fm = fmMap.values().next().value;
          if (fm) {
            content = serializeFrontmatter(
              { name: fm.name, description: fm.description },
              body
            );
          } else {
            content = body;
          }
        } else {
          content = body;
        }
      }
    }

    set({
      content,
      skillName: extractSkillName(content),
      isDirty: false,
    });
    syncLibraryWithRestoredContent(content);
    return true;
  },

  updateContent: (content: string) => {
    set({ content, skillName: extractSkillName(content), isDirty: true });
    useSkillLibraryStore.getState().updateSelectedContent(content);
    get().persistSession();
  },

  /** Load a skill's content into the editor without marking dirty (e.g., when switching skills). */
  setActiveContent: (content: string) => {
    set({ content, skillName: extractSkillName(content), isDirty: false });
  },

  startFromScratch: () => {
    set({
      content: DEFAULT_SKILL,
      skillName: 'untitled-skill',
      isDirty: false,
    });
    get().persistSession();
  },

  persistSession: () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      const { content, skillName } = get();
      const session: StoredSession = {
        skillName,
        files: [['SKILL.md', content]],
        activeFile: 'SKILL.md',
        openTabs: ['SKILL.md'],
        timestamp: Date.now(),
      };
      await saveSession(session);
    }, 1000);
  },
}));
