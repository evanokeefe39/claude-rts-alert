---
phase: 02-hook-events-and-themes
plan: 01
subsystem: hooks
tags: [vitest, tdd, themes, hook-events, sound-playback]

requires:
  - phase: 01-audio-and-config-foundation
    provides: "playSound and resolveAssetPath from src/audio/player.ts"
provides:
  - "Theme registry mapping 4 themes x 4 events to sound file paths"
  - "Hook event handler routing Claude Code events to themed sound playback"
  - "Active theme config stored at ~/.claude-notify/config.json"
affects: [02-02-sound-assets, 03-install-cli]

tech-stack:
  added: []
  patterns: [theme-registry-lookup, atomic-config-write, event-map-dispatch, error-only-PostToolUse]

key-files:
  created:
    - src/themes/registry.ts
    - src/themes/registry.test.ts
    - src/themes/index.ts
    - src/hooks/handler.ts
    - src/hooks/handler.test.ts
    - src/hooks/index.ts
  modified: []

key-decisions:
  - "Active theme config stored in ~/.claude-notify/config.json separate from Claude settings.json"
  - "PostToolUse only plays error sound when toolError is truthy (non-empty string)"
  - "Optional configPath parameter on getActiveTheme/setActiveTheme for testability"

patterns-established:
  - "Event map dispatch: Claude Code event names mapped to internal HookEvent via EVENT_MAP constant"
  - "Config DI: optional configPath parameter for filesystem-dependent functions enables temp dir testing"
  - "Error-only hook filtering: PostToolUse checks context.toolError before playing sound"

requirements-completed: [HOOK-01, HOOK-02, HOOK-03, HOOK-04]

duration: 3min
completed: 2026-03-09
---

# Phase 2 Plan 1: Hook Events and Themes Summary

**Theme registry mapping 4 game themes to 4 hook events with configurable active theme and error-filtered PostToolUse handler**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-09T07:44:25Z
- **Completed:** 2026-03-09T07:47:21Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Theme registry with wc3-orc, wc3-human, aoe2, classic-windows themes each mapping stop, notification, session-start, and post-tool-use events to sound file paths
- Hook event handler that routes Claude Code events through active theme to playSound, with PostToolUse filtered to errors only
- Active theme persistence via ~/.claude-notify/config.json with wc3-orc default and atomic writes
- 24 new tests (14 registry + 10 handler) all passing, 41 total project tests green

## Task Commits

Each task was committed atomically:

1. **Task 1: Theme registry (RED)** - `9f21820` (test)
2. **Task 1: Theme registry (GREEN)** - `d582caa` (feat)
3. **Task 2: Hook handler (RED)** - `091cbac` (test)
4. **Task 2: Hook handler (GREEN)** - `d7a10ff` (feat)

_TDD tasks have separate test and implementation commits._

## Files Created/Modified
- `src/themes/registry.ts` - Theme definitions, sound file lookup, active theme read/write with atomic config
- `src/themes/registry.test.ts` - 14 tests covering THEMES structure, lookups, config persistence, validation
- `src/themes/index.ts` - Barrel export for themes module
- `src/hooks/handler.ts` - Hook event handler with EVENT_MAP dispatch, PostToolUse error filter, CLI entry point
- `src/hooks/handler.test.ts` - 10 tests covering all event types, error filtering, graceful error handling
- `src/hooks/index.ts` - Barrel export for hooks module

## Decisions Made
- Active theme config stored in ~/.claude-notify/config.json (separate from Claude's settings.json to avoid coupling)
- PostToolUse only plays error sound when toolError is truthy -- prevents sound spam on every successful tool use
- Optional configPath parameter on getActiveTheme/setActiveTheme for testability via temp directories

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Theme registry and hook handler ready for Plan 02 (sound asset files)
- Sound file paths reference assets/sounds/{theme}/*.wav which will be created in Plan 02
- CLI entry point in handler.ts reads env vars matching Claude Code hook contract

---
*Phase: 02-hook-events-and-themes*
*Completed: 2026-03-09*
