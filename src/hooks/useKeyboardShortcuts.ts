import { useEffect, useCallback } from 'react';
import { useSkillStore } from '../store/skillStore';
import { packAsSkill, downloadBlob } from '../lib/zip';

export function useKeyboardShortcuts() {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;

    const state = useSkillStore.getState();

    // Cmd+S — Export as .skill
    if (e.key === 's' && !e.shiftKey) {
      e.preventDefault();

      const files = new Map<string, string>();
      files.set('SKILL.md', state.content);
      const name = state.skillName || 'skill';
      packAsSkill(files, name).then((blob) => {
        downloadBlob(blob, `${name}.skill`);
      });
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
