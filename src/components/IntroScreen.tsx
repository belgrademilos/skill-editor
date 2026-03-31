import { useCallback, useState, useEffect } from 'react';
import { Upload, ArrowRight, FilePlus } from 'lucide-react';
import { useSkillStore } from '../store/skillStore';
import logoSvg from '../assets/fe-logo-orange.svg';
import { loadSession } from '../lib/storage';
import { SiteFooter } from './SiteFooter';

export function IntroScreen() {
  const { loadSkillFile, loadMdFile, restoreSession, startFromScratch } = useSkillStore();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [sessionName, setSessionName] = useState('');

  useEffect(() => {
    loadSession().then(session => {
      if (session) {
        setHasSession(true);
        setSessionName(session.skillName);
      }
    });
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'skill' && ext !== 'zip' && ext !== 'md') {
        setError('Please upload a .skill, .zip, or .md file');
        return;
      }
      try {
        if (ext === 'md') {
          await loadMdFile(file);
        } else {
          await loadSkillFile(file);
        }
      } catch (err) {
        if (err instanceof Error && err.message === 'Invalid skill.md file.') {
          setError('Invalid skill.md file. Must contain YAML frontmatter with name and description.');
        } else {
          setError('Failed to open file. Make sure it\'s a valid skill archive.');
        }
      }
    },
    [loadSkillFile, loadMdFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onBrowse = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.skill,.zip,.md';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) handleFile(file);
    };
    input.click();
  }, [handleFile]);

  const onRestore = useCallback(async () => {
    await restoreSession();
  }, [restoreSession]);

  return (
    <div className="flex min-h-screen flex-col bg-bg-primary">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-lg w-full">
          {/* Logo / Title */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center">
                <img src={logoSvg} alt="Logo" className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">Skill Editor</h1>
            </div>
            <p className="text-text-secondary text-sm">
              Edit and manage agent skills with ease
            </p>
          </div>

          {/* Drop Zone */}
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={`
              relative border-2 border-dashed rounded-xl p-12 text-center
              transition-all duration-200 cursor-pointer
              ${isDragging
                ? 'border-accent bg-accent/5 scale-[1.02]'
                : 'border-border hover:border-text-muted hover:bg-bg-surface/50'
              }
            `}
            onClick={onBrowse}
          >
            <div className="flex flex-col items-center gap-4">
              <div
                className={`
                  w-14 h-14 rounded-full flex items-center justify-center transition-colors
                  ${isDragging ? 'bg-accent/20' : 'bg-bg-surface'}
                `}
              >
                <Upload
                  className={`w-6 h-6 transition-colors ${isDragging ? 'text-accent' : 'text-text-secondary'}`}
                />
              </div>
              <div>
                <p className="text-text-primary font-medium mb-1">
                  Drop your skill file here
                </p>
                <p className="text-text-secondary text-sm">
                  or click to browse files
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span className="px-2 py-0.5 rounded bg-bg-surface">.skill</span>
                <span className="px-2 py-0.5 rounded bg-bg-surface">.zip</span>
                <span className="px-2 py-0.5 rounded bg-bg-surface">.md</span>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-danger text-sm mt-3 text-center">{error}</p>
          )}

          {/* Resume Session */}
          {hasSession && (
            <button
              onClick={onRestore}
              className="
                mt-6 w-full flex items-center justify-between px-4 py-3
                rounded-lg bg-bg-surface border border-border
                hover:border-text-muted hover:bg-bg-hover
                transition-colors group
              "
            >
              <div className="text-left">
                <p className="text-sm font-medium text-text-primary">
                  Resume editing
                </p>
                <p className="text-xs text-text-secondary">{sessionName}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
            </button>
          )}

          {/* Start from scratch */}
          <button
            onClick={startFromScratch}
            className="
              mt-3 w-full flex items-center justify-between px-4 py-3
              rounded-lg bg-bg-surface border border-border
              hover:border-text-muted hover:bg-bg-hover
              transition-colors group
            "
          >
            <div className="flex items-center gap-3">
              <FilePlus className="w-4 h-4 text-text-secondary group-hover:text-accent transition-colors" />
              <p className="text-sm font-medium text-text-primary">
                Start from scratch
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
          </button>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
