import { create } from 'zustand';
import { parseFrontmatter } from '../lib/frontmatter';
import elevenStarSkill from './placeholder-skills/11-star-framework.md?raw';
import appNamingSkill from './placeholder-skills/app-naming.md?raw';
import frontendSlidesSkill from './placeholder-skills/frontend-slides.md?raw';
import promptMasterSkill from './placeholder-skills/prompt-master.md?raw';

export interface SkillEntry {
  id: string;
  name: string;
  content: string;
}

interface SkillLibraryState {
  skills: SkillEntry[];
  selectedId: string | null;

  selectSkill: (id: string) => void;
  addSkill: (entry: SkillEntry) => void;
  removeSkill: (id: string) => void;
  updateSelectedContent: (content: string) => void;
}

export const PLACEHOLDER_SKILLS: SkillEntry[] = [
  {
    id: '11-star-framework',
    name: '11-star-framework',
    content: elevenStarSkill,
  },
  {
    id: 'frontend-slides',
    name: 'frontend-slides',
    content: frontendSlidesSkill,
  },
  {
    id: 'prompt-master',
    name: 'prompt-master',
    content: promptMasterSkill,
  },
  {
    id: 'app-naming',
    name: 'app-naming',
    content: appNamingSkill,
  },
];

function extractName(content: string, fallback: string): string {
  try {
    return parseFrontmatter(content).frontmatter.name || fallback;
  } catch {
    return fallback;
  }
}

/**
 * After IndexedDB session restore, the editor content can belong to any skill while
 * `selectedId` still defaults to the first placeholder. This selects the matching
 * library entry (by frontmatter `name` ↔ skill `id`) and applies the restored document.
 */
export function syncLibraryWithRestoredContent(content: string): void {
  const nameFromDoc = extractName(content, '');
  if (!nameFromDoc.trim()) return;

  useSkillLibraryStore.setState((state) => {
    const match = state.skills.find(
      (s) => s.id === nameFromDoc || s.name === nameFromDoc
    );
    if (!match) return state;

    return {
      selectedId: match.id,
      skills: state.skills.map((s) =>
        s.id === match.id
          ? { ...s, content, name: extractName(content, s.name) }
          : s
      ),
    };
  });
}

export const useSkillLibraryStore = create<SkillLibraryState>((set) => ({
  skills: PLACEHOLDER_SKILLS,
  selectedId: PLACEHOLDER_SKILLS[0]?.id ?? null,

  selectSkill: (id) => set({ selectedId: id }),

  addSkill: (entry) =>
    set((state) => ({
      skills: [...state.skills, entry],
      selectedId: entry.id,
    })),

  removeSkill: (id) =>
    set((state) => ({
      skills: state.skills.filter((s) => s.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),

  updateSelectedContent: (content) =>
    set((state) => {
      if (!state.selectedId) return state;
      return {
        skills: state.skills.map((s) =>
          s.id === state.selectedId
            ? { ...s, content, name: extractName(content, s.name) }
            : s
        ),
      };
    }),
}));
