import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const HOME = os.homedir();
const CLAUDE_DIR = path.join(HOME, '.claude');

// Install targets
const HOOK_DEST = path.join(CLAUDE_DIR, 'hooks', 'claude-rts-alert.js');
const SOUNDS_DEST = path.join(CLAUDE_DIR, 'sounds', 'claude-rts-alert');
const RUNTIME_DIR = path.join(CLAUDE_DIR, 'claude-rts-alert');
const COMMANDS_DIR = path.join(CLAUDE_DIR, 'commands', 'rts-alert');
const PACKAGE_JSON_PATH = path.join(CLAUDE_DIR, 'package.json');

// Source paths (relative to compiled dist/)
const HOOK_SOURCE = path.resolve(__dirname, '../hooks/claude-rts-alert-hook.cjs');
const ASSETS_SOURCE = path.resolve(__dirname, '../../assets/sounds');
const COMMANDS_SOURCE = path.resolve(__dirname, '../commands');
const VERSION_SOURCE = path.resolve(__dirname, '../../VERSION');

// Legacy paths
const LEGACY_CONFIG_DIR = path.join(HOME, '.claude-notify');

export interface InstallPaths {
  hookDest?: string;
  soundsDest?: string;
  runtimeDir?: string;
  commandsDir?: string;
  packageJsonPath?: string;
  hookSource?: string;
  assetsSource?: string;
  commandsSource?: string;
  versionSource?: string;
}

function defaults(opts?: InstallPaths) {
  return {
    hookDest: opts?.hookDest ?? HOOK_DEST,
    soundsDest: opts?.soundsDest ?? SOUNDS_DEST,
    runtimeDir: opts?.runtimeDir ?? RUNTIME_DIR,
    commandsDir: opts?.commandsDir ?? COMMANDS_DIR,
    packageJsonPath: opts?.packageJsonPath ?? PACKAGE_JSON_PATH,
    hookSource: opts?.hookSource ?? HOOK_SOURCE,
    assetsSource: opts?.assetsSource ?? ASSETS_SOURCE,
    commandsSource: opts?.commandsSource ?? COMMANDS_SOURCE,
    versionSource: opts?.versionSource ?? VERSION_SOURCE,
  };
}

/**
 * Copy the CJS hook script to ~/.claude/hooks/claude-rts-alert.js
 */
export function copyHookScript(opts?: InstallPaths): void {
  const { hookDest, hookSource } = defaults(opts);
  fs.mkdirSync(path.dirname(hookDest), { recursive: true });
  fs.copyFileSync(hookSource, hookDest);
}

/**
 * Copy all theme sound files to ~/.claude/sounds/claude-rts-alert/<theme>/*.wav
 */
export function copyAllThemeSounds(opts?: InstallPaths): void {
  const { soundsDest, assetsSource } = defaults(opts);

  const themes = fs.readdirSync(assetsSource).filter((entry) => {
    const full = path.join(assetsSource, entry);
    return fs.statSync(full).isDirectory();
  });

  for (const theme of themes) {
    const themeSource = path.join(assetsSource, theme);
    const themeDest = path.join(soundsDest, theme);
    fs.mkdirSync(themeDest, { recursive: true });

    const files = fs.readdirSync(themeSource).filter((f) => f.endsWith('.wav'));
    for (const file of files) {
      fs.copyFileSync(path.join(themeSource, file), path.join(themeDest, file));
    }
  }
}

/**
 * Copy runtime config template and VERSION to ~/.claude/claude-rts-alert/
 */
export function copyRuntime(opts?: InstallPaths): void {
  const { runtimeDir, versionSource } = defaults(opts);
  fs.mkdirSync(runtimeDir, { recursive: true });

  // Write default config if none exists
  const configPath = path.join(runtimeDir, 'config.json');
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({ activeTheme: 'wc3-orc' }, null, 2) + '\n');
  }

  // Copy VERSION file
  if (fs.existsSync(versionSource)) {
    fs.copyFileSync(versionSource, path.join(runtimeDir, 'VERSION'));
  }
}

/**
 * Copy slash command .md files to ~/.claude/commands/rts-alert/
 */
export function copySlashCommands(opts?: InstallPaths): void {
  const { commandsDir, commandsSource } = defaults(opts);

  if (!fs.existsSync(commandsSource)) return;

  fs.mkdirSync(commandsDir, { recursive: true });

  const files = fs.readdirSync(commandsSource).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    fs.copyFileSync(path.join(commandsSource, file), path.join(commandsDir, file));
  }
}

