import * as path from 'path';
import * as os from 'os';
import { THEME_NAMES, setActiveTheme, getThemeSoundFile, type ThemeName, type HookEvent } from '../themes';
import { playSound } from '../audio';
import { readSettings, writeSettings, mergeHooks, type HookEntry, type HookCommand } from '../config';
import { installAll, detectLegacyInstall, cleanupLegacy } from '../installer';

const THEME_DISPLAY_NAMES: Record<ThemeName, string> = {
  'wc3-orc': 'WC3 Orc Peon',
  'wc3-human': 'WC3 Human Peasant',
  'aoe2': 'Age of Empires 2',
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
const DEFAULT_CONFIG_PATH = path.join(os.homedir(), '.claude', 'claude-rts-alert', 'config.json');
const HOOK_SCRIPT_PATH = path.join(os.homedir(), '.claude', 'hooks', 'claude-rts-alert.js').replace(/\\/g, '/');

export interface SetupOptions {
  settingsPath?: string;
  configPath?: string;
  theme?: string;
}

/**
 * Interactive setup wizard. Presents a theme picker, plays preview sounds,
 * copies all runtime files, and installs hooks into Claude Code settings.json.
 */
export async function setup(opts: SetupOptions = {}): Promise<void> {
  const settingsPath = opts.settingsPath ?? DEFAULT_SETTINGS_PATH;
  const configPath = opts.configPath ?? DEFAULT_CONFIG_PATH;

  // Detect and clean up legacy install
  const legacy = detectLegacyInstall(settingsPath);
  if (legacy.hasLegacyConfig || legacy.hasLegacyHooks) {
    process.stdout.write('Migrating from previous install...\n');
    cleanupLegacy(settingsPath);
  }

  // Non-interactive mode: --theme flag provided
  if (opts.theme) {
    const themeName = opts.theme as ThemeName;
    if (!THEME_NAMES.includes(themeName)) {
      process.stderr.write(`Unknown theme: ${opts.theme}\nAvailable themes: ${THEME_NAMES.join(', ')}\n`);
      process.exitCode = 1;
      return;
    }
    installTheme(themeName, configPath, settingsPath);
    return;
  }

  const { default: select } = await import('@inquirer/select');

  process.stdout.write('claude-rts-alert setup\n\n');
  process.stdout.write('Choose a sound theme for Claude Code notifications:\n\n');

  const choices = THEME_NAMES.map((t) => ({
    name: THEME_DISPLAY_NAMES[t],
    value: t,
  }));

  let confirmed = false;
  while (!confirmed) {
    const theme = await select({ message: 'Select a theme:', choices });

    const action = await select({
      message: `${THEME_DISPLAY_NAMES[theme]} selected:`,
      choices: [
        { name: 'Preview sounds', value: 'preview' },
        { name: 'Install', value: 'yes' },
        { name: 'Pick a different theme', value: 'retry' },
        { name: 'Cancel', value: 'cancel' },
      ],
    });

    if (action === 'preview') {
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
      continue;
    }

    if (action === 'cancel') {
      process.stdout.write('Setup cancelled.\n');
      return;
    }

    if (action === 'yes') {
      installTheme(theme, configPath, settingsPath);
      confirmed = true;
    }
    // action === 'retry' loops back
  }
}

function installTheme(theme: ThemeName, configPath: string, settingsPath: string): void {
  // 1. Copy all runtime files (hook script, sounds, config, commands, package.json)
  installAll();

  // 2. Set active theme in config
  setActiveTheme(theme, configPath);

  // 3. Build hook entries — pass event name as CLI arg
  const newHooks: Record<string, HookEntry[]> = {};

  for (const event of HOOK_EVENTS) {
    const claudeKey = CLAUDE_EVENT_KEYS[event];
    const hookCommand = `node "${HOOK_SCRIPT_PATH}" ${claudeKey} # claude-rts-alert`;
    const cmd: HookCommand = { type: 'command', command: hookCommand };
    const entry: HookEntry = { matcher: '', hooks: [cmd] };
    newHooks[claudeKey] = [entry];
  }

  // 4. Read, merge, write settings
  const existing = readSettings(settingsPath);
  const merged = mergeHooks(existing, newHooks);
  writeSettings(settingsPath, merged);

  const displayName = THEME_DISPLAY_NAMES[theme];
  process.stdout.write(`\nTheme '${displayName}' installed! Claude Code will now play sounds on events.\n`);
  process.stdout.write('Run `claude-rts-alert list` to see themes or `claude-rts-alert uninstall` to remove.\n');
}
