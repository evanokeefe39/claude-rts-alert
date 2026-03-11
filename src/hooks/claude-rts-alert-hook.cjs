#!/usr/bin/env node
// claude-rts-alert hook — zero-dependency CJS script
// Installed to ~/.claude/hooks/claude-rts-alert.js
// Plays themed RTS sounds for Claude Code hook events.

const { exec, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// --- Event mapping ---
// Maps Claude Code hook event names to sound filenames (without extension)
const EVENT_SOUND_MAP = {
  'Stop': 'task-complete',
  'Notification': 'needs-input',
  'SubagentStop': 'task-complete',
  'SessionStart': 'greeting',
  'PostToolUse': 'error', // only on tool errors
};

const DEFAULT_THEME = 'wc3-orc';
const HOME = os.homedir();
const CONFIG_PATH = path.join(HOME, '.claude', 'claude-rts-alert', 'config.json');
const SOUNDS_DIR = path.join(HOME, '.claude', 'sounds', 'claude-rts-alert');
const LOG_PATH = path.join(HOME, '.claude', 'claude-rts-alert', 'debug.log');

// --- Logging ---

function log(msg) {
  try {
    const ts = new Date().toISOString();
    fs.appendFileSync(LOG_PATH, `[${ts}] ${msg}\n`);
  } catch {
    // logging is best-effort
  }
}

// --- Helpers ---

function getActiveTheme() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return DEFAULT_THEME;
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    return config.activeTheme || DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function playSound(soundPath) {
  if (!fs.existsSync(soundPath)) {
    log(`SKIP sound not found: ${soundPath}`);
    return;
  }

  const platform = process.platform;

  if (platform === 'win32') {
    const escaped = soundPath.replace(/'/g, "''");
    const psCmd = `(New-Object System.Media.SoundPlayer '${escaped}').PlaySync()`;
    log(`PLAY ${soundPath} via SoundPlayer`);
    const child = spawn('powershell', ['-NoProfile', '-Command', psCmd], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    child.unref();
    return;
  }

  let cmd;
  if (platform === 'darwin') {
    cmd = `afplay "${soundPath}"`;
  } else {
    cmd = `aplay "${soundPath}" 2>/dev/null || paplay "${soundPath}" 2>/dev/null || mpv --no-video "${soundPath}" 2>/dev/null`;
  }

  log(`PLAY ${soundPath} via ${platform === 'darwin' ? 'afplay' : 'aplay/paplay/mpv'}`);
  const child = exec(cmd, () => {}); // silent failures
  child.unref();
}

// --- Main ---

const eventName = process.env.CLAUDE_HOOK_EVENT_NAME || '';
const soundName = EVENT_SOUND_MAP[eventName];

log(`EVENT ${eventName} -> sound: ${soundName || '(none)'}`);

if (!soundName) {
  process.exit(0);
}

// PostToolUse requires reading stdin to check for errors
if (eventName === 'PostToolUse') {
  let input = '';

  // Timeout guard: if stdin doesn't close within 3s, exit silently
  // Prevents hanging on Windows/Git Bash pipe issues
  const stdinTimeout = setTimeout(() => {
    log('PostToolUse stdin timeout — exiting');
    process.exit(0);
  }, 3000);

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => (input += chunk));
  process.stdin.on('end', () => {
    clearTimeout(stdinTimeout);
    try {
      const data = JSON.parse(input);
      if (!data.tool_error) {
        log('PostToolUse no error — skipping');
        process.exit(0);
      }
      log('PostToolUse tool_error detected');
    } catch {
      log('PostToolUse stdin parse error — skipping');
      process.exit(0);
    }

    const theme = getActiveTheme();
    const soundPath = path.join(SOUNDS_DIR, theme, soundName + '.wav');
    playSound(soundPath);
  });
} else {
  const theme = getActiveTheme();
  const soundPath = path.join(SOUNDS_DIR, theme, soundName + '.wav');
  playSound(soundPath);
}
