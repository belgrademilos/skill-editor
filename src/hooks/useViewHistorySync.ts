import { useEffect, useRef } from 'react';
import { useSkillStore } from '../store/skillStore';

type View = ReturnType<typeof useSkillStore.getState>['view'];

function isView(value: unknown): value is View {
  return value === 'intro' || value === 'editor';
}

function getHistoryViewState() {
  const historyState = window.history.state;
  if (isView(historyState?.view)) return historyState.view;
  if (isView(historyState?.usr?.view)) return historyState.usr.view;
  return null;
}

function getViewFromLocation() {
  return getHistoryViewState() ?? 'intro';
}

export function useViewHistorySync(view: View) {
  const previousViewRef = useRef(view);
  const hasSyncedViewRef = useRef(false);

  useEffect(() => {
    const initialView = getViewFromLocation();
    previousViewRef.current = initialView;
    const currentView = useSkillStore.getState().view;

    if (initialView !== currentView) {
      useSkillStore.setState({ view: initialView });
    }

    window.history.replaceState({ view: initialView }, '', '/');

    const handlePopState = () => {
      const nextView = getViewFromLocation();
      previousViewRef.current = nextView;
      useSkillStore.getState().setView(nextView);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!hasSyncedViewRef.current) {
      hasSyncedViewRef.current = true;
      previousViewRef.current = view;
      return;
    }

    const currentPath = window.location.pathname;

    if (currentPath !== '/' || window.history.state?.view !== view) {
      window.history.replaceState({ view }, '', '/');
    }

    previousViewRef.current = view;
  }, [view]);
}
