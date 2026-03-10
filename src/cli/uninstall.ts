import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { readSettings, writeSettings } from '../config';
import { removeInstalledFiles, cleanupLegacy } from '../installer';

const DEFAULT_SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');

/**
 * Uninstall claude-rts-alert: remove hooks from settings.json,
 * delete all installed files (hook, sounds, config, commands),
 * and clean up any legacy artifacts.
 */
export async function uninstall(
  settingsPath: string = DEFAULT_SETTINGS_PATH,
): Promise<void> {
  // 1. Clean hooks from settings.json (both claude-rts-alert and legacy claude-notify)
  const settings = readSettings(settingsPath);

  if (settings.hooks && typeof settings.hooks === 'object') {
    const hooks = settings.hooks as Record<string, Array<{ hooks?: Array<{ command?: string }> }>>;
    const cleanedHooks: Record<string, Array<{ hooks?: Array<{ command?: string }> }>> = {};

    for (const [event, entries] of Object.entries(hooks)) {
      if (!Array.isArray(entries)) continue;
      const filtered = entries.filter(
        (entry) =>
          !entry.hooks?.some(
            (h) => h.command?.includes('claude-rts-alert') || h.command?.includes('claude-notify'),
          ),
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

  // 2. Remove all installed files (hook, sounds, runtime, commands)
  removeInstalledFiles();

  // 3. Clean up legacy artifacts (~/.claude-notify/)
  cleanupLegacy(settingsPath);

  // 4. Confirmation
  process.stdout.write('claude-rts-alert uninstalled. Hooks removed and all files deleted.\n');
}
