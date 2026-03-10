import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export type ThemeName = 'wc3-orc' | 'wc3-human' | 'aoe2';
export type HookEvent = 'stop' | 'notification' | 'session-start' | 'post-tool-use';

/**
 * Map of theme names to their sound file mappings per hook event.
 * Sound paths are relative to assets/sounds/.
 */
export const THEMES: Record<ThemeName, Record<HookEvent, string>> = {
  'wc3-orc': {
    'stop': 'wc3-orc/task-complete.wav',
    'notification': 'wc3-orc/needs-input.wav',
    'session-start': 'wc3-orc/greeting.wav',
    'post-tool-use': 'wc3-orc/error.wav',
  },
  'wc3-human': {
    'stop': 'wc3-human/task-complete.wav',
    'notification': 'wc3-human/needs-input.wav',
    'session-start': 'wc3-human/greeting.wav',
    'post-tool-use': 'wc3-human/error.wav',
  },
  'aoe2': {
    'stop': 'aoe2/task-complete.wav',
    'notification': 'aoe2/needs-input.wav',
    'session-start': 'aoe2/greeting.wav',
    'post-tool-use': 'aoe2/error.wav',
  },
};

/** Array of all valid theme names. */
export const THEME_NAMES: ThemeName[] = Object.keys(THEMES) as ThemeName[];

const DEFAULT_THEME: ThemeName = 'wc3-orc';
const DEFAULT_CONFIG_PATH = path.join(os.homedir(), '.claude', 'claude-rts-alert', 'config.json');

/**
 * Look up the sound file path for a given theme and event.
 * Throws if theme or event is invalid.
 */
export function getThemeSoundFile(theme: ThemeName, event: HookEvent): string {
  if (!(theme in THEMES)) {
    throw new Error(`Unknown theme: "${theme}". Valid themes: ${THEME_NAMES.join(', ')}`);
  }

  const themeEntry = THEMES[theme];
  if (!(event in themeEntry)) {
    throw new Error(`Unknown event: "${event}". Valid events: stop, notification, session-start, post-tool-use`);
  }

  return themeEntry[event];
}

/**
 * Get the currently active theme name.
 * Reads from ~/.claude-notify/config.json.
 * Returns "wc3-orc" if no config exists or the stored theme is invalid.
 */
export function getActiveTheme(configPath: string = DEFAULT_CONFIG_PATH): ThemeName {
  try {
    if (!fs.existsSync(configPath)) {
      return DEFAULT_THEME;
    }

    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content) as Record<string, unknown>;
    const stored = config.activeTheme as string;

    if (stored && stored in THEMES) {
      return stored as ThemeName;
    }

    return DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/**
 * Set the active theme. Writes to config file using atomic write pattern.
 * Creates the config directory if needed.
 * Throws if theme name is invalid.
 */
export function setActiveTheme(theme: ThemeName, configPath: string = DEFAULT_CONFIG_PATH): void {
  if (!(theme in THEMES)) {
    throw new Error(`Unknown theme: "${theme}". Valid themes: ${THEME_NAMES.join(', ')}`);
  }

  const dir = path.dirname(configPath);
  fs.mkdirSync(dir, { recursive: true });

  // Read existing config to preserve other keys
  let config: Record<string, unknown> = {};
  try {
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
    }
  } catch {
    // Start fresh if config is corrupt
  }

  config.activeTheme = theme;

  // Atomic write: write to tmp then rename
  const content = JSON.stringify(config, null, 2) + '\n';
  const tmpPath = configPath + '.tmp';
  fs.writeFileSync(tmpPath, content, 'utf-8');
  fs.renameSync(tmpPath, configPath);
}
