import { useState, useRef, useEffect } from 'react';
import {
  Download,
  ChevronDown,
  FileDown,
  FileText,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import { useSkillStore } from '../../store/skillStore';
import logoSvg from '../../assets/fe-logo-orange.svg';
import claudeIco from '../../../brand/claude/claude-ico.svg';
import { packAsSkill, packAsZip, exportSingleMd, downloadBlob } from '../../lib/zip';
import { serializeFrontmatter } from '../../lib/frontmatter';

export function TopBar() {
  const { skillName, activeFile, files, frontmatterMap, closeSkill, saveStatus } =
    useSkillStore();
  const [showExport, setShowExport] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExport(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const getExportFiles = (): Map<string, string> => {
    const exportFiles = new Map(files);
    // Re-inject frontmatter into all .md files that have managed frontmatter
    for (const [path] of frontmatterMap) {
      if (exportFiles.has(path)) {
        const fm = frontmatterMap.get(path);
        if (fm) {
          const body = exportFiles.get(path) || '';
          exportFiles.set(path, serializeFrontmatter(fm, body));
        }
      }
    }
    return exportFiles;
  };

  const handleExportSkill = async () => {
    const exportFiles = getExportFiles();
    const blob = await packAsSkill(exportFiles, skillName || 'skill');
    downloadBlob(blob, `${skillName || 'skill'}.skill`);
    setShowExport(false);
  };

  const handleExportZip = async () => {
    const exportFiles = getExportFiles();
    const blob = await packAsZip(exportFiles, skillName || 'skill');
    downloadBlob(blob, `${skillName || 'skill'}.zip`);
    setShowExport(false);
  };

  const handleExportMd = () => {
    if (!activeFile) return;
    let content = files.get(activeFile) || '';
    // If exporting a .md file with managed frontmatter, include it
    const fm = frontmatterMap.get(activeFile);
    if (fm) {
      content = serializeFrontmatter(fm, content);
    }
    const fileName = activeFile.split('/').pop() || 'file.md';
    const blob = exportSingleMd(content, fileName);
    downloadBlob(blob, fileName);
    setShowExport(false);
  };

  return (
    <div className="h-12 border-b border-border bg-bg-sidebar flex items-center justify-between px-4 shrink-0">
      {/* Left: Skill Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <img src={logoSvg} alt="Skill Editor" className="w-4 h-4" />
          <span className="text-sm font-semibold text-text-primary">
            {skillName || 'Untitled Skill'}
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Save Status */}
        {saveStatus !== 'idle' && (
          <span className="flex items-center gap-1 text-xs text-text-muted mr-1">
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Check className="w-3 h-3" />
                Saved
              </>
            )}
          </span>
        )}

        {/* Export Dropdown */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setShowExport(!showExport)}
            className="
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm
              bg-accent text-white hover:bg-accent-hover
              transition-colors
            "
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showExport && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-bg-surface border border-border rounded-lg shadow-xl py-1 z-50">
              <button
                onClick={handleExportSkill}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-bg-hover transition-colors"
              >
                <img src={claudeIco} alt="" className="w-4 h-4" />
                Export as .skill
              </button>
              <button
                onClick={handleExportZip}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-bg-hover transition-colors"
              >
                <FileDown className="w-4 h-4 text-text-muted" />
                Export as .zip
              </button>
              <div className="border-t border-border my-1" />
              <button
                onClick={handleExportMd}
                disabled={!activeFile}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-bg-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FileText className="w-4 h-4 text-text-muted" />
                Export current as .md
              </button>
            </div>
          )}
        </div>

        {/* Close */}
        <button
          onClick={closeSkill}
          className="
            p-1.5 rounded-md text-text-muted
            hover:text-text-primary hover:bg-bg-hover
            transition-colors
          "
          title="Close skill"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
