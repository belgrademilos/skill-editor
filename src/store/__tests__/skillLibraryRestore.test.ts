import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSession } from '../../lib/storage';
import { useSkillStore } from '../skillStore';
import {
  PLACEHOLDER_SKILLS,
  useSkillLibraryStore,
} from '../skillLibraryStore';

vi.mock('../../lib/storage', () => ({
  saveSession: vi.fn(),
  loadSession: vi.fn().mockResolvedValue(null),
  clearSession: vi.fn(),
}));

function resetStores() {
  useSkillLibraryStore.setState({
    skills: PLACEHOLDER_SKILLS.map((s) => ({ ...s })),
    selectedId: PLACEHOLDER_SKILLS[0]?.id ?? null,
  });
  useSkillStore.setState({
    content: PLACEHOLDER_SKILLS[0]?.content ?? '',
    skillName: PLACEHOLDER_SKILLS[0]?.name ?? '',
    isDirty: false,
  });
}

describe('session restore + skill library', () => {
  beforeEach(() => {
    vi.mocked(loadSession).mockResolvedValue(null);
    resetStores();
  });

  it('selects the matching library skill by frontmatter name after restore', async () => {
    const restored = `---
name: prompt-master
description: Restored session
---

# Edited body
`;
    vi.mocked(loadSession).mockResolvedValue({
      skillName: 'prompt-master',
      files: [['SKILL.md', restored]],
      activeFile: 'SKILL.md',
      openTabs: ['SKILL.md'],
      timestamp: Date.now(),
    });

    await useSkillStore.getState().restoreSession();

    expect(useSkillLibraryStore.getState().selectedId).toBe('prompt-master');

    const eleven = useSkillLibraryStore
      .getState()
      .skills.find((s) => s.id === '11-star-framework');
    expect(eleven?.name).toBe('11-star-framework');
    expect(eleven?.content).toContain('The 11-Star Framework');

    const pm = useSkillLibraryStore
      .getState()
      .skills.find((s) => s.id === 'prompt-master');
    expect(pm?.content).toBe(restored);
  });
});
