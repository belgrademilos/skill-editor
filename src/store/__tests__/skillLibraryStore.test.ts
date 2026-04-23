import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  upsertSkillMock: vi.fn(),
  deleteSkillFromCloudMock: vi.fn(),
  seedUserLibraryMock: vi.fn(),
  subscribeToUserSkillsMock: vi.fn(() => () => {}),
}));

vi.mock('../../lib/cloudSkills', () => ({
  upsertSkill: mocks.upsertSkillMock,
  deleteSkillFromCloud: mocks.deleteSkillFromCloudMock,
  seedUserLibrary: mocks.seedUserLibraryMock,
  subscribeToUserSkills: mocks.subscribeToUserSkillsMock,
}));

import { useSkillLibraryStore, PLACEHOLDER_SKILLS } from '../skillLibraryStore';

describe('skillLibraryStore', () => {
  beforeEach(() => {
    mocks.upsertSkillMock.mockReset();
    mocks.upsertSkillMock.mockResolvedValue(undefined);
    mocks.deleteSkillFromCloudMock.mockReset();
    mocks.deleteSkillFromCloudMock.mockResolvedValue(undefined);
    mocks.seedUserLibraryMock.mockReset();
    mocks.seedUserLibraryMock.mockResolvedValue(undefined);
    mocks.subscribeToUserSkillsMock.mockReset();
    mocks.subscribeToUserSkillsMock.mockImplementation(() => () => {});
    useSkillLibraryStore.setState({
      skills: PLACEHOLDER_SKILLS,
      selectedId: PLACEHOLDER_SKILLS[0]?.id ?? null,
      mode: 'local',
      cloudUid: null,
      cloudUnsubscribe: null,
      cloudInitialLoad: false,
    });
  });

  describe('local mode', () => {
    it('addSkill does not call upsertSkill', () => {
      const entry = { id: 'new-skill', name: 'new-skill', content: '---\nname: new-skill\n---' };
      useSkillLibraryStore.getState().addSkill(entry);
      expect(mocks.upsertSkillMock).not.toHaveBeenCalled();
      expect(useSkillLibraryStore.getState().skills).toContainEqual(entry);
    });

    it('removeSkill does not call deleteSkillFromCloud', () => {
      const id = PLACEHOLDER_SKILLS[0]!.id;
      useSkillLibraryStore.getState().removeSkill(id);
      expect(mocks.deleteSkillFromCloudMock).not.toHaveBeenCalled();
    });
  });

  describe('cloud mode', () => {
    beforeEach(() => {
      useSkillLibraryStore.setState({
        mode: 'cloud',
        cloudUid: 'uid-1',
      });
    });

    it('addSkill mirrors the entry to Firestore', () => {
      const entry = { id: 'cloud-skill', name: 'cloud-skill', content: 'body' };
      useSkillLibraryStore.getState().addSkill(entry);
      expect(mocks.upsertSkillMock).toHaveBeenCalledWith('uid-1', entry);
    });

    it('removeSkill deletes from Firestore', () => {
      const id = PLACEHOLDER_SKILLS[0]!.id;
      useSkillLibraryStore.getState().removeSkill(id);
      expect(mocks.deleteSkillFromCloudMock).toHaveBeenCalledWith('uid-1', id);
    });

    it('updateSelectedContent debounces cloud upsert', async () => {
      vi.useFakeTimers();
      try {
        const selectedId = PLACEHOLDER_SKILLS[0]!.id;
        useSkillLibraryStore.setState({ selectedId });
        useSkillLibraryStore.getState().updateSelectedContent('---\nname: test\n---\nbody');
        expect(mocks.upsertSkillMock).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(850);
        expect(mocks.upsertSkillMock).toHaveBeenCalledTimes(1);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('bindToCloud / unbindFromCloud', () => {
    it('seeds and subscribes when binding to cloud', async () => {
      await useSkillLibraryStore.getState().bindToCloud('uid-1');
      expect(mocks.seedUserLibraryMock).toHaveBeenCalledWith('uid-1');
      expect(mocks.subscribeToUserSkillsMock).toHaveBeenCalledTimes(1);
      const state = useSkillLibraryStore.getState();
      expect(state.mode).toBe('cloud');
      expect(state.cloudUid).toBe('uid-1');
    });

    it('restores placeholder skills on unbind', async () => {
      await useSkillLibraryStore.getState().bindToCloud('uid-1');
      useSkillLibraryStore.getState().unbindFromCloud();
      const state = useSkillLibraryStore.getState();
      expect(state.mode).toBe('local');
      expect(state.cloudUid).toBeNull();
      expect(state.skills).toEqual(PLACEHOLDER_SKILLS);
    });
  });
});
