# Roadmap: claude-notify

## Overview

claude-notify goes from zero to shippable in three phases. First, we establish cross-platform audio playback and safe settings.json merging -- the two technical foundations everything depends on. Second, we wire up the four hook events and build out the four v1 theme sound packs. Third, we build the interactive CLI that ties it all together: theme picker, sound preview, listing, and uninstall. At the end of Phase 3, the tool is npx-installable and fully functional.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Audio and Config Foundation** - Cross-platform audio playback, bundled sounds, and safe settings.json merging (completed 2026-03-09)
- [ ] **Phase 2: Hook Events and Themes** - Four hook event handlers and four complete theme sound packs
- [ ] **Phase 3: Interactive CLI** - Setup wizard, sound preview, theme listing, and uninstall command

## Phase Details

### Phase 1: Audio and Config Foundation
**Goal**: A Node module can play a bundled sound file on any platform and safely merge hook entries into ~/.claude/settings.json
**Depends on**: Nothing (first phase)
**Requirements**: PLAY-01, PLAY-02, HOOK-05
**Success Criteria** (what must be TRUE):
  1. A test script can play a .wav or .mp3 file on Windows, macOS, and Linux without native compilation
  2. Sound files are loadable from the package's bundled assets directory
  3. Writing a hook entry to ~/.claude/settings.json preserves all existing user config and hooks
  4. Writing hooks to a fresh (nonexistent) settings.json creates a valid file
**Plans:** 2/2 plans complete

Plans:
- [ ] 01-01-PLAN.md -- Project scaffold, audio playback module with play-sound, bundled asset resolution
- [ ] 01-02-PLAN.md -- Safe settings.json merge module (read, write, merge hooks without clobbering)

### Phase 2: Hook Events and Themes
**Goal**: All four Claude Code hook events trigger the correct themed sound, and four complete theme packs exist with curated audio
**Depends on**: Phase 1
**Requirements**: HOOK-01, HOOK-02, HOOK-03, HOOK-04, THEME-01, THEME-02, THEME-03, THEME-04
**Success Criteria** (what must be TRUE):
  1. Stop event triggers a "task complete" sound from the active theme
  2. Notification event triggers a "needs input" sound from the active theme
  3. SessionStart event triggers a greeting sound from the active theme
  4. PostToolUse event triggers an error sound when a tool fails
  5. Each of the four v1 themes (WC3 Orc, WC3 Human, AoE2, Classic Windows) contains all four event sounds and is selectable as the active theme
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

### Phase 3: Interactive CLI
**Goal**: Users can install, preview, select, list, and uninstall themes through a single npx command with an interactive setup experience
**Depends on**: Phase 2
**Requirements**: CLI-01, CLI-02, CLI-03, CLI-04
**Success Criteria** (what must be TRUE):
  1. Running the CLI presents an interactive theme picker where the user selects a theme and hooks are installed
  2. User can hear each theme's sounds during setup before committing to a selection
  3. User can run a list command to see available themes and which one is active
  4. User can run an uninstall command that removes all hooks from settings.json and deletes copied sound files from ~/.claude/sounds/
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Audio and Config Foundation | 2/2 | Complete   | 2026-03-09 |
| 2. Hook Events and Themes | 0/? | Not started | - |
| 3. Interactive CLI | 0/? | Not started | - |
