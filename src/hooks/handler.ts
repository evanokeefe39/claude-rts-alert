import { playSound } from '../audio';
import { getActiveTheme, getThemeSoundFile } from '../themes';
import type { HookEvent } from '../themes';

/**
 * Maps Claude Code hook event names to internal HookEvent identifiers.
 */
const EVENT_MAP: Record<string, HookEvent> = {
  'Stop': 'stop',
  'Notification': 'notification',
  'SessionStart': 'session-start',
  'PostToolUse': 'post-tool-use',
};

/**
 * Handle a Claude Code hook event by playing the appropriate themed sound.
 *
 * For PostToolUse events, sound only plays when toolError is present (non-empty),
 * since PostToolUse fires on every tool use and we only want error feedback.
 *
 * Unknown events are silently ignored (logged to stderr) to avoid crashing
 * Claude Code's hook system.
 */
export async function handleHookEvent(
  eventName: string,
  context?: { toolName?: string; toolError?: string },
): Promise<void> {
  const event = EVENT_MAP[eventName];

  if (!event) {
    process.stderr.write(`claude-notify: unknown hook event "${eventName}"\n`);
    return;
  }

  // PostToolUse: only play sound on errors
  if (event === 'post-tool-use') {
    if (!context?.toolError) {
      return;
    }
  }

  const theme = getActiveTheme();
  const soundFile = getThemeSoundFile(theme, event);

  try {
    await playSound(soundFile);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`claude-notify: failed to play sound: ${message}\n`);
  }
}

// CLI entry point: runs when file is executed directly
if (require.main === module) {
  const eventName = process.env.CLAUDE_HOOK_EVENT_NAME ?? '';
  const context = {
    toolName: process.env.CLAUDE_HOOK_TOOL_NAME,
    toolError: process.env.CLAUDE_HOOK_TOOL_OUTPUT,
  };
  handleHookEvent(eventName, context).catch((err) => {
    process.stderr.write(`claude-notify: ${err}\n`);
  });
}
