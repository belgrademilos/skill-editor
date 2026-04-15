import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

/**
 * Decorates YAML frontmatter lines between --- delimiters at the top of the document.
 * - `---` delimiters get muted gray
 * - YAML keys (before the colon) get bold bright white
 * - YAML values (after the colon) get blue-gray
 */

const delimiterDeco = Decoration.mark({ class: 'cm-fm-delimiter' });
const keyDeco = Decoration.mark({ class: 'cm-fm-key' });
const colonDeco = Decoration.mark({ class: 'cm-fm-colon' });
const valueDeco = Decoration.mark({ class: 'cm-fm-value' });

function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;

  // Frontmatter must start at line 1
  const firstLine = doc.line(1);
  if (firstLine.text.trim() !== '---') return builder.finish();

  // Mark opening delimiter
  builder.add(firstLine.from, firstLine.to, delimiterDeco);

  let closingFound = false;
  for (let i = 2; i <= doc.lines; i++) {
    const line = doc.line(i);
    const text = line.text;

    if (text.trim() === '---') {
      // Closing delimiter
      builder.add(line.from, line.to, delimiterDeco);
      closingFound = true;
      break;
    }

    // Parse YAML key: value
    const colonIdx = text.indexOf(':');
    if (colonIdx > 0) {
      // Key portion (before colon)
      builder.add(line.from, line.from + colonIdx, keyDeco);
      // Colon
      builder.add(line.from + colonIdx, line.from + colonIdx + 1, colonDeco);
      // Value portion (after colon + space)
      const valueStart = colonIdx + 1;
      if (valueStart < text.length) {
        builder.add(line.from + valueStart, line.to, valueDeco);
      }
    }
  }

  if (!closingFound) return Decoration.none;
  return builder.finish();
}

export const frontmatterDecorationPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations }
);

/**
 * Theme rules for frontmatter decorations.
 */
export const frontmatterDecorationTheme = EditorView.baseTheme({
  '.cm-fm-delimiter': {
    color: '#555555',
  },
  '.cm-fm-key': {
    color: '#E0E0E0',
    fontWeight: 'bold',
  },
  '.cm-fm-colon': {
    color: '#555555',
  },
  '.cm-fm-value': {
    color: '#8C8CA6',
  },
});
