# Requirements: claude-notify

**Defined:** 2026-03-08
**Core Value:** One command gives developers audible feedback from Claude Code using sounds they already have emotional connections to.

## v1 Requirements

### CLI

- [ ] **CLI-01**: User can run interactive setup that presents theme choices
- [ ] **CLI-02**: User can preview each theme's sounds before selecting
- [ ] **CLI-03**: User can list available themes without installing
- [ ] **CLI-04**: User can uninstall to remove all hooks and sound files

### Playback

- [ ] **PLAY-01**: Audio plays cross-platform via play-sound package (Windows, macOS, Linux)
- [ ] **PLAY-02**: Sound files are bundled as .wav/.mp3 inside the package

### Hooks

- [ ] **HOOK-01**: Stop event plays a "task complete" sound
- [ ] **HOOK-02**: Notification event plays a "needs input" sound
- [ ] **HOOK-03**: SessionStart event plays a greeting sound
- [ ] **HOOK-04**: PostToolUse event plays an error sound on tool failure
- [ ] **HOOK-05**: Hook config merges into existing settings.json without clobbering

### Themes

- [ ] **THEME-01**: WC3 Orc Peon theme with 4 event sounds
- [ ] **THEME-02**: WC3 Human Peasant theme with 4 event sounds
- [ ] **THEME-03**: Age of Empires 2 theme with 4 event sounds
- [ ] **THEME-04**: Classic Windows theme with 4 event sounds

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
| CLI-01 | — | Pending |
| CLI-02 | — | Pending |
| CLI-03 | — | Pending |
| CLI-04 | — | Pending |
| PLAY-01 | — | Pending |
| PLAY-02 | — | Pending |
| HOOK-01 | — | Pending |
| HOOK-02 | — | Pending |
| HOOK-03 | — | Pending |
| HOOK-04 | — | Pending |
| HOOK-05 | — | Pending |
| THEME-01 | — | Pending |
| THEME-02 | — | Pending |
| THEME-03 | — | Pending |
| THEME-04 | — | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 0
- Unmapped: 15

---
*Requirements defined: 2026-03-08*
*Last updated: 2026-03-08 after initial definition*
