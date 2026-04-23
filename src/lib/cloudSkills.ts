import {
  collection,
  doc,
  deleteDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import { PLACEHOLDER_SKILLS, type SkillEntry } from '../store/placeholderSkills';

function skillsCollection(uid: string) {
  return collection(getFirebaseDb(), 'users', uid, 'skills');
}

export function subscribeToUserSkills(
  uid: string,
  onChange: (skills: SkillEntry[]) => void
): Unsubscribe {
  const q = query(skillsCollection(uid), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    const skills: SkillEntry[] = snap.docs.map((d) => {
      const data = d.data() as { id?: string; name: string; content: string };
      return { id: data.id ?? d.id, name: data.name, content: data.content };
    });
    onChange(skills);
  });
}

export async function upsertSkill(uid: string, entry: SkillEntry): Promise<void> {
  const ref = doc(skillsCollection(uid), entry.id);
  await setDoc(
    ref,
    {
      id: entry.id,
      name: entry.name,
      content: entry.content,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function deleteSkillFromCloud(uid: string, skillId: string): Promise<void> {
  await deleteDoc(doc(skillsCollection(uid), skillId));
}

export async function isUserLibraryEmpty(uid: string): Promise<boolean> {
  const q = query(skillsCollection(uid), limit(1));
  const snap = await getDocs(q);
  return snap.empty;
}

export async function seedUserLibrary(uid: string): Promise<void> {
  if (!(await isUserLibraryEmpty(uid))) return;
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  PLACEHOLDER_SKILLS.forEach((entry, index) => {
    const ref = doc(skillsCollection(uid), entry.id);
    batch.set(ref, {
      id: entry.id,
      name: entry.name,
      content: entry.content,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      seedOrder: index,
    });
  });
  await batch.commit();
}
