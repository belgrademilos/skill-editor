import { useEffect } from 'react';
import { useSkillStore } from './store/skillStore';
import { EditorLayout } from './components/EditorLayout';
import { useBeforeUnload } from './hooks/useBeforeUnload';

export function SkillEditorApp() {
  useBeforeUnload();

  useEffect(() => {
    void useSkillStore.getState().restoreSession();
  }, []);

  return <EditorLayout />;
}
