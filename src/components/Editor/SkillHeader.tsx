import { useCallback, useEffect, useRef, useState } from 'react';
import { useSkillStore } from '../../store/skillStore';

const MAX_NAME_LENGTH = 64;

function sanitizeSkillName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, '-')       // spaces → hyphens
    .replace(/[^a-z0-9-]/g, '') // strip anything not lowercase, digit, or hyphen
    .replace(/-{2,}/g, '-')     // collapse multiple hyphens
    .slice(0, MAX_NAME_LENGTH);
}

export function SkillHeader() {
  const { skillName, skillDescription, updateSkillName, updateSkillDescription } =
    useSkillStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showLimitTooltip, setShowLimitTooltip] = useState(false);
  const [shake, setShake] = useState(false);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [skillDescription, autoResize]);

  const triggerLimitFeedback = useCallback(() => {
    setShake(true);
    setShowLimitTooltip(true);
    clearTimeout(tooltipTimer.current);
    tooltipTimer.current = setTimeout(() => setShowLimitTooltip(false), 2000);
    setTimeout(() => setShake(false), 400);
  }, []);

  useEffect(() => {
    return () => clearTimeout(tooltipTimer.current);
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeSkillName(e.target.value);
    if (sanitized.length >= MAX_NAME_LENGTH && e.target.value.length > skillName.length) {
      triggerLimitFeedback();
    }
    updateSkillName(sanitized);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateSkillDescription(e.target.value);
    autoResize();
  };

  return (
    <div className="border-b border-border bg-bg-surface/50 px-6 py-4 space-y-3">
      {/* Name Field */}
      <div className="relative">
        <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
          Name
        </label>
        <input
          type="text"
          value={skillName}
          onChange={handleNameChange}
          maxLength={MAX_NAME_LENGTH}
          placeholder="my-skill-name"
          className={`
            w-full bg-bg-primary border border-border rounded-md px-3 py-2
            text-sm text-text-primary font-mono
            focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
            transition-colors placeholder:text-text-muted
            ${shake ? 'animate-[shake_0.3s_ease-in-out]' : ''}
          `}
        />
        {showLimitTooltip && (
          <div className="absolute left-0 top-full mt-1.5 px-2.5 py-1.5 rounded-md bg-bg-active border border-border text-xs text-text-secondary shadow-lg animate-[fadeIn_0.15s_ease-out]">
            Maximum {MAX_NAME_LENGTH} characters
          </div>
        )}
      </div>

      {/* Description Field */}
      <div>
        <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
          Description
        </label>
        <textarea
          ref={textareaRef}
          value={skillDescription}
          onChange={handleDescriptionChange}
          placeholder="What this skill does and when to use it"
          rows={1}
          className="
            w-full bg-bg-primary border border-border rounded-md px-3 py-2
            text-sm text-text-primary resize-none overflow-hidden
            focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
            transition-colors placeholder:text-text-muted
          "
        />
      </div>
    </div>
  );
}
