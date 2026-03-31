import { useState } from 'react';
import { Code, Eye } from 'lucide-react';

interface HtmlPreviewProps {
  content: string;
  onChange: (value: string) => void;
}

export function HtmlPreview({ content, onChange }: HtmlPreviewProps) {
  const [mode, setMode] = useState<'preview' | 'source'>('preview');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toggle bar */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border bg-bg-sidebar">
        <button
          onClick={() => setMode('preview')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            mode === 'preview'
              ? 'bg-accent/15 text-accent'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Preview
        </button>
        <button
          onClick={() => setMode('source')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            mode === 'source'
              ? 'bg-accent/15 text-accent'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          Source
        </button>
      </div>

      {/* Content */}
      {mode === 'preview' ? (
        <div className="flex-1 overflow-hidden bg-white">
          <iframe
            srcDoc={content}
            sandbox="allow-scripts"
            title="HTML Preview"
            className="w-full h-full border-none"
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full resize-none bg-bg-primary text-text-primary font-mono text-sm leading-relaxed p-6 outline-none border-none"
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );
}
