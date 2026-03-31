import { useState } from 'react';
import githubDgrey from '../../brand/github/GitHub-dark-dgrey.svg';
import githubLgrey from '../../brand/github/GitHub-dark-lgrey.svg';
import { AboutModal } from './AboutModal';

export function SiteFooter() {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <footer className="border-t border-border px-6 py-4 flex items-center justify-start text-xs text-text-muted shrink-0">
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href="https://github.com/belgrademilos/Skill-Editor"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-1.5 hover:text-text-secondary transition-colors"
        >
          <img src={githubDgrey} alt="GitHub" className="h-3.5 w-3.5 block group-hover:hidden" />
          <img src={githubLgrey} alt="GitHub" className="h-3.5 w-3.5 hidden group-hover:block" />
        </a>
        <span aria-hidden="true">·</span>
        <button
          onClick={() => setAboutOpen((current) => !current)}
          aria-expanded={aboutOpen}
          aria-haspopup="dialog"
          className="hover:text-text-secondary transition-colors"
        >
          WTF is Skill Editor?
        </button>
        <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
      </div>
    </footer>
  );
}
