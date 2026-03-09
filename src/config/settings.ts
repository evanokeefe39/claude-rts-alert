import * as fs from 'fs';
import * as path from 'path';

export type HookEntry = {
  type: 'command';
  command: string;
  matcher?: string;
};

/**
 * Read and parse a settings.json file.
 * Returns {} if the file does not exist.
 * Throws a descriptive error if the file contains malformed JSON.
 */
export function readSettings(settingsPath: string): Record<string, unknown> {
  if (!fs.existsSync(settingsPath)) {
    return {};
  }

  const content = fs.readFileSync(settingsPath, 'utf-8');

  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to parse ${settingsPath}: ${message}`);
  }
}

/**
 * Write settings data to a JSON file atomically.
 * Creates parent directories if needed.
 * Uses 2-space indent with trailing newline.
 * Writes to a .tmp file first, then renames to prevent partial writes.
 */
export function writeSettings(settingsPath: string, data: Record<string, unknown>): void {
  const dir = path.dirname(settingsPath);
  fs.mkdirSync(dir, { recursive: true });

  const content = JSON.stringify(data, null, 2) + '\n';
  const tmpPath = settingsPath + '.tmp';

  fs.writeFileSync(tmpPath, content, 'utf-8');
  fs.renameSync(tmpPath, settingsPath);
}

/**
 * Merge new hook entries into existing settings.
 * - Preserves all non-hook keys
 * - Preserves existing hooks from other sources (commands not containing "claude-notify")
 * - Replaces existing claude-notify hooks with the new ones
 * - Preserves hooks for events not mentioned in newHooks
 */
export function mergeHooks(
  existing: Record<string, unknown>,
  newHooks: Record<string, HookEntry[]>,
): Record<string, unknown> {
  const result = { ...existing };

  const existingHooks = (existing.hooks ?? {}) as Record<string, HookEntry[]>;
  const mergedHooks: Record<string, HookEntry[]> = { ...existingHooks };

  for (const [event, entries] of Object.entries(newHooks)) {
    const currentEntries = existingHooks[event] ?? [];

    // Keep entries that are NOT from claude-notify
    const preserved = currentEntries.filter(
      (entry) => !entry.command.includes('claude-notify'),
    );

    // Append new entries after preserved ones
    mergedHooks[event] = [...preserved, ...entries];
  }

  result.hooks = mergedHooks;
  return result;
}
