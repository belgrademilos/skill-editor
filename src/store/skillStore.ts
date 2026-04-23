import { create } from 'zustand';
import { parseFrontmatter, serializeFrontmatter } from '../lib/frontmatter';
import { saveSession, loadSession, type StoredSession } from '../lib/storage';
import {
  PLACEHOLDER_SKILLS,
  syncLibraryWithRestoredContent,
  useSkillLibraryStore,
} from './skillLibraryStore';
import { useAuthStore } from './authStore';

interface SkillState {
  /** Full document content including YAML frontmatter */
  content: string;
  isDirty: boolean;

  // Derived (kept in sync reactively)
  skillName: string;

  // Actions
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
      // Skip local IndexedDB persistence when signed in — Firestore is the source of truth.
      if (useAuthStore.getState().status === 'signed-in') return;
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
