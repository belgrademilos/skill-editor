import { create } from 'zustand';
import { parseFrontmatter, serializeFrontmatter } from '../lib/frontmatter';
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
  duplicateSkill: (id: string) => SkillEntry | null;
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

export const useSkillLibraryStore = create<SkillLibraryState>((set, get) => ({
  skills: PLACEHOLDER_SKILLS,
  selectedId: PLACEHOLDER_SKILLS[0]?.id ?? null,

  selectSkill: (id) => set({ selectedId: id }),

  addSkill: (entry) =>
    set((state) => ({
      skills: [...state.skills, entry],
      selectedId: entry.id,
    })),

  removeSkill: (id) =>
    set((state) => {
      const skills = state.skills.filter((s) => s.id !== id);
      let selectedId = state.selectedId;
      if (selectedId === id) {
        const removedIndex = state.skills.findIndex((s) => s.id === id);
        const fallback =
          skills[removedIndex] ?? skills[removedIndex - 1] ?? skills[0] ?? null;
        selectedId = fallback?.id ?? null;
      }
      return { skills, selectedId };
    }),

  duplicateSkill: (id) => {
    const state = get();
    const source = state.skills.find((s) => s.id === id);
    if (!source) return null;

    const existingNames = new Set(state.skills.map((s) => s.name));
    const existingIds = new Set(state.skills.map((s) => s.id));

    const baseName = source.name.replace(/-(\d+)$/, '');
    let n = 2;
    let newName = `${baseName}-${n}`;
    while (existingNames.has(newName) || existingIds.has(newName)) {
      n += 1;
      newName = `${baseName}-${n}`;
    }

    let newContent = source.content;
    try {
      const parsed = parseFrontmatter(source.content);
      newContent = serializeFrontmatter(
        { ...parsed.frontmatter, name: newName },
        parsed.body
      );
    } catch {
      // Fallback: keep original content if frontmatter can't be parsed
    }

    const newEntry: SkillEntry = {
      id: `${newName}-${Date.now()}`,
      name: newName,
      content: newContent,
    };

    set((s) => {
      const index = s.skills.findIndex((sk) => sk.id === id);
      const skills = [...s.skills];
      skills.splice(index + 1, 0, newEntry);
      return { skills, selectedId: newEntry.id };
    });

    return newEntry;
  },

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
