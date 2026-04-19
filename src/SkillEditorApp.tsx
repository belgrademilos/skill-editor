import { useEffect } from 'react';
import { useSkillStore } from './store/skillStore';
import { EditorLayout } from './components/EditorLayout';

export function SkillEditorApp() {
  useEffect(() => {
    void useSkillStore.getState().restoreSession();
  }, []);

  return <EditorLayout />;
}
