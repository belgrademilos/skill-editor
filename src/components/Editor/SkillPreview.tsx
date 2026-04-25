import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseFrontmatter } from '../../lib/frontmatter';

interface SkillPreviewProps {
  content: string;
}

export function SkillPreview({ content }: SkillPreviewProps) {
  const { frontmatter, body } = parseFrontmatter(content);
  const { name, description, ...rest } = frontmatter;
  const extraEntries = Object.entries(rest).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  const hasFrontmatter = Boolean(name || description || extraEntries.length);

  return (
    <div className="h-full w-full overflow-auto bg-bg-primary">
      <div className="skill-preview mx-auto max-w-[820px] px-12 pt-6 pb-32 text-text-primary">
        {hasFrontmatter && (
          <div className="mb-8 rounded-md border border-border bg-bg-surface/40 px-4 py-3 font-mono text-[13px] leading-relaxed">
            {name && (
              <div>
                <span className="text-text-muted">name: </span>
                <span className="text-text-primary">{name}</span>
              </div>
            )}
            {description && (
              <div>
                <span className="text-text-muted">description: </span>
                <span className="text-text-primary">{description}</span>
              </div>
            )}
            {extraEntries.map(([k, v]) => (
              <div key={k}>
                <span className="text-text-muted">{k}: </span>
                <span className="text-text-primary">
                  {typeof v === 'string' ? v : JSON.stringify(v)}
                </span>
              </div>
            ))}
          </div>
        )}
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
      </div>
    </div>
  );
}
