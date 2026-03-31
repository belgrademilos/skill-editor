import { useState, useEffect, useCallback } from 'react';
import type { Editor } from '@tiptap/core';
import { List } from 'lucide-react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  editor: Editor | null;
  scrollContainer: HTMLElement | null;
}

export function TableOfContents({ editor, scrollContainer }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  const extractHeadings = useCallback(() => {
    if (!editor) return;

    const items: TocItem[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        const level = node.attrs.level as number;
        if (level >= 1 && level <= 3) {
          const text = node.textContent;
          const id = `heading-${pos}`;
          items.push({ id, text, level });
        }
      }
    });
    setHeadings(items);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    extractHeadings();
    editor.on('update', extractHeadings);
    return () => {
      editor.off('update', extractHeadings);
    };
  }, [editor, extractHeadings]);

  // Track which heading is currently in view by querying DOM heading elements directly
  useEffect(() => {
    if (!scrollContainer || !editor || headings.length === 0) return;

    const getHeadingElements = () => {
      return Array.from(editor.view.dom.querySelectorAll('h1, h2, h3')) as HTMLElement[];
    };

    const handleScroll = () => {
      const headingEls = getHeadingElements();
      const containerRect = scrollContainer.getBoundingClientRect();
      let currentIdx = -1;

      for (let i = 0; i < headingEls.length && i < headings.length; i++) {
        const rect = headingEls[i].getBoundingClientRect();
        if (rect.top <= containerRect.top + 100) {
          currentIdx = i;
        }
      }

      if (currentIdx >= 0 && currentIdx < headings.length) {
        setActiveId(headings[currentIdx].id);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [scrollContainer, editor, headings]);

  const scrollToHeading = (id: string) => {
    if (!scrollContainer || !editor) return;

    const idx = headings.findIndex((h) => h.id === id);
    if (idx < 0) return;

    const headingEls = editor.view.dom.querySelectorAll('h1, h2, h3');
    const target = headingEls[idx];
    if (target) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const scrollTop = scrollContainer.scrollTop + (targetRect.top - containerRect.top) - 20;
      scrollContainer.scrollTo({ top: scrollTop, behavior: 'smooth' });
      setActiveId(id);
    }
  };

  if (headings.length === 0) return null;

  return (
    <div className="absolute right-6 top-0 bottom-0 w-88 hidden xl:flex items-start pt-8 pointer-events-none z-10">
      <div className="pointer-events-auto sticky top-8 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="text-text-muted mb-4">
          <List className="w-7 h-7" />
        </div>
        <nav className="flex flex-col gap-1">
          {headings.map((heading) => (
            <button
              key={heading.id}
              onClick={() => scrollToHeading(heading.id)}
              className={`
                text-left text-[22px] leading-snug py-1 transition-colors
                ${heading.level === 1 ? 'pl-0' : heading.level === 2 ? 'pl-5' : 'pl-10'}
                ${activeId === heading.id
                  ? 'text-text-primary border-l-2 border-accent -ml-px pl-3'
                  : 'text-text-muted/70 hover:text-text-secondary'
                }
              `}
              title={heading.text}
              style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
            >
              {heading.text}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
