import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { readSettings, writeSettings } from '../config';

const DEFAULT_SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');
const DEFAULT_SOUNDS_DIR = path.join(os.homedir(), '.claude', 'sounds');
const DEFAULT_CONFIG_DIR = path.join(os.homedir(), '.claude-notify');

/**
 * Uninstall claude-notify: remove hooks from settings.json,
 * delete sound files, and delete config directory.
 *
 * Accepts optional paths for testability (DI pattern).
 */
export async function uninstall(
  settingsPath: string = DEFAULT_SETTINGS_PATH,
  soundsDir: string = DEFAULT_SOUNDS_DIR,
  configDir: string = DEFAULT_CONFIG_DIR,
): Promise<void> {
  // 1. Clean hooks from settings.json
  const settings = readSettings(settingsPath);

  if (settings.hooks && typeof settings.hooks === 'object') {
    const hooks = settings.hooks as Record<string, Array<{ type: string; command: string }>>;
    const cleanedHooks: Record<string, Array<{ type: string; command: string }>> = {};

    for (const [event, entries] of Object.entries(hooks)) {
      if (!Array.isArray(entries)) continue;
      const filtered = entries.filter(
        (entry) => !entry.command?.includes('claude-notify'),
      );
      if (filtered.length > 0) {
        cleanedHooks[event] = filtered;
      }
    }

    if (Object.keys(cleanedHooks).length > 0) {
      settings.hooks = cleanedHooks;
    } else {
      delete settings.hooks;
    }

    writeSettings(settingsPath, settings);
  }

  // 2. Delete sounds directory
  fs.rmSync(soundsDir, { recursive: true, force: true });

  // 3. Delete config directory
  fs.rmSync(configDir, { recursive: true, force: true });

  // 4. Confirmation
  process.stdout.write('claude-notify uninstalled. Hooks removed and sound files deleted.\n');
}
