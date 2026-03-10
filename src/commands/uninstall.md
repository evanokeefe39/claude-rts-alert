---
name: rts-alert:uninstall
description: Remove RTS sound notifications from Claude Code
---
<objective>
Uninstall claude-rts-alert hooks, sounds, and configuration.
</objective>

<process>
Run the following command:

```
npx claude-rts-alert uninstall
```

This will:
1. Remove hooks from Claude Code settings.json
2. Delete sound files from ~/.claude/sounds/claude-rts-alert/
3. Delete configuration from ~/.claude/claude-rts-alert/
4. Delete slash commands from ~/.claude/commands/rts-alert/
</process>
