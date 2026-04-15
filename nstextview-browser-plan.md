# Browser Skill File Editor — Build Plan

> Goal: Build a polished, native-feeling markdown editor for .skill files in the browser using React + CodeMirror 6. The editor should feel like a purpose-built writing tool — thin cursor, muted syntax colors, distinct frontmatter treatment, and seamless edit/preview switching.

---

## Phase 1: Core Editor Shell

Set up the foundational CodeMirror 6 instance inside a React app.

### 1.1 Project scaffold
- React + TypeScript (Vite)
- Install core packages: `@codemirror/view`, `@codemirror/state`, `@codemirror/lang-markdown`, `@lezer/markdown`
- Minimal `<App />` → `<EditorShell />` layout

### 1.2 React ↔ CodeMirror bridge
- Thin `useRef` + `useEffect` wrapper (not `@uiw/react-codemirror` — full control)
- Controlled value via `EditorView.dispatch` + `updateListener` facet
- Expose `onChange` callback to React for state sync
- Handle mount/unmount cleanup

### 1.3 Base editor config
- `EditorState.create()` with markdown language support
- Line wrapping enabled (`EditorView.lineWrapping`)
- Read-write mode with history (`@codemirror/commands` undo/redo)
- Keybindings: `defaultKeymap`, `historyKeymap`, Cmd+S for save

---

## Phase 2: Theme & Typography

Build a custom CodeMirror theme that feels like a native desktop editor, not a code IDE.

### 2.1 Custom theme via `EditorView.theme()`

Target values:

| Property | Value | CSS equivalent |
|---|---|---|
| Font | Monospace, 13px | `font-family: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace; font-size: 13px` |
| Line height | Generous spacing | `line-height: 1.7` (~22px) |
| Horizontal inset | 48px | `padding: 0 48px` on `.cm-content` |
| Top inset | 12px | `padding-top: 12px` |
| Text color | Light gray | `color: #E0E0E0` |
| Background | Dark | Match to your app's chrome |

### 2.2 Cursor styling
```css
.cm-cursor {
  border-left: 2px solid #E0E0E0;
  /* Thin, clean cursor — override the default ~1.2px */
}
```
- Keep native blink or customize
- Selection color: muted blue-gray

### 2.3 Scrollbar & chrome
- Minimal scrollbar styling (thin, fades)
- No gutter/line numbers — this is a writing tool, not an IDE
- Focus ring: subtle or none

---

## Phase 3: Markdown Syntax Highlighting

Use CodeMirror's built-in Lezer-based markdown parser with a custom color scheme. The goal is muted, non-distracting colors where syntax chrome (markers like `**`, `>`, `-`) fades into the background while content stays readable.

### 3.1 Highlight style via `syntaxHighlighting()`

| Element | Color | CM tag |
|---|---|---|
| Headings | #F2F2F2 (bright) + bold | `tags.heading` |
| Bold markers `**` | #727272 (syntax gray) | `tags.processingInstruction` |
| Bold text | #E5E5E5 | `tags.strong` |
| Italic text | #CCCCCC + italic | `tags.emphasis` |
| Inline code | #E07070 (salmon) | `tags.monospace` |
| Code block fence | #727272 | `tags.processingInstruction` |
| Links | #6699CC (blue) | `tags.link`, `tags.url` |
| Blockquote `>` | #999999 | `tags.quote` |
| List markers | #727272 | `tags.list` |
| Strikethrough | #999999 + line-through | `tags.strikethrough` |

### 3.2 Verify coverage
- Test all markdown constructs: headings (h1–h6), bold, italic, strikethrough, inline code, fenced code blocks, links, blockquotes, ordered/unordered lists, task lists, horizontal rules
- Ensure nested constructs highlight correctly (bold inside heading, etc.)

---

## Phase 4: YAML Frontmatter

Frontmatter gets its own distinct visual treatment — this is what makes a .skill file editor feel purpose-built rather than generic.

### 4.1 Extend Lezer markdown parser for frontmatter
- Use `@lezer/markdown`'s `defineLanguage` / `parseMixed` to register a frontmatter block (content between opening `---` and closing `---` at the top of the file)
- Parse inner YAML: key names, colons, values as separate node types
- Or: use `@codemirror/lang-yaml` as a nested language inside the frontmatter block

