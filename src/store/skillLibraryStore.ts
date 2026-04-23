import { create } from 'zustand';
import { parseFrontmatter, serializeFrontmatter } from '../lib/frontmatter';
import {
  deleteSkillFromCloud,
  seedUserLibrary,
  subscribeToUserSkills,
  upsertSkill,
} from '../lib/cloudSkills';
import { PLACEHOLDER_SKILLS, type SkillEntry } from './placeholderSkills';

export { PLACEHOLDER_SKILLS };
export type { SkillEntry };

export type LibraryMode = 'local' | 'cloud';

interface SkillLibraryState {
  skills: SkillEntry[];
  selectedId: string | null;
  mode: LibraryMode;
  cloudUid: string | null;
  cloudUnsubscribe: (() => void) | null;
  cloudInitialLoad: boolean;

  selectSkill: (id: string) => void;
  addSkill: (entry: SkillEntry) => void;
  removeSkill: (id: string) => void;
  duplicateSkill: (id: string) => SkillEntry | null;
  updateSelectedContent: (content: string) => void;

  bindToCloud: (uid: string) => Promise<void>;
  unbindFromCloud: () => void;
}

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

let cloudUpsertTimer: ReturnType<typeof setTimeout> | null = null;
let pendingCloudUpsert: { uid: string; entry: SkillEntry } | null = null;

function scheduleCloudUpsert(uid: string, entry: SkillEntry, delay = 800): void {
  pendingCloudUpsert = { uid, entry };
  if (cloudUpsertTimer) clearTimeout(cloudUpsertTimer);
  cloudUpsertTimer = setTimeout(() => {
    if (pendingCloudUpsert) {
      void upsertSkill(pendingCloudUpsert.uid, pendingCloudUpsert.entry);
      pendingCloudUpsert = null;
    }
  }, delay);
}

function flushCloudUpsert(): void {
  if (cloudUpsertTimer) {
    clearTimeout(cloudUpsertTimer);
    cloudUpsertTimer = null;
  }
  if (pendingCloudUpsert) {
    void upsertSkill(pendingCloudUpsert.uid, pendingCloudUpsert.entry);
    pendingCloudUpsert = null;
  }
}

export const useSkillLibraryStore = create<SkillLibraryState>((set, get) => ({
  skills: PLACEHOLDER_SKILLS,
  selectedId: PLACEHOLDER_SKILLS[0]?.id ?? null,
  mode: 'local',
  cloudUid: null,
  cloudUnsubscribe: null,
  cloudInitialLoad: false,

  selectSkill: (id) => set({ selectedId: id }),

  addSkill: (entry) => {
    set((state) => ({
      skills: [...state.skills, entry],
      selectedId: entry.id,
    }));
    const { mode, cloudUid } = get();
    if (mode === 'cloud' && cloudUid) {
      void upsertSkill(cloudUid, entry);
    }
  },

  removeSkill: (id) => {
    const stateBefore = get();
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
    });
    if (stateBefore.mode === 'cloud' && stateBefore.cloudUid) {
      void deleteSkillFromCloud(stateBefore.cloudUid, id);
    }
  },

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

    if (state.mode === 'cloud' && state.cloudUid) {
      void upsertSkill(state.cloudUid, newEntry);
    }

    return newEntry;
  },

  updateSelectedContent: (content) => {
    const updated: { entry: SkillEntry | null } = { entry: null };
    set((state) => {
      if (!state.selectedId) return state;
      return {
        skills: state.skills.map((s) => {
          if (s.id !== state.selectedId) return s;
          const next = { ...s, content, name: extractName(content, s.name) };
          updated.entry = next;
          return next;
        }),
      };
    });
    const { mode, cloudUid } = get();
    if (mode === 'cloud' && cloudUid && updated.entry) {
      scheduleCloudUpsert(cloudUid, updated.entry);
    }
  },

  bindToCloud: async (uid) => {
    const state = get();
    if (state.mode === 'cloud' && state.cloudUid === uid) return;
    if (state.cloudUnsubscribe) state.cloudUnsubscribe();

    set({
      mode: 'cloud',
      cloudUid: uid,
      cloudInitialLoad: true,
      skills: [],
      selectedId: null,
    });

    try {
      await seedUserLibrary(uid);
    } catch (err) {
      console.error('Failed to seed user library', err);
    }

    const unsubscribe = subscribeToUserSkills(uid, (cloudSkills) => {
      set((current) => {
        // If local edits haven't flushed to cloud yet, don't clobber them.
        if (pendingCloudUpsert && pendingCloudUpsert.uid === uid) {
          const pendingId = pendingCloudUpsert.entry.id;
          const pendingEntry = pendingCloudUpsert.entry;
          const merged = cloudSkills.map((s) =>
            s.id === pendingId ? pendingEntry : s
          );
          if (!merged.some((s) => s.id === pendingId)) merged.push(pendingEntry);
          return reconcileCloudSkills(current, merged);
        }
        return reconcileCloudSkills(current, cloudSkills);
      });
    });

    set({ cloudUnsubscribe: unsubscribe });
  },

  unbindFromCloud: () => {
    flushCloudUpsert();
    const { cloudUnsubscribe } = get();
    if (cloudUnsubscribe) cloudUnsubscribe();
    set({
      mode: 'local',
      cloudUid: null,
      cloudUnsubscribe: null,
      cloudInitialLoad: false,
      skills: PLACEHOLDER_SKILLS,
      selectedId: PLACEHOLDER_SKILLS[0]?.id ?? null,
    });
  },
}));

function reconcileCloudSkills(
  current: SkillLibraryState,
  cloudSkills: SkillEntry[]
): Partial<SkillLibraryState> {
  let selectedId = current.selectedId;
  if (!selectedId || !cloudSkills.some((s) => s.id === selectedId)) {
    selectedId = cloudSkills[0]?.id ?? null;
  }
  return {
    skills: cloudSkills,
    selectedId,
    cloudInitialLoad: false,
  };
}
