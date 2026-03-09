# Requirements: claude-notify

**Defined:** 2026-03-08
**Core Value:** One command gives developers audible feedback from Claude Code using sounds they already have emotional connections to.

## v1 Requirements

### CLI

- [ ] **CLI-01**: User can run interactive setup that presents theme choices
- [ ] **CLI-02**: User can preview each theme's sounds before selecting
- [x] **CLI-03**: User can list available themes without installing
- [x] **CLI-04**: User can uninstall to remove all hooks and sound files

### Playback

- [x] **PLAY-01**: Audio plays cross-platform via play-sound package (Windows, macOS, Linux)
- [x] **PLAY-02**: Sound files are bundled as .wav/.mp3 inside the package

### Hooks

- [x] **HOOK-01**: Stop event plays a "task complete" sound
- [x] **HOOK-02**: Notification event plays a "needs input" sound
- [x] **HOOK-03**: SessionStart event plays a greeting sound
- [x] **HOOK-04**: PostToolUse event plays an error sound on tool failure
- [x] **HOOK-05**: Hook config merges into existing settings.json without clobbering

### Themes

- [x] **THEME-01**: WC3 Orc Peon theme with 4 event sounds
- [x] **THEME-02**: WC3 Human Peasant theme with 4 event sounds
- [x] **THEME-03**: Age of Empires 2 theme with 4 event sounds
- [x] **THEME-04**: Classic Windows theme with 4 event sounds

## v2 Requirements

### Themes

- **THEME-05**: WC3 Undead Acolyte theme
- **THEME-06**: StarCraft theme (SCV, Marine, Zealot lines)
- **THEME-07**: Diablo theme (Deckard Cain, loot drops, portals)
- **THEME-08**: Metal Gear Solid theme (alert, codec, Snake lines)

### Features

- **FEAT-01**: Per-event theme mixing (different theme per hook event)
- **FEAT-02**: npm registry publishing
- **FEAT-03**: Custom user-uploaded sounds support

## Out of Scope

| Feature | Reason |
|---------|--------|
| GUI configuration tool | CLI-only keeps it simple and portable |
| Per-project sound profiles | Global config sufficient for v1 |
| Toast/desktop notifications | Audio-only focus |
| Volume control | OS-level volume is sufficient |
| Sound randomization per event | Added complexity, defer to v2+ |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLI-01 | Phase 3 | Pending |
| CLI-02 | Phase 3 | Pending |
| CLI-03 | Phase 3 | Complete |
| CLI-04 | Phase 3 | Complete |
| PLAY-01 | Phase 1 | Complete |
| PLAY-02 | Phase 1 | Complete |
| HOOK-01 | Phase 2 | Complete |
| HOOK-02 | Phase 2 | Complete |
| HOOK-03 | Phase 2 | Complete |
| HOOK-04 | Phase 2 | Complete |
| HOOK-05 | Phase 1 | Complete |
| THEME-01 | Phase 2 | Complete |
| THEME-02 | Phase 2 | Complete |
| THEME-03 | Phase 2 | Complete |
| THEME-04 | Phase 2 | Complete |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-03-08*
*Last updated: 2026-03-08 after roadmap creation*
