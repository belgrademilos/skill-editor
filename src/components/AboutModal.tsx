import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

export function AboutModal({ open, onClose }: AboutModalProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const bubble = bubbleRef.current;
      const target = event.target;
      if (!bubble || !(target instanceof Node)) return;
      if (!bubble.contains(target)) onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={bubbleRef}
      role="dialog"
      aria-modal="false"
      aria-label="What is Skill Editor?"
      className="
        fixed bottom-18 left-6 z-50
        w-[min(28rem,calc(100vw-3rem))]
        text-left
      "
    >
      <div className="bg-bg-primary border border-border rounded-xl p-6 text-text-primary shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">What is Skill Editor?</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-secondary transition-colors p-1 -mr-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-sm text-text-secondary leading-relaxed">
          <p>Skill Editor is a free, browser-based editor for agent skills.</p>

          <p>
            Works with skills for Openclaw, Claude, Codex, Cursor, Antigravity,
            Perplexity Computer, Manus, Minimax, etc.
          </p>

          <p>
            Upload a{' '}
            <code className="text-xs bg-bg-surface px-1.5 py-0.5 rounded">.skill</code>,{' '}
            <code className="text-xs bg-bg-surface px-1.5 py-0.5 rounded">.zip</code>, or{' '}
            <code className="text-xs bg-bg-surface px-1.5 py-0.5 rounded">.md</code> file,
            edit it with a rich markdown editor, and export it back.
          </p>

          <p>
            Skill Editor was designed by{' '}
            <a
              href="https://github.com/belgrademilos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#e5e5e5] hover:underline"
            >
              @belgrademilos
            </a>
            {' '}because he needed a fast way to edit{' '}
            <code className="text-xs bg-bg-surface px-1.5 py-0.5 rounded">.skill</code> files
            for Claude Cowork.
          </p>

          <p>
            Skill Editor is a{' '}
            <a
              href="https://github.com/belgrademilos/Skill-Editor"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#e5e5e5] hover:underline"
            >
              open-source
            </a>
            , fork the code and run it locally!
          </p>

        </div>
      </div>
    </div>
  );
}
