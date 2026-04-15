import { useRef, useEffect, useCallback } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { skillEditorTheme, skillHighlightStyle } from './theme';
import { frontmatterSupport } from './frontmatter';
import { syntaxHighlighting } from '@codemirror/language';
import { searchKeymap } from '@codemirror/search';
import { frontmatterDecorationPlugin, frontmatterDecorationTheme } from './frontmatterDecoration';

interface UseCodeMirrorOptions {
  initialValue: string;
  onChange: (value: string) => void;
  onSave?: () => void;
}

export function useCodeMirror({ initialValue, onChange, onSave }: UseCodeMirrorOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);

  // Keep refs up to date without recreating the editor
  onChangeRef.current = onChange;
  onSaveRef.current = onSave;

  const setValue = useCallback((value: string) => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const saveKeymap = keymap.of([
      {
        key: 'Mod-s',
        run: () => {
          onSaveRef.current?.();
          return true;
        },
      },
    ]);

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChangeRef.current(update.state.doc.toString());
      }
    });

    const state = EditorState.create({
      doc: initialValue,
      extensions: [
        saveKeymap,
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
        markdown({ extensions: [frontmatterSupport] }),
        syntaxHighlighting(skillHighlightStyle),
        skillEditorTheme,
        frontmatterDecorationPlugin,
        frontmatterDecorationTheme,
        EditorView.lineWrapping,
        updateListener,
        placeholder('Start writing your skill instructions…'),
        EditorView.contentAttributes.of({ spellcheck: 'false' }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    // Auto-focus
    view.focus();

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // Mount once — value updates go through setValue

  return { containerRef, viewRef, setValue };
}
