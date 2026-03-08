# claude-notify

## What This Is

An npx-installable CLI tool that configures Claude Code's hook system to play retro game sound effects on lifecycle events. Users run an interactive setup, pick a soundboard theme (Warcraft 3, Age of Empires 2, StarCraft, Diablo, Metal Gear Solid, or Classic Windows), and the tool writes the necessary hooks into `~/.claude/settings.json` with bundled sound files. Cross-platform from day one.

## Core Value

One command gives developers audible feedback from Claude Code using sounds they already have emotional connections to — no manual config, no dependency hunting, no platform headaches.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Interactive CLI with theme picker and sound preview
- [ ] Cross-platform audio playback (Windows, macOS, Linux) via Node
- [ ] Bundled sound files shipped inside the npm package (~2-5MB)
- [ ] Four hook events: Stop, Notification, SessionStart, PostToolUse (error)
- [ ] One theme active at a time (no per-event mixing)
- [ ] Writes/merges hooks into existing `~/.claude/settings.json` without clobbering
- [ ] Copies sound files to `~/.claude/sounds/`
- [ ] Uninstall command to cleanly remove hooks and sound files
- [ ] Soundboard themes: WC3 Orc, WC3 Human, WC3 Undead, AoE2, StarCraft, Diablo, Metal Gear Solid, Classic Windows
- [ ] GitHub-hosted open-source repo (installable via npx)

### Out of Scope

- Per-event theme mixing — simplicity over flexibility for v1
- GUI configuration tool — CLI-only
- Per-project sound profiles — global config only
- Toast/desktop notifications — audio only
- Custom user-uploaded sounds — ship curated themes only
- npm registry publishing — GitHub-only distribution for now

## Context

Claude Code runs silently. Developers context-switch away and miss when Claude finishes or stalls on a permission prompt. This tool solves that with personality-rich audio cues mapped to hook events.

The hooks system in Claude Code supports `Stop`, `Notification`, `SessionStart`, and `PostToolUse` events via `~/.claude/settings.json`. Each hook runs a shell command. The tool needs to generate platform-appropriate playback commands (PowerShell on Windows, afplay on macOS, aplay/paplay on Linux) or use a Node-based player.

A competing project called peon-ping already exists in this space. claude-notify differentiates by offering multiple game franchises as themes and a cleaner interactive setup experience.

Sound files will be sourced from game installs, community sound archives, or original recordings. Files are bundled as .wav or .mp3 inside the package.

## Constraints

- **Platform**: Must work on Windows, macOS, and Linux without native compilation
- **Dependencies**: Minimal — prefer built-in OS audio tools or lightweight Node audio packages
- **Size**: Package should stay under 10MB with all themes bundled
- **Settings safety**: Must preserve existing hooks in settings.json, never clobber user config
- **Distribution**: GitHub repo only, no npm registry account required

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Bundle sounds in package | Simpler install, works offline, no CDN dependency | — Pending |
| Cross-platform from v1 | Node-based playback avoids platform-specific shell commands | — Pending |
| One theme at a time | Reduces decision fatigue, simpler config model | — Pending |
| Interactive CLI by default | Better onboarding UX, lets users preview sounds before committing | — Pending |
| GitHub-only distribution | No npm account overhead, still npx-compatible via github: prefix | — Pending |

---
*Last updated: 2026-03-08 after initialization*
