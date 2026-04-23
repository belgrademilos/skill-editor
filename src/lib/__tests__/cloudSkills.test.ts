import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../firebase', () => ({
  getFirebaseDb: vi.fn(() => ({ __mock: 'db' })),
}));

const mocks = vi.hoisted(() => ({
  setDocMock: vi.fn(),
  deleteDocMock: vi.fn(),
  getDocsMock: vi.fn(),
  batchSetMock: vi.fn(),
  batchCommitMock: vi.fn(),
  onSnapshotMock: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db: unknown, ...parts: string[]) => ({
    __type: 'collection',
    path: parts.join('/'),
  })),
  doc: vi.fn((col: { path: string }, id: string) => ({
    __type: 'doc',
    path: `${col.path}/${id}`,
  })),
  deleteDoc: mocks.deleteDocMock,
  getDocs: mocks.getDocsMock,
  limit: vi.fn((n: number) => ({ __type: 'limit', n })),
  onSnapshot: mocks.onSnapshotMock,
  orderBy: vi.fn((field: string, dir: string) => ({ __type: 'orderBy', field, dir })),
  query: vi.fn((col: unknown, ...clauses: unknown[]) => ({ __type: 'query', col, clauses })),
  serverTimestamp: vi.fn(() => ({ __mock: 'serverTimestamp' })),
  setDoc: mocks.setDocMock,
  writeBatch: vi.fn(() => ({ set: mocks.batchSetMock, commit: mocks.batchCommitMock })),
}));

import {
  deleteSkillFromCloud,
  isUserLibraryEmpty,
  seedUserLibrary,
  subscribeToUserSkills,
  upsertSkill,
} from '../cloudSkills';
import { PLACEHOLDER_SKILLS } from '../../store/placeholderSkills';

describe('cloudSkills', () => {
  beforeEach(() => {
    mocks.setDocMock.mockReset();
    mocks.setDocMock.mockResolvedValue(undefined);
    mocks.deleteDocMock.mockReset();
    mocks.deleteDocMock.mockResolvedValue(undefined);
    mocks.getDocsMock.mockReset();
    mocks.batchSetMock.mockReset();
    mocks.batchCommitMock.mockReset();
    mocks.batchCommitMock.mockResolvedValue(undefined);
    mocks.onSnapshotMock.mockReset();
  });

  it('upsertSkill writes a merged doc with timestamps', async () => {
    await upsertSkill('uid-1', { id: 'skill-a', name: 'skill-a', content: 'body' });
    expect(mocks.setDocMock).toHaveBeenCalledTimes(1);
    const call = mocks.setDocMock.mock.calls[0] as [{ path: string }, Record<string, unknown>, { merge: boolean }];
    expect(call[0].path).toBe('users/uid-1/skills/skill-a');
    expect(call[1]).toMatchObject({ id: 'skill-a', name: 'skill-a', content: 'body' });
    expect(call[2]).toEqual({ merge: true });
  });

  it('deleteSkillFromCloud deletes by doc ref', async () => {
    await deleteSkillFromCloud('uid-1', 'skill-x');
    expect(mocks.deleteDocMock).toHaveBeenCalledTimes(1);
    const call = mocks.deleteDocMock.mock.calls[0] as [{ path: string }];
    expect(call[0].path).toBe('users/uid-1/skills/skill-x');
  });

  it('isUserLibraryEmpty returns true when no docs exist', async () => {
    mocks.getDocsMock.mockResolvedValueOnce({ empty: true });
    await expect(isUserLibraryEmpty('uid-1')).resolves.toBe(true);
  });

  it('seedUserLibrary writes all placeholders when empty', async () => {
    mocks.getDocsMock.mockResolvedValueOnce({ empty: true });
    await seedUserLibrary('uid-1');
    expect(mocks.batchSetMock).toHaveBeenCalledTimes(PLACEHOLDER_SKILLS.length);
    expect(mocks.batchCommitMock).toHaveBeenCalledTimes(1);
  });

  it('seedUserLibrary is a no-op when library is non-empty', async () => {
    mocks.getDocsMock.mockResolvedValueOnce({ empty: false });
    await seedUserLibrary('uid-1');
    expect(mocks.batchCommitMock).not.toHaveBeenCalled();
  });

  it('subscribeToUserSkills maps snapshot docs to SkillEntry[]', () => {
    let capturedHandler: ((snap: unknown) => void) | undefined;
    mocks.onSnapshotMock.mockImplementation(((_q: unknown, handler: (snap: unknown) => void) => {
      capturedHandler = handler;
      return () => {};
    }) as never);
    const received: unknown[] = [];
    subscribeToUserSkills('uid-1', (skills) => {
      received.push(skills);
    });

    capturedHandler!({
      docs: [
        {
          id: 'skill-a',
          data: () => ({ id: 'skill-a', name: 'skill-a', content: 'body A' }),
        },
        {
          id: 'skill-b',
          data: () => ({ id: 'skill-b', name: 'skill-b', content: 'body B' }),
        },
      ],
    });

    expect(received[0]).toEqual([
      { id: 'skill-a', name: 'skill-a', content: 'body A' },
      { id: 'skill-b', name: 'skill-b', content: 'body B' },
    ]);
  });
});
