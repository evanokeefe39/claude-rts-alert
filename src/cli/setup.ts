import * as path from 'path';
import * as os from 'os';
import { THEME_NAMES, setActiveTheme, getThemeSoundFile, type ThemeName, type HookEvent } from '../themes';
import { playSound } from '../audio';
import { readSettings, writeSettings, mergeHooks, type HookEntry } from '../config';

const THEME_DISPLAY_NAMES: Record<ThemeName, string> = {
  'wc3-orc': 'WC3 Orc Peon',
  'wc3-human': 'WC3 Human Peasant',
  'aoe2': 'Age of Empires 2',
  'classic-windows': 'Classic Windows',
};

const HOOK_EVENTS: HookEvent[] = ['stop', 'notification', 'session-start', 'post-tool-use'];

/** Map internal event names to Claude Code settings.json event keys */
const CLAUDE_EVENT_KEYS: Record<HookEvent, string> = {
  'stop': 'Stop',
  'notification': 'Notification',
  'session-start': 'SessionStart',
  'post-tool-use': 'PostToolUse',
};

const DEFAULT_SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');
const DEFAULT_CONFIG_PATH = path.join(os.homedir(), '.claude-notify', 'config.json');

export interface SetupOptions {
  settingsPath?: string;
  configPath?: string;
}

/**
 * Interactive setup wizard. Presents a theme picker, plays preview sounds,
 * and installs hooks into Claude Code settings.json.
 */
export async function setup(opts: SetupOptions = {}): Promise<void> {
  const { default: select } = await import('@inquirer/select');
  const settingsPath = opts.settingsPath ?? DEFAULT_SETTINGS_PATH;
  const configPath = opts.configPath ?? DEFAULT_CONFIG_PATH;

  process.stdout.write('claude-notify setup\n\n');
  process.stdout.write('Choose a sound theme for Claude Code notifications:\n\n');

  const choices = THEME_NAMES.map((t) => ({
    name: THEME_DISPLAY_NAMES[t],
    value: t,
  }));

  let confirmed = false;
  while (!confirmed) {
    const theme = await select({ message: 'Select a theme:', choices });

    process.stdout.write(`\nPreviewing sounds for ${THEME_DISPLAY_NAMES[theme]}...\n`);

    for (const event of HOOK_EVENTS) {
      process.stdout.write(`  ${event}...`);
      try {
        await playSound(getThemeSoundFile(theme, event));
      } catch {
        // Sound preview is best-effort; don't block setup
      }
      process.stdout.write(' done\n');
    }

    process.stdout.write('\n');

    const action = await select({
      message: 'Install this theme?',
      choices: [
        { name: 'Yes, install', value: 'yes' },
        { name: 'Pick a different theme', value: 'retry' },
        { name: 'Cancel', value: 'cancel' },
      ],
    });

    if (action === 'cancel') {
      process.stdout.write('Setup cancelled.\n');
      return;
    }

    if (action === 'yes') {
      // Set active theme in config
      setActiveTheme(theme, configPath);

      // Build hook entries
      const handlerPath = path.resolve(__dirname, '../hooks/handler.js');
      const newHooks: Record<string, HookEntry[]> = {};

      for (const event of HOOK_EVENTS) {
        const claudeKey = CLAUDE_EVENT_KEYS[event];
        const entry: HookEntry = {
          type: 'command',
          command: `node "${handlerPath}" # claude-notify`,
        };
        if (claudeKey === 'PostToolUse') {
          entry.matcher = '.*';
        }
        newHooks[claudeKey] = [entry];
      }

      // Read, merge, write settings
      const existing = readSettings(settingsPath);
      const merged = mergeHooks(existing, newHooks);
      writeSettings(settingsPath, merged);

      const displayName = THEME_DISPLAY_NAMES[theme];
      process.stdout.write(`\nTheme '${displayName}' installed! Claude Code will now play sounds on events.\n`);
      process.stdout.write('Run `claude-notify list` to see themes or `claude-notify uninstall` to remove.\n');

      confirmed = true;
    }
    // action === 'retry' loops back
  }
}
