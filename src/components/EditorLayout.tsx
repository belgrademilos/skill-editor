import { useCallback } from 'react';
import { useSkillStore } from '../store/skillStore';
import { SkillEditor } from './Editor/SkillEditor';
import { EditorToolbar } from './EditorToolbar';
import { SkillSidebar } from './SkillSidebar';
import { SiteFooter } from './SiteFooter';
import { packAsSkill, downloadBlob, exportSingleMd } from '../lib/zip';

export function EditorLayout() {
  const content = useSkillStore((s) => s.content);
  const skillName = useSkillStore((s) => s.skillName);
  const updateContent = useSkillStore((s) => s.updateContent);

  const handleChange = useCallback(
    (value: string) => {
      updateContent(value);
    },
    [updateContent]
  );

  const handleExportSkill = useCallback(async () => {
    const state = useSkillStore.getState();
    const files = new Map<string, string>();
    files.set('SKILL.md', state.content);
    const name = state.skillName || 'skill';
    const blob = await packAsSkill(files, name);
    downloadBlob(blob, `${name}.skill`);
  }, []);

  const handleExportMd = useCallback(() => {
    const state = useSkillStore.getState();
    const name = state.skillName || 'SKILL';
    const blob = exportSingleMd(state.content, `${name}.md`);
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
            onExportSkill={handleExportSkill}
            onExportMd={handleExportMd}
          />
          <div className="min-h-0 flex-1">
            <SkillEditor
              value={content}
              onChange={handleChange}
              onSave={handleSave}
            />
          </div>
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}
