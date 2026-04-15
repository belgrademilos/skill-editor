import { useEffect, useRef } from 'react';
import { useCodeMirror } from './useCodeMirror';

interface SkillEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
}

export function SkillEditor({ value, onChange, onSave }: SkillEditorProps) {
  const { containerRef, setValue } = useCodeMirror({
    initialValue: value,
    onChange,
    onSave,
  });

  // Sync external value changes (e.g., loading a new file)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setValue(value);
  }, [value, setValue]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full bg-bg-primary"
    />
  );
}
