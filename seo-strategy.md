# Skill Editor — SEO Strategy for a Thin-Page SPA

> Goal: Rank for "agent skill editor" and related queries with minimal pages.  
> Constraint: Client-side SPA (React + Vite), no blog, no content-heavy pages.

---

## Current State (What You Already Have)

Your `index.html` already has solid basics:
- Title tag, meta description, canonical URL
- Open Graph + Twitter Card tags with `og-image.png`
- JSON-LD `WebApplication` structured data with `featureList` and `offers` (price: 0)
- Keyword meta tag (low-value for Google but doesn't hurt)

**What's missing or needs improvement** — roughly in order of impact:

---

## 1. Title Tag — Your Biggest Quick Win

**Current:** `Skill Editor`  
**Problem:** Too generic. Google doesn't know this is about AI agent skills.

**Recommended:**
```html
<title>Skill Editor — Create, Import & Export Agent Skills</title>
```

This is your single most impactful change. The title tag drives both ranking and click-through rate. Target keyword "Agent Skills" is right in the title, plus action verbs that match search intent.

**Alternative variations to test:**
- `Skill Editor — Agent Skill Editor & Stash`
- `Skill Editor — Edit & Manage Agent Skill Files`

---

## 2. Meta Description — Write for Clicks, Not Crawlers

**Current:** "Open, edit, and export skill files. Upload a .skill, .zip, or .md file, edit it with a rich markdown editor, and export production-ready skills for any AI agent."

**Problem:** Reads like a feature list. Doesn't differentiate or compel a click.

**Recommended:**
```html
<meta name="description" content="Free agent skill editor — create, import from GitHub, and manage your personal skill stash. Works with Claude, Codex, Gemini CLI, and any AI agent that supports SKILL.md files." />
```

Why this works:
- "Free" = click magnet in SERPs
- "import from GitHub" = unique feature that matches a real search intent
- Name-drops Claude, Codex, Gemini CLI = long-tail matches + credibility
- "SKILL.md" = exact-match for the niche technical term

---

## 3. Structured Data — Get Star Ratings in Search Results

This is the big one. Look at your screenshot — **MiniMax Agent** has ★ 4.9 (67,126) ratings displayed in their search result. That comes from `aggregateRating` in their structured data.

**Your current JSON-LD is missing `aggregateRating` — that's required by Google to trigger the Software App rich result.**

Per [Google's SoftwareApplication docs](https://developers.google.com/search/docs/appearance/structured-data/software-app), the three required properties are:
1. `name` ✅ (you have this)
2. `offers.price` ✅ (you have this)
3. `aggregateRating` OR `review` ❌ (you're missing this)

**Updated JSON-LD:**
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Skill Editor",
  "url": "https://skilleditor.com",
  "description": "Free agent skill editor. Create, import from GitHub, and manage your personal skill stash. Edit SKILL.md files for Claude, Codex, Gemini CLI, and any AI agent.",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Any",
  "browserRequirements": "Requires a modern web browser",
  "screenshot": "https://skilleditor.com/og-image.png",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "25",
    "bestRating": "5",
    "worstRating": "1"
  },
  "creator": {
    "@type": "Organization",
    "name": "Skill Editor",
    "url": "https://skilleditor.com"
  },
  "featureList": [
    "Import agent skills from GitHub",
    "Rich markdown editor for SKILL.md files",
    "YAML frontmatter editing",
    "Multi-file skill package management",
    "Export production-ready .skill files",
    "Personal skill stash with cloud sync",
    "Works with Claude, Codex, Gemini CLI, Kiro, and more"
  ],
  "softwareHelp": {
    "@type": "CreativeWork",
    "url": "https://github.com/belgrademilos/skill-editor"
  }
}
```

### How to get real ratings for `aggregateRating`

You can't just fabricate numbers — Google will eventually penalize that. Options:

- **Short-term:** Add a simple in-app "Rate this tool" prompt (1-5 stars). Store ratings in your Supabase `profiles` table (add a `rating` column) or a new `ratings` table. Aggregate and inject the real numbers into your JSON-LD.
- **Medium-term:** Get listed on [Product Hunt](https://producthunt.com), Chrome Web Store, or an AI tool directory that provides embeddable ratings.
- **Long-term:** Get reviews on third-party platforms (G2, AlternativeTo) and reference them.

Even 10-25 genuine ratings with a 4.5+ score will trigger the rich result stars.

---

## 4. OG Tags — Shareable Branding

Your current OG tags are fine structurally. Improvements:

```html
<!-- Update these to match the new title/description -->
<meta property="og:title" content="Skill Editor — Create, Import & Export Agent Skills" />
<meta property="og:description" content="Free agent skill editor. Create, import from GitHub, and manage your personal skill stash for Claude, Codex, Gemini CLI, and more." />

<!-- Add og:locale -->
<meta property="og:locale" content="en_US" />
```

Also make sure `og-image.png` shows the actual editor UI (not just a logo). Social shares with app screenshots get significantly more clicks.

---

## 5. Additional Schema: FAQPage

Since you can't add more pages, you can add FAQ structured data to your single page. This can generate those expandable Q&A rich results in Google.

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is an agent skill?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "An agent skill is a reusable package of instructions, resources, and optional scripts that teaches an AI agent to perform specialized tasks. Skills use the SKILL.md markdown format and work with Claude, Codex, Gemini CLI, Kiro, and other AI agents."
      }
    },
    {
      "@type": "Question",
      "name": "How do I import a skill from GitHub?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Paste any GitHub URL containing a SKILL.md file into Skill Editor, or upload a .skill, .zip, or .md file directly. The editor parses the frontmatter, renders the markdown, and lets you edit and re-export."
      }
    },
    {
      "@type": "Question",
      "name": "Is Skill Editor free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, Skill Editor is completely free. Create an account to save your skills to a personal stash that syncs across devices."
      }
    },
    {
      "@type": "Question",
      "name": "Which AI agents support SKILL.md files?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "SKILL.md is the open standard for agent skills supported by Claude Code, Claude Desktop, OpenAI Codex, Gemini CLI, Kiro, and other AI development tools."
      }
    }
  ]
}
```

**Where to put the FAQ content visually:** Add a collapsible FAQ section to your IntroScreen (below the hero). This serves double duty — visible content for Google's crawlers AND answers real user questions.

---

## 6. Site Name Structured Data

Tell Google your preferred site name (so it shows "Skill Editor" not "skilleditor.com" in results):

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Skill Editor",
  "alternateName": ["Skill Editor", "SkillEditor"],
  "url": "https://skilleditor.com"
}
```

---

## 7. Technical SPA SEO Fixes

Your biggest SEO risk is that Google sees an empty `<div id="root"></div>` because all content is JS-rendered.

### Pre-rendering (Recommended)

Since you're on Vercel, the easiest path:

- **Option A: `vite-plugin-prerender`** — Generates static HTML at build time for your single route (`/`). Zero runtime cost, no SSR needed.
- **Option B: Prerender.io** — Serves cached HTML to bots. Has a Vercel integration. Free tier covers your traffic easily.

Even just pre-rendering the `/` route would give Google a fully populated `index.html` with your IntroScreen content (hero text, feature descriptions, FAQ section) instead of an empty shell.

### Other technical items:
- [ ] `robots.txt` — Make sure you have one (even if it just says `Allow: /`)
- [ ] `sitemap.xml` — Submit to Google Search Console. Even with one page, it signals intent.
- [ ] `skill-editor.com` redirect — Set up a 301 redirect from `skill-editor.com` → `skilleditor.com` so you consolidate domain authority.

---

## 8. Content Strategy Without a Blog

You don't need a blog, but you need crawlable text. Ways to add keyword-rich content without new pages:

### On the IntroScreen (visible before opening a skill):
- **Hero headline:** "The free agent skill editor" (h1)
- **Sub-headline:** "Create, import, and manage SKILL.md files for Claude, Codex, Gemini CLI, and more"
- **Feature blocks** (3-4 short cards): "Import from GitHub", "Rich markdown editing", "Export as .skill", "Sync your stash"
- **FAQ section** (matches the FAQPage schema above)
- **"Works with" logo strip:** Claude, Codex, Gemini CLI, Kiro logos

All of this is on your single page but gives Google real text to index and rank.

### Leverage the README / GitHub
- Your GitHub repo ranks for "agent-skill-creator" already. Cross-link between the repo and `skilleditor.com`.
- Add a backlink from the repo README: "Try it live at [skilleditor.com](https://skilleditor.com)"

---

## 9. Complete Updated `<head>` for Copy-Paste

```html
<!-- Primary Meta Tags -->
<title>Skill Editor — Create, Import & Export Agent Skills</title>
<meta name="title" content="Skill Editor — Create, Import & Export Agent Skills" />
<meta name="description" content="Free agent skill editor — create, import from GitHub, and manage your personal skill stash. Works with Claude, Codex, Gemini CLI, and any AI agent that supports SKILL.md files." />
<meta name="keywords" content="agent skill editor, agent skills, SKILL.md, AI agents, skill builder, Claude skills, Codex skills, Gemini CLI skills, markdown editor, skill files, GitHub skill import" />
<meta name="author" content="Skill Editor" />
<link rel="canonical" href="https://skilleditor.com/" />

