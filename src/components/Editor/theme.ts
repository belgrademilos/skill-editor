import { EditorView } from '@codemirror/view';
import { HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';

/**
 * Custom dark theme for the skill editor.
 * Purpose-built writing tool — no line numbers, no gutter, generous spacing.
 */
export const skillEditorTheme = EditorView.theme(
  {
    '&': {
      height: '100%',
      fontSize: '14px',
      fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
      backgroundColor: 'transparent',
    },
    '.cm-content': {
      padding: '24px 48px 120px',
      lineHeight: '1.7',
      caretColor: '#E0E0E0',
      fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
      maxWidth: '820px',
      margin: '0 auto',
    },
    '.cm-scroller': {
      overflow: 'auto',
      height: '100%',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#E0E0E0',
      borderLeftWidth: '2px',
    },
    '.cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: '#364559 !important',
    },
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: '#364559 !important',
    },
    '.cm-activeLine': {
      backgroundColor: 'transparent',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
    },
    '.cm-gutters': {
      display: 'none',
    },
    '.cm-placeholder': {
      color: '#555555',
      fontStyle: 'italic',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    // Thin scrollbar
    '.cm-scroller::-webkit-scrollbar': {
      width: '6px',
    },
    '.cm-scroller::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '.cm-scroller::-webkit-scrollbar-thumb': {
      background: '#333',
      borderRadius: '3px',
    },
    '.cm-scroller::-webkit-scrollbar-thumb:hover': {
      background: '#444',
    },
  },
  { dark: true }
);

/**
 * Muted syntax highlighting for markdown.
 * Syntax chrome fades, content stays readable.
 */
export const skillHighlightStyle = HighlightStyle.define([
  // Headings — bright + bold
  { tag: tags.heading1, color: '#F2F2F2', fontWeight: 'bold', fontSize: '1.4em' },
  { tag: tags.heading2, color: '#F2F2F2', fontWeight: 'bold', fontSize: '1.2em' },
  { tag: tags.heading3, color: '#F2F2F2', fontWeight: 'bold', fontSize: '1.1em' },
  { tag: tags.heading4, color: '#E5E5E5', fontWeight: 'bold' },
  { tag: tags.heading5, color: '#E5E5E5', fontWeight: 'bold' },
  { tag: tags.heading6, color: '#E5E5E5', fontWeight: 'bold' },

  // Bold / italic
  { tag: tags.strong, color: '#E5E5E5', fontWeight: 'bold' },
  { tag: tags.emphasis, color: '#CCCCCC', fontStyle: 'italic' },
  { tag: tags.strikethrough, color: '#999999', textDecoration: 'line-through' },

  // Syntax markers (**, *, `, ---, etc.) — muted
  { tag: tags.processingInstruction, color: '#555555' },

  // Links — same as body text in source mode ([placeholders] are common without real URLs)
  { tag: tags.link, color: '#E0E0E0' },
  { tag: tags.url, color: '#E0E0E0' },

  // Blockquote
  { tag: tags.quote, color: '#999999' },

  // List markers
  { tag: tags.list, color: '#727272' },

  // Code block content
  { tag: tags.content, color: '#E0E0E0' },

  // YAML frontmatter
  { tag: tags.meta, color: '#727272' },
  { tag: tags.propertyName, color: '#F2F2F2', fontWeight: 'bold' },
  { tag: tags.string, color: '#8C8CA6' },
  { tag: tags.bool, color: '#8C8CA6' },
  { tag: tags.number, color: '#8C8CA6' },
  { tag: tags.keyword, color: '#727272' },

  // Separator / HR
  { tag: tags.separator, color: '#555555' },

  // Comments
  { tag: tags.comment, color: '#555555' },

  // Inline + fenced code (`…` and ``` blocks). Must be last: CodeMirror merges tags
  // (e.g. list/quote + monospace) onto one span; later rules win in the stylesheet.
  { tag: tags.monospace, color: '#E07070' },
]);
