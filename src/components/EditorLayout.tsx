import { useCallback, useEffect, useState } from 'react';
import { useSkillStore } from '../store/skillStore';
import { SkillEditor } from './Editor/SkillEditor';
import { SkillPreview } from './Editor/SkillPreview';
import { EditorToolbar, type ViewMode } from './EditorToolbar';
import { SkillSidebar } from './SkillSidebar';
import { SiteFooter } from './SiteFooter';
import { packAsSkill, downloadBlob, exportSingleMd } from '../lib/zip';

const VIEW_MODE_KEY = 'skilleditor:viewMode';

function loadInitialViewMode(): ViewMode {
  if (typeof window === 'undefined') return 'edit';
  const stored = window.localStorage.getItem(VIEW_MODE_KEY);
  return stored === 'preview' ? 'preview' : 'edit';
}

export function EditorLayout() {
  const content = useSkillStore((s) => s.content);
  const skillName = useSkillStore((s) => s.skillName);
  const updateContent = useSkillStore((s) => s.updateContent);

  const [viewMode, setViewMode] = useState<ViewMode>(loadInitialViewMode);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    try {
      window.localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {
      // ignore quota/permission errors
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleViewModeChange(viewMode === 'edit' ? 'preview' : 'edit');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [viewMode, handleViewModeChange]);

  const handleChange = useCallback(
    (value: string) => {
      updateContent(value);
    },
    [updateContent]
  );

  const handleExportSkill = useCallback(async () => {
    const state = useSkillStore.getState();
    const name = state.skillName || 'skill';
    const blob = await packAsSkill(state.content, name);
    downloadBlob(blob, `${name}.skill`);
  }, []);

  const handleExportMd = useCallback(() => {
    const state = useSkillStore.getState();
    const name = state.skillName || 'SKILL';
    const blob = exportSingleMd(state.content);
    downloadBlob(blob, `${name}.md`);
  }, []);

  const handleSave = useCallback(() => {
    handleExportSkill();
  }, [handleExportSkill]);

  return (
    <div className="flex h-screen flex-col bg-bg-primary">
      <div className="flex min-h-0 flex-1">
        <SkillSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <EditorToolbar
            skillName={skillName}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            onExportSkill={handleExportSkill}
            onExportMd={handleExportMd}
          />
          <div className="min-h-0 flex-1">
            {viewMode === 'edit' ? (
              <SkillEditor
                value={content}
                onChange={handleChange}
                onSave={handleSave}
              />
            ) : (
              <SkillPreview content={content} />
            )}
          </div>
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}

