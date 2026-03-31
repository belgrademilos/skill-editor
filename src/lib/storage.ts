import { get, set, del } from 'idb-keyval';

const SKILL_KEY = 'skill-editor-session';

export interface StoredSession {
  skillName: string;
  files: [string, string][];
  activeFile: string | null;
  openTabs: string[];
  fileOrder?: string[];
  frontmatterMap?: [string, { name: string; description: string }][];
  timestamp: number;
}

export async function saveSession(session: StoredSession): Promise<void> {
  await set(SKILL_KEY, session);
}

export async function loadSession(): Promise<StoredSession | null> {
  const data = await get<StoredSession>(SKILL_KEY);
  return data || null;
}

export async function clearSession(): Promise<void> {
  await del(SKILL_KEY);
}
