interface PlainTextEditorProps {
  content: string;
  onChange: (value: string) => void;
}

export function PlainTextEditor({ content, onChange }: PlainTextEditorProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <textarea
          defaultValue={content}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-full resize-none bg-bg-primary text-text-primary font-mono text-sm leading-relaxed p-6 outline-none border-none"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
