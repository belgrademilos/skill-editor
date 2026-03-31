# Skill Editor — FAQ (Draft)

> **Audience:** Skill-aware users who already understand what skills are and want to inspect, customize, or manage .skill files before use.
> **Tone:** Conversational, like the current FAQs — approachable but not dumbed down.

---

## The Editor

### What is Skill Editor?

Skill Editor is a browser-based tool for opening, inspecting, editing, and re-exporting .skill files. Think of it as a dedicated editor for skill bundles — you can see every file inside a skill, edit the instructions and scripts, tweak the frontmatter, and export a clean .skill file when you're done.

### Do I need to install anything?

No. Skill Editor runs entirely in your browser. Nothing is uploaded to a server — your files stay on your machine.

### What file types can I open?

You can import `.skill` files or `.zip` archives. Under the hood, a .skill file is just a zip with a different extension. Skill Editor unpacks it and shows you the full file tree.

### Can I create a skill from scratch here?

The editor is primarily designed for opening and modifying existing skill files. If you want to author a new skill from scratch, you'd currently need to create the initial SKILL.md and bundle it yourself, then import that into the editor for further work.

### Does the editor auto-save my work?

Yes. Your editing session is automatically saved to your browser's local storage. If you accidentally close the tab or refresh, your work will be restored. Always export your .skill file when you're done to keep a permanent copy.

---

## Import & Export

### How do I open a skill file?

Drag and drop a `.skill` or `.zip` file onto the intro screen, or click the import button to browse for one. The editor will unpack it and display the file tree.

### How do I save my changes?

Click the export button to download a new `.skill` file with all your edits baked in. The original file you imported is never modified — you always get a fresh export.

### I edited a skill but my export looks the same as the original — what happened?

Make sure you've clicked into the editor and your changes are reflected in the content area. The editor auto-saves to your session, but the export pulls from the current state. If you're editing SKILL.md, note that frontmatter fields (name, description) are edited separately in the header area — they get recombined into the file on export.

### Can I export individual files instead of the whole bundle?

Yes, press Export current as .md

### Can I add new files to a skill bundle?

Yes, you can add files to the bundle through the file tree.

---

## SKILL.md & Frontmatter

### What's the deal with frontmatter?

Every SKILL.md starts with a YAML frontmatter block (the stuff between `---` markers at the top). It contains metadata like `name` and `description`. In Skill Editor, these fields are shown as editable inputs above the main editor — they're not part of the markdown body. On export, they get serialized back into the file automatically.

### What are the rules for the skill name?

The `name` field must be lowercase, use hyphens instead of spaces, can include digits, and maxes out at 64 characters. Think of it like a URL slug: `my-cool-skill` works, `My Cool Skill!` doesn't.

### What should the description include?

The description should explain both *what the skill does* and *when it should be triggered*. This is important because AI agents use the description to decide whether to invoke the skill. A vague description means the skill might never get used — or get used at the wrong time.

### Can a skill bundle contain multiple SKILL.md files?

Yes, some advanced skill bundles include multiple SKILL.md files for related sub-skills. Skill Editor supports this and will track frontmatter separately for each one.
