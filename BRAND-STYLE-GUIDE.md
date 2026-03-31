# Skill Editor — Brand & Style Guide

## Identity

- **Product name**: Skill Editor
- **Domain**: skilleditor.com
- **Tagline**: "Create & Edit .Skills"
- **Logo**: Custom SVG icon (overlapping pages/skill shape) in accent orange (`#D97757`). Two variants: `fe-logo-orange.svg` (primary), `fe-logo-light.svg`
- **Favicon**: `favicon-dark.svg`
- **License**: MIT, open-source

---

## Color Palette

### Backgrounds

| Token | Value | Usage |
|---|---|---|
| `--color-bg-primary` | `#1a1a1a` | Main background |
| `--color-bg-sidebar` | `#141414` | Sidebar, code blocks |
| `--color-bg-surface` | `#242424` | Cards, inputs, badges |
| `--color-bg-hover` | `#2a2a2a` | Hover states |
| `--color-bg-active` | `#333333` | Active/selected states |

### Borders

| Token | Value | Usage |
|---|---|---|
| `--color-border` | `#333333` | Default borders |
| `--color-border-subtle` | `#2a2a2a` | Subtle dividers |

### Text

| Token | Value | Usage |
|---|---|---|
| `--color-text-primary` | `#e5e5e5` | Headings, body text |
| `--color-text-secondary` | `#999999` | Descriptions, secondary labels |
| `--color-text-muted` | `#666666` | Placeholders, disabled text |

### Accent

| Token | Value | Usage |
|---|---|---|
| `--color-accent` | `#D97757` | Primary accent (terracotta orange) |
| `--color-accent-hover` | `#E08A6D` | Accent hover state |
| `--color-accent-subtle` | `rgba(217, 119, 87, 0.15)` | Accent tinted backgrounds |

### Status

| Token | Value | Usage |
|---|---|---|
| `--color-danger` | `#ef4444` | Error/danger |
| `--color-danger-hover` | `#dc2626` | Danger hover |

### Other

| Element | Value | Notes |
|---|---|---|
| Scrollbar thumb | `#444` / `#555` hover | Custom WebKit scrollbar |
| Theme color (meta) | `#0f172a` | Browser chrome / mobile status bar |

The app is **dark-only** — no light mode toggle or `prefers-color-scheme` switching.

---

## Typography

### Font Families

| Token | Value | Usage |
|---|---|---|
| `--font-sans` | `Inter`, system-ui, sans-serif | All UI text |
| `--font-mono` | `JetBrains Mono`, monospace | Code blocks, skill name input |

Loaded via Google Fonts:
- **Inter**: weights 400, 500, 600, 700
- **JetBrains Mono**: weights 400, 500

### Rendering

- `-webkit-font-smoothing: antialiased`
- `-moz-osx-font-smoothing: grayscale`

### Editor Heading Scale

| Level | Size | Weight | Margin |
|---|---|---|---|
| H1 | `1.75rem` | 700 | `1.5rem 0 0.75rem` |
| H2 | `1.35rem` | 600 | `1.25rem 0 0.5rem` |
| H3 | `1.1rem` | 600 | `1rem 0 0.5rem` |

### Editor Body

- Font size: `15px`
- Line height: `1.7`
- Code blocks: `0.85em`, line height `1.6`
- Inline code: `0.875em`

### UI Text Patterns

| Pattern | Classes | Example |
|---|---|---|
| Field label | `text-[11px] font-semibold text-text-muted uppercase tracking-wider` | "NAME", "DESCRIPTION" |
| Section header | `text-xs font-semibold text-text-secondary uppercase tracking-wider` | "Skill Explorer" |
| Body text | `text-sm text-text-primary` | File names, descriptions |
| Secondary text | `text-sm text-text-secondary` | Subtitles, hints |
| Code badge | `text-xs bg-bg-surface px-1.5 py-0.5 rounded` | `.skill`, `.zip`, `.md` |
| Status text | `text-xs text-text-muted` | "Saving...", "Saved" |

---

## Iconography

- **Library**: lucide-react
- **Style**: Outline/stroke icons (lucide default)

### Sizes

| Size | Classes | Usage |
|---|---|---|
| Tiny | `w-3 h-3` | Chevrons, status indicators |
| Small | `w-3.5 h-3.5` | Inline action icons |
| Standard | `w-4 h-4` | File tree, toolbar, buttons |
| Hero | `w-6 h-6` | Drop zone icon |

### Colors

| State | Class |
|---|---|
| Default | `text-text-muted` |
| Hover | `text-text-secondary` |
| Active / emphasis | `text-accent` |
| SKILL.md files | `text-accent` (always) |
| Folder icons | `text-accent/70` |

