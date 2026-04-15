import { useMemo } from 'react';
import { useSkillStore } from '../store/skillStore';
import { getTokenCount } from '../lib/skillDocumentStats';

export function SiteFooter() {
  const content = useSkillStore((s) => s.content);

  const tokens = useMemo(() => getTokenCount(content), [content]);

  return (
    <footer
      className="flex shrink-0 border-t border-border px-4 py-3 text-xs tabular-nums text-text-secondary"
      aria-live="polite"
      title="Token count is estimated (~4 characters per token; typical for English prose)."
    >
      <span>
        <span className="text-text-muted">Token count: </span>
        {tokens.toLocaleString()}
      </span>
    </footer>
  );
}
