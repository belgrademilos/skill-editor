import { useSkillStore } from './store/skillStore';
import { IntroScreen } from './components/IntroScreen';
import { EditorLayout } from './components/EditorLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useBeforeUnload } from './hooks/useBeforeUnload';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useViewHistorySync } from './hooks/useViewHistorySync';

export function SkillEditorApp() {
  const view = useSkillStore(s => s.view);

  useBeforeUnload();
  useKeyboardShortcuts();
  useViewHistorySync(view);

  return view === 'intro' ? <IntroScreen /> : <ErrorBoundary><EditorLayout /></ErrorBoundary>;
}
