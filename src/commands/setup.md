---
name: rts-alert:setup
description: Set up RTS game sound notifications for Claude Code
---
<objective>
Run the claude-rts-alert interactive setup wizard to pick a sound theme and install hooks.
</objective>

<process>
Run the following command and follow its interactive prompts:

```
npx claude-rts-alert setup
```

This will:
1. Present a theme picker (WC3 Orc, WC3 Human, Age of Empires 2)
2. Preview each sound for the selected theme
3. Install hooks into Claude Code settings.json
4. Copy sound files and configuration
</process>