### 4.2 Frontmatter decorations
- `---` delimiters: syntax gray (#727272)
- YAML keys: bright (#F2F2F2), heading-like treatment
- YAML colons: syntax gray
- YAML values: blue-purple (#8C8CA6) — distinct from body text
- Entire frontmatter block: subtle background tint or left-border to visually separate from body content

### 4.3 Protected range behavior
- Frontmatter block should not trigger markdown highlighting rules inside it
- CodeMirror handles this naturally via the nested language approach — YAML parser takes over inside the block

---

## Phase 5: Edit / Preview Toggle

Segmented mode switcher between raw source editing and rendered preview.

### 5.1 Mode state
- React state: `mode: 'edit' | 'preview'`
- Persist preference to `localStorage`
- Keyboard shortcut: Cmd+Shift+P to toggle

### 5.2 Toolbar switcher UI
- Segmented control with edit (pencil) and preview (eye) icons
- Positioned in a toolbar bar above the editor

### 5.3 Preview renderer
- Use `react-markdown` + `remark-gfm` for GFM support (tables, strikethrough, task lists)
- Code block highlighting: `rehype-highlight` or `shiki` for syntax coloring
- Frontmatter: strip from rendered output, display as styled `<pre>` block at top
- Style the preview to match the editor's typography: same font size, line height, padding

### 5.4 Scroll sync (optional, nice-to-have)
- Sync scroll position between edit and preview modes so toggling doesn't lose your place

---

## Phase 6: Editor Commands & Keybindings

Markdown-aware text manipulation shortcuts.

### 6.1 Markdown commands
- Bold toggle: Cmd+B (wrap/unwrap `**`)
- Italic toggle: Cmd+I (wrap/unwrap `*`)
- Inline code toggle: Cmd+E (wrap/unwrap `` ` ``)
- Heading cycle: Cmd+Shift+H (cycle # level)
- Link insert: Cmd+K (insert `[text](url)` template)
- List toggle: Cmd+Shift+L

### 6.2 Smart editing behaviors
- Tab inside list: indent list item
- Enter in list: continue list marker on next line
- Enter on empty list item: remove marker (exit list)
- Backspace at start of list item: unindent

### 6.3 Save
- Cmd+S: trigger save callback to parent (file write, API call, etc.)
- Visual indicator for unsaved changes (dot in tab/title)

---

## Phase 7: File I/O & State Management

### 7.1 Document model
- `editorContent: string` — current text
- `hasUnsavedChanges: boolean` — dirty tracking
- `isLoading: boolean` — loading state
- File metadata: name, path, last modified

### 7.2 Autosave
- Debounced save (1 second after last keystroke)
- Save on blur / mode switch / file switch
- Optimistic save indicator

### 7.3 .skill file handling
- Parse `.skill` / `.md` files with YAML frontmatter
- Expose parsed frontmatter as structured data for any sidebar/metadata display
- Round-trip: edits to source preserve frontmatter structure

---

## Phase 8: Polish & Details

### 8.1 Dark / light theme
- Two theme variants
- Respect `prefers-color-scheme` media query
- Manual toggle

### 8.2 Focus management
- Auto-focus editor on mount
- Trap focus appropriately in modal dialogs
- Cmd+L or similar for "go to line"

### 8.3 Accessibility
- ARIA labels on editor region
- Screen reader announcements for mode switches
- Keyboard-navigable toolbar

### 8.4 Performance
- CodeMirror 6 is already incremental — no full-document re-parse on keystroke
- Lazy-load preview renderer (only mount when preview mode active)
- Keep bundle lean: tree-shake unused CodeMirror extensions

---

## Dependency Summary

| Package | Purpose |
|---|---|
| `@codemirror/view` | Editor view, decorations, themes, cursor |
| `@codemirror/state` | Editor state, transactions, facets |
| `@codemirror/lang-markdown` | Markdown language + syntax tree |
| `@codemirror/lang-yaml` | Nested YAML in frontmatter |
| `@codemirror/commands` | Default keybindings, history |
| `@codemirror/autocomplete` | Optional: frontmatter key autocomplete |
| `@lezer/markdown` | Extend markdown parser for frontmatter |
| `react-markdown` | Preview rendering |
| `remark-gfm` | GFM support in preview |
| `rehype-highlight` or `shiki` | Code block highlighting in preview |

---

## Build Order (Recommended)

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8
```

Phases 1–4 are the core — get the editor feeling right before adding modes and commands. You'll know it's working when typing markdown feels right: the cursor is thin, the colors are muted, the frontmatter glows differently, and the text breathes with proper spacing.

Phase 5 adds the mode switcher. Phases 6–8 are progressive enhancement.
