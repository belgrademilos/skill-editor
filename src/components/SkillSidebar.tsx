import { useState, useRef, useEffect } from 'react';
import { Plus, Upload, Github, Loader2, UserRound, MoreHorizontal, Copy, Trash2 } from 'lucide-react';
import { useSkillLibraryStore } from '../store/skillLibraryStore';
import { useSkillStore } from '../store/skillStore';
import { parseSkillFile, parseSkillFromGitHub } from '../lib/parseSkill';
import { useAuth } from '../hooks/useAuth';
import { AuthModal } from './AuthModal';

function getInitials(email: string | undefined) {
  return (email?.trim().charAt(0).toUpperCase()) || '?';
}

export function SkillSidebar() {
  const skills = useSkillLibraryStore((s) => s.skills);
  const selectedId = useSkillLibraryStore((s) => s.selectedId);
  const selectSkill = useSkillLibraryStore((s) => s.selectSkill);
  const addSkill = useSkillLibraryStore((s) => s.addSkill);
  const removeSkill = useSkillLibraryStore((s) => s.removeSkill);
  const duplicateSkill = useSkillLibraryStore((s) => s.duplicateSkill);
  const setActiveContent = useSkillStore((s) => s.setActiveContent);
  const { isLoading, user, signOut } = useAuth();

  const [addOpen, setAddOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [githubOpen, setGithubOpen] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [githubLoading, setGithubLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowMenuOpen, setRowMenuOpen] = useState<string | null>(null);
  const [rowMenuPos, setRowMenuPos] = useState<{ top: number; left: number } | null>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const rowMenuRef = useRef<HTMLDivElement>(null);
  const rowMenuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!addOpen) return;
    const handler = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [addOpen]);

  useEffect(() => {
    if (!rowMenuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        rowMenuRef.current && !rowMenuRef.current.contains(target) &&
        rowMenuButtonRef.current && !rowMenuButtonRef.current.contains(target)
      ) {
        setRowMenuOpen(null);
      }
    };
    const close = () => setRowMenuOpen(null);
    document.addEventListener('mousedown', handler);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [rowMenuOpen]);

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  };

  const handleSelect = (id: string) => {
    const skill = skills.find((s) => s.id === id);
    if (!skill) return;
    selectSkill(id);
    setActiveContent(skill.content);
  };

  const handleUpload = () => {
    setAddOpen(false);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.skill,.zip,.md';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const parsed = await parseSkillFile(file);
        const id = `${parsed.name}-${Date.now()}`;
        addSkill({ id, name: parsed.name, content: parsed.content });
        setActiveContent(parsed.content);
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to upload');
      }
    };
    input.click();
  };

  const handleOpenGithub = () => {
    setAddOpen(false);
    setGithubUrl('');
    setGithubOpen(true);
  };

  const handleGithubImport = async () => {
    if (!githubUrl.trim() || githubLoading) return;
    setGithubLoading(true);
    try {
      const parsed = await parseSkillFromGitHub(githubUrl);
      const id = `${parsed.name}-${Date.now()}`;
      addSkill({ id, name: parsed.name, content: parsed.content });
      setActiveContent(parsed.content);
      setGithubOpen(false);
      setGithubUrl('');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to import');
    } finally {
      setGithubLoading(false);
    }
  };

  const handleDuplicate = (id: string) => {
    setRowMenuOpen(null);
    const newEntry = duplicateSkill(id);
    if (newEntry) setActiveContent(newEntry.content);
  };

  const handleDelete = (id: string) => {
    setRowMenuOpen(null);
    removeSkill(id);
    const next = useSkillLibraryStore.getState();
    const active = next.skills.find((s) => s.id === next.selectedId);
    if (active) setActiveContent(active.content);
  };

  const handleSignIn = () => {
    setAuthOpen(true);
  };

  const handleSignOut = () => {
    void signOut();
  };

  const showSignedOutCard = isLoading || !user;
  const initials = getInitials(user?.email);

  return (
    <>
      <div className="w-64 shrink-0 bg-bg-sidebar border-r border-border flex flex-col h-full">
        <div className="flex h-11 shrink-0 items-center justify-between gap-2 pl-4 pr-3 border-b border-border">
          <span className="text-sm font-semibold leading-none text-text-primary">
            Skills
          </span>
          <div className="relative flex shrink-0 items-center" ref={addMenuRef}>
            <button
              type="button"
              onClick={() => setAddOpen((v) => !v)}
              className="inline-flex size-8 items-center justify-center rounded-md hover:bg-bg-hover transition-colors text-text-secondary hover:text-text-primary"
              title="Add skill"
            >
              <Plus className="size-4 shrink-0" aria-hidden />
            </button>
            {addOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg bg-bg-surface border border-border shadow-lg py-1">
                <button
                  onClick={handleUpload}
                  className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-hover transition-colors flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5 text-text-muted" />
                  Upload
                </button>
                <button
                  onClick={handleOpenGithub}
                  className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-hover transition-colors flex items-center gap-2"
                >
                  <Github className="w-3.5 h-3.5 text-text-muted" />
                  Import GitHub URL
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="px-4 py-2 text-xs text-danger border-b border-border">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-1 px-2">
          {skills.map((skill) => {
            const isSelected = selectedId === skill.id;
            const isMenuOpen = rowMenuOpen === skill.id;
            return (
              <div key={skill.id} className="relative">
                <button
                  onClick={() => handleSelect(skill.id)}
                  className={`w-full text-left py-2 text-sm flex items-center gap-2.5 rounded-lg transition-colors ${
                    isSelected ? 'pl-4 pr-10' : 'px-4'
                  } ${
                    isSelected
                      ? 'bg-accent text-white'
                      : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                  }`}
                >
                  <span className="truncate">{skill.name}</span>
                </button>
                {isSelected && (
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                    <button
                      ref={isMenuOpen ? rowMenuButtonRef : undefined}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (rowMenuOpen === skill.id) {
                          setRowMenuOpen(null);
                          return;
                        }
                        const rect = e.currentTarget.getBoundingClientRect();
                        setRowMenuPos({ top: rect.bottom + 4, left: rect.left });
                        setRowMenuOpen(skill.id);
                      }}
                      className="inline-flex size-7 items-center justify-center rounded-md text-white/80 hover:text-white hover:bg-white/15 transition-colors"
                      title="More actions"
                    >
                      <MoreHorizontal className="size-4" aria-hidden />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="shrink-0 border-t border-border p-4">
          {showSignedOutCard ? (
            <>
              <p className="text-[11px] font-semibold leading-4 text-text-primary">
                Save your skills
              </p>
              <p className="mt-2 text-[11px] leading-4 text-text-secondary">
                Log in to keep your skill library connected across devices as cloud features roll out.
              </p>
              <button
                type="button"
                onClick={handleSignIn}
                className="mt-3 w-full rounded-full border border-border bg-transparent px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-bg-hover"
              >
                Log in
              </button>
            </>
          ) : (
            <div className="rounded-xl border border-border bg-bg-surface px-3 py-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg-hover text-xs font-semibold text-text-primary">
                  {initials === '?' ? <UserRound className="size-4" /> : initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold leading-4 text-text-primary">
                    Signed in
                  </p>
                  <p className="mt-1 truncate text-xs leading-4 text-text-secondary">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-3 w-full rounded-full border border-border bg-transparent px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-bg-hover"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {rowMenuOpen && rowMenuPos && (
        <div
          ref={rowMenuRef}
          style={{ position: 'fixed', top: rowMenuPos.top, left: rowMenuPos.left }}
          className="z-50 w-40 rounded-lg bg-bg-surface border border-border shadow-lg py-1"
        >
          <button
            onClick={() => handleDuplicate(rowMenuOpen)}
            className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-hover transition-colors flex items-center gap-2"
          >
            <Copy className="w-3.5 h-3.5 text-text-muted" />
            Duplicate
          </button>
          <button
            onClick={() => handleDelete(rowMenuOpen)}
            className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-bg-hover transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}

      {githubOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => !githubLoading && setGithubOpen(false)}
        >
          <div
            className="bg-bg-surface border border-border rounded-xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-text-primary mb-1">
              Import from GitHub
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              Paste a public GitHub repo URL. SKILL.md will be fetched from the default branch.
            </p>
            <div className="relative">
              <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGithubImport();
                  if (e.key === 'Escape') setGithubOpen(false);
                }}
                placeholder="https://github.com/owner/repo"
                autoFocus
                className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm bg-bg-primary border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setGithubOpen(false)}
                disabled={githubLoading}
                className="px-3 py-1.5 text-sm rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGithubImport}
                disabled={githubLoading || !githubUrl.trim()}
                className="px-3 py-1.5 text-sm rounded-md bg-accent text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {githubLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