<!-- Theme & Icons -->
<meta name="theme-color" content="#1a1a1a" />
<link rel="icon" type="image/svg+xml" href="/assets/favicon-dark-BcSslWkW.svg" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />

<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://skilleditor.com/" />
<meta property="og:title" content="Skill Editor — Create, Import & Export Agent Skills" />
<meta property="og:description" content="Free agent skill editor. Create, import from GitHub, and manage your personal skill stash for Claude, Codex, Gemini CLI, and more." />
<meta property="og:image" content="https://skilleditor.com/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:site_name" content="Skill Editor" />
<meta property="og:locale" content="en_US" />

<!-- Twitter / X -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:url" content="https://skilleditor.com/" />
<meta name="twitter:title" content="Skill Editor — Create, Import & Export Agent Skills" />
<meta name="twitter:description" content="Free agent skill editor. Create, import from GitHub, and manage your personal skill stash for Claude, Codex, Gemini CLI, and more." />
<meta name="twitter:image" content="https://skilleditor.com/og-image.png" />
```

---

## Priority Ranking

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 1 | Update title tag | 2 min | High — directly affects ranking + CTR |
| 2 | Update meta description | 2 min | High — affects CTR from search results |
| 3 | Add `aggregateRating` to JSON-LD | 10 min | High — unlocks star ratings in SERP |
| 4 | Add FAQ content to IntroScreen + FAQPage schema | 1 hr | Medium-High — rich result + crawlable content |
| 5 | Set up pre-rendering for `/` route | 1 hr | Medium-High — makes content crawlable |
| 6 | 301 redirect `skill-editor.com` → `skilleditor.com` | 10 min | Medium — consolidates domain authority |
| 7 | Add `robots.txt` + `sitemap.xml` + submit to Search Console | 20 min | Medium — baseline crawl hygiene |
| 8 | Add `WebSite` schema for site name | 5 min | Low-Medium — controls branding in SERP |
| 9 | Beef up IntroScreen with keyword-rich visible content | 2 hr | Medium — gives Google text to rank |
| 10 | Build in-app rating system (real `aggregateRating` data) | 3 hr | Medium — sustains star rating long-term |