/**
 * Ensure ~/.claude/package.json exists with {"type":"commonjs"}.
 * Does not overwrite if it already exists.
 */
export function ensurePackageJson(opts?: InstallPaths): void {
  const { packageJsonPath } = defaults(opts);

  if (fs.existsSync(packageJsonPath)) return;

  fs.mkdirSync(path.dirname(packageJsonPath), { recursive: true });
  fs.writeFileSync(packageJsonPath, JSON.stringify({ type: 'commonjs' }, null, 2) + '\n');
}

/**
 * Remove all installed files. Does NOT touch ~/.claude/package.json (shared with GSD).
 */
export function removeInstalledFiles(opts?: InstallPaths): void {
  const { hookDest, soundsDest, runtimeDir, commandsDir } = defaults(opts);

  // Remove hook script
  if (fs.existsSync(hookDest)) {
    fs.unlinkSync(hookDest);
  }

  // Remove sounds directory
  fs.rmSync(soundsDest, { recursive: true, force: true });

  // Remove runtime directory (config + VERSION)
  fs.rmSync(runtimeDir, { recursive: true, force: true });

  // Remove slash commands directory
  fs.rmSync(commandsDir, { recursive: true, force: true });
}

/**
 * Detect legacy install (repo-path hooks, old ~/.claude-notify/ config).
 * Returns info about what was found.
 */
export function detectLegacyInstall(settingsPath?: string): {
  hasLegacyConfig: boolean;
  hasLegacyHooks: boolean;
} {
  const hasLegacyConfig = fs.existsSync(LEGACY_CONFIG_DIR);

  let hasLegacyHooks = false;
  const sp = settingsPath ?? path.join(CLAUDE_DIR, 'settings.json');
  if (fs.existsSync(sp)) {
    try {
      const settings = JSON.parse(fs.readFileSync(sp, 'utf-8'));
      if (settings.hooks && typeof settings.hooks === 'object') {
        for (const entries of Object.values(settings.hooks) as any[]) {
          if (!Array.isArray(entries)) continue;
          for (const entry of entries) {
            if (entry.hooks?.some((h: any) => h.command?.includes('claude-notify'))) {
              hasLegacyHooks = true;
            }
          }
        }
      }
    } catch {
      // Can't read settings — not legacy
    }
  }

  return { hasLegacyConfig, hasLegacyHooks };
}

/**
 * Clean up legacy install artifacts.
 */
export function cleanupLegacy(settingsPath?: string): void {
  // Remove legacy config dir
  fs.rmSync(LEGACY_CONFIG_DIR, { recursive: true, force: true });

  // Remove legacy hooks from settings.json (commands containing 'claude-notify' but NOT 'claude-rts-alert')
  const sp = settingsPath ?? path.join(CLAUDE_DIR, 'settings.json');
  if (!fs.existsSync(sp)) return;

  try {
    const settings = JSON.parse(fs.readFileSync(sp, 'utf-8'));
    if (!settings.hooks || typeof settings.hooks !== 'object') return;

    const hooks = settings.hooks as Record<string, any[]>;
    const cleaned: Record<string, any[]> = {};

    for (const [event, entries] of Object.entries(hooks)) {
      if (!Array.isArray(entries)) continue;
      const filtered = entries.filter(
        (entry) =>
          !entry.hooks?.some(
            (h: any) => h.command?.includes('claude-notify') && !h.command?.includes('claude-rts-alert'),
          ),
      );
      if (filtered.length > 0) {
        cleaned[event] = filtered;
      }
    }

    if (Object.keys(cleaned).length > 0) {
      settings.hooks = cleaned;
    } else {
      delete settings.hooks;
    }

    const content = JSON.stringify(settings, null, 2) + '\n';
    const tmpPath = sp + '.tmp';
    fs.writeFileSync(tmpPath, content, 'utf-8');
    fs.renameSync(tmpPath, sp);
  } catch {
    // Best-effort cleanup
  }
}

/**
 * Run full installation: hook, sounds, runtime, commands, package.json.
 */
export function installAll(opts?: InstallPaths): void {
  copyHookScript(opts);
  copyAllThemeSounds(opts);
  copyRuntime(opts);
  copySlashCommands(opts);
  ensurePackageJson(opts);
}
