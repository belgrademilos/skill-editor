import { useEffect } from 'react';
import { useSkillStore } from './store/skillStore';
import { useSkillLibraryStore } from './store/skillLibraryStore';
import { useAuthStore, initAuthListener } from './store/authStore';
import { clearSession } from './lib/storage';
import { EditorLayout } from './components/EditorLayout';

export function SkillEditorApp() {
  useEffect(() => {
    const unsubscribeAuthListener = initAuthListener();
    return () => {
      unsubscribeAuthListener();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((state, prev) => {
      if (state.status === prev.status && state.user?.uid === prev.user?.uid) return;

      const library = useSkillLibraryStore.getState();
      const skillStoreState = useSkillStore.getState();

      if (state.status === 'signed-in' && state.user) {
        void (async () => {
          await library.bindToCloud(state.user!.uid);
          await clearSession();
          const firstSkill = useSkillLibraryStore.getState().skills[0];
          if (firstSkill) {
            skillStoreState.setActiveContent(firstSkill.content);
          }
        })();
      } else if (state.status === 'signed-out' && prev.status === 'signed-in') {
        library.unbindFromCloud();
        const firstSkill = useSkillLibraryStore.getState().skills[0];
        if (firstSkill) {
          skillStoreState.setActiveContent(firstSkill.content);
        }
      } else if (state.status === 'signed-out' && prev.status === 'loading') {
        // Anonymous / not-signed-in path: restore local session.
        void skillStoreState.restoreSession();
      }
    });

    // If Firebase is unconfigured, status is already 'signed-out' and no transition fires.
    // Restore local session immediately in that case.
    if (useAuthStore.getState().status === 'signed-out') {
      void useSkillStore.getState().restoreSession();
    }

    return () => {
      unsubscribe();
    };
  }, []);

  return <EditorLayout />;
}