---

## Spacing & Layout

### Key Dimensions

| Element | Value |
|---|---|
| Top bar height | `h-12` |
| Sidebar default width | `250px` |
| Sidebar resize range | `180px` – `500px` |
| Tree item indent | `12px` per depth level |

### Padding Patterns

| Context | Value |
|---|---|
| Sidebar header | `px-3 py-3` |
| Content sections | `px-6 py-4` |
| Hero drop zone | `p-12` |
| Tree items | `px-2 py-1` |
| Buttons (primary) | `px-3 py-1.5` |
| Buttons (ghost) | `p-1.5` |
| Inputs | `px-3 py-2` |
| Modal | `p-6` |

### Border Radius

| Token | Usage |
|---|---|
| `rounded-md` | Buttons, inputs |
| `rounded-lg` | Cards, dropdown menus |
| `rounded-xl` | Modals, drop zones |
| `rounded-full` | Circles, pills |
| `rounded` (default 4px) | Code badges |

---

## Component Patterns

### Buttons

**Primary (accent)**
```
bg-accent text-white hover:bg-accent-hover rounded-md px-3 py-1.5 text-sm
```

**Ghost / icon**
```
text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-md p-1.5
```

**List / menu item**
```
w-full text-left px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-hover
```

**Card button (intro screen)**
```
bg-bg-surface border border-border rounded-lg px-4 py-3
hover:border-text-muted hover:bg-bg-hover
```

### Inputs

```
w-full bg-bg-primary border border-border rounded-md px-3 py-2 text-sm text-text-primary
focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
placeholder:text-text-muted
```

### Dropdown Menus

```
bg-bg-surface border border-border rounded-lg shadow-xl py-1 z-50
```
- Items: `px-3 py-2 text-sm text-text-primary hover:bg-bg-hover`
- Dividers: `border-t border-border my-1`

### Modal / Dialog

```
bg-bg-primary border border-border rounded-xl p-6 shadow-2xl
```
- Fixed position (not centered overlay)
- Close on outside click + Escape key

### Drop Zone

```
border-2 border-dashed rounded-xl p-12 text-center
```
- **Idle**: `border-border hover:border-text-muted hover:bg-bg-surface/50`
- **Active**: `border-accent bg-accent/5 scale-[1.02]`

### Bubble Toolbar (text selection)

```
rounded-lg border border-border bg-bg-sidebar p-1 shadow-xl
```
- Separators between sections: `h-5 mx-0.5`

### Editor Surfaces

- **Sidebar**: `bg-bg-sidebar border-r border-border`
- **Top bar**: `h-12 border-b border-border bg-bg-sidebar`
- **Skill header**: `border-b border-border bg-bg-surface/50 px-6 py-4`
- **Main area**: `bg-bg-primary`
- **Footer**: `border-t border-border px-6 py-4 text-xs text-text-muted`

---

## Animations & Transitions

### Transitions

All interactive elements use `transition-colors`. Layout changes (sidebar collapse) use `transition-[width] duration-200`.

### Keyframes

| Name | Effect | Usage |
|---|---|---|
| `shake` | Horizontal jitter (3px) | Input validation limit feedback |
| `fadeIn` | Opacity 0 + translateY(-2px) to visible | Tooltips, menus |
| `popoverIn` | Scale(0.96) + translateY(-4px) to normal | Radix popover open |
| `popoverOut` | Normal to scale(0.96) + translateY(-4px) | Radix popover close |
| `spinning` | 360deg rotation | Image upload placeholder spinner |

### Timing

| Context | Duration | Easing |
|---|---|---|
| Color transitions | 150ms | default (ease) |
| Layout transitions | 200ms | default |
| Popover in | 150ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Popover out | 100ms | `ease-in` |
| Fade in | 150ms | `ease-out` |
| Shake | 300ms | `ease-in-out` |

---

## Tailwind v4 Configuration

Colors are defined as CSS custom properties via the `@theme` directive in `globals.css` (not in a Tailwind config file). They are consumed as standard Tailwind utilities:

```css
@theme {
  --color-bg-primary: #1a1a1a;
  --color-accent: #D97757;
  /* ... */
}
```

Usage in components:
```html
<div class="bg-bg-primary text-accent border-border">
```

---

## Brand Assets

```
src/assets/fe-logo-orange.svg   — Primary logo icon (accent orange)
src/assets/fe-logo-light.svg    — Light variant
brand/logos/favicon-dark.svg     — Favicon
brand/claude/claude-ico.svg      — Claude icon (export menu)
brand/github/GitHub-dark-dgrey.svg  — GitHub icon (default)
brand/github/GitHub-dark-lgrey.svg  — GitHub icon (hover)
```
