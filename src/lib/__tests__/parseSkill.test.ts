import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseSkillFromGitHub } from '../parseSkill';

const skillMd = '---\nname: imported-skill\ndescription: Imported from GitHub\n---\n\n# Imported';

function mockFetchWithResponses(responses: Record<string, { ok: boolean; body?: string }>) {
  return vi.fn(async (url: string | URL | Request) => {
    const href = url.toString();
    const response = responses[href] ?? { ok: false };

    return {
      ok: response.ok,
      text: async () => response.body ?? '',
    } as Response;
  });
}

describe('parseSkillFromGitHub', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('imports SKILL.md from a repo root on main', async () => {
    const fetchMock = mockFetchWithResponses({
      'https://raw.githubusercontent.com/owner/repo/main/SKILL.md': {
        ok: true,
        body: skillMd,
      },
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(parseSkillFromGitHub('https://github.com/owner/repo')).resolves.toEqual({
      name: 'imported-skill',
      content: skillMd,
    });
    expect(fetchMock).toHaveBeenCalledWith('https://raw.githubusercontent.com/owner/repo/main/SKILL.md');
  });

  it('falls back to master for repo root URLs', async () => {
    const fetchMock = mockFetchWithResponses({
      'https://raw.githubusercontent.com/owner/repo/master/SKILL.md': {
        ok: true,
        body: skillMd,
      },
    });
    vi.stubGlobal('fetch', fetchMock);

    await parseSkillFromGitHub('https://github.com/owner/repo');

    expect(fetchMock).toHaveBeenNthCalledWith(1, 'https://raw.githubusercontent.com/owner/repo/main/SKILL.md');
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://raw.githubusercontent.com/owner/repo/master/SKILL.md');
  });

  it('imports from a GitHub blob URL', async () => {
    const fetchMock = mockFetchWithResponses({
      'https://raw.githubusercontent.com/owner/repo/main/skills/demo/SKILL.md': {
        ok: true,
        body: skillMd,
      },
    });
    vi.stubGlobal('fetch', fetchMock);

    await parseSkillFromGitHub('https://github.com/owner/repo/blob/main/skills/demo/SKILL.md');

    expect(fetchMock).toHaveBeenCalledWith('https://raw.githubusercontent.com/owner/repo/main/skills/demo/SKILL.md');
  });

  it('imports SKILL.md from a GitHub tree URL', async () => {
    const fetchMock = mockFetchWithResponses({
      'https://raw.githubusercontent.com/owner/repo/main/skills/demo/SKILL.md': {
        ok: true,
        body: skillMd,
      },
    });
    vi.stubGlobal('fetch', fetchMock);

    await parseSkillFromGitHub('https://github.com/owner/repo/tree/main/skills/demo');

    expect(fetchMock).toHaveBeenCalledWith('https://raw.githubusercontent.com/owner/repo/main/skills/demo/SKILL.md');
  });

  it('fetches raw.githubusercontent.com URLs directly', async () => {
    const rawUrl = 'https://raw.githubusercontent.com/owner/repo/main/skills/demo/SKILL.md';
    const fetchMock = mockFetchWithResponses({
      [rawUrl]: {
        ok: true,
        body: skillMd,
      },
    });
    vi.stubGlobal('fetch', fetchMock);

    await parseSkillFromGitHub(rawUrl);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(rawUrl);
  });

  it('preserves branch and path segments after blob URLs', async () => {
    const rawUrl = 'https://raw.githubusercontent.com/owner/repo/feature/demo/skills/demo/SKILL.md';
    const fetchMock = mockFetchWithResponses({
      [rawUrl]: {
        ok: true,
        body: skillMd,
      },
    });
    vi.stubGlobal('fetch', fetchMock);

    await parseSkillFromGitHub('https://github.com/owner/repo/blob/feature/demo/skills/demo/SKILL.md');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(rawUrl);
  });
});
