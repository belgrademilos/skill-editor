import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSkillStore } from '../skillStore';

// Mock IndexedDB storage
vi.mock('../../lib/storage', () => ({
  saveSession: vi.fn(),
  loadSession: vi.fn().mockResolvedValue(null),
  clearSession: vi.fn(),
}));

function resetStore() {
  useSkillStore.setState({
    content: '',
    skillName: '',
    isDirty: false,
  });
}

describe('skillStore', () => {
  beforeEach(() => {
    resetStore();
  });

  it('starts from scratch with default frontmatter', () => {
    useSkillStore.getState().startFromScratch();
    const state = useSkillStore.getState();
    expect(state.skillName).toBe('untitled-skill');
    expect(state.content).toContain('---');
    expect(state.content).toContain('name: untitled-skill');
  });

  it('updates content and marks dirty', () => {
    useSkillStore.getState().startFromScratch();
    const newContent = '---\nname: my-skill\ndescription: test\n---\n\n# Hello';
    useSkillStore.getState().updateContent(newContent);
    const state = useSkillStore.getState();
    expect(state.content).toBe(newContent);
    expect(state.isDirty).toBe(true);
  });

  it('extracts skill name from frontmatter on update', () => {
    const content = '---\nname: cool-skill\ndescription: A cool skill\n---\n\nBody';
    useSkillStore.getState().updateContent(content);
    expect(useSkillStore.getState().skillName).toBe('cool-skill');
  });

  it('handles content without frontmatter gracefully', () => {
    useSkillStore.getState().updateContent('# Just markdown');
    expect(useSkillStore.getState().skillName).toBe('Untitled Skill');
  });
});
