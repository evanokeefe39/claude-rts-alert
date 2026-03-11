#!/usr/bin/env node
// claude-rts-alert hook — zero-dependency CJS script
// Installed to ~/.claude/hooks/claude-rts-alert.js
// Plays themed RTS sounds for Claude Code hook events.
//
// Usage: node claude-rts-alert.js <event>
//   event: SessionStart | Stop | Notification | PostToolUse

const { exec, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Maps event arg to sound filename (without extension)
const EVENT_SOUND_MAP = {
  'Stop': 'task-complete',
  'Notification': 'needs-input',
  'SessionStart': 'greeting',
  'PostToolUse': 'error',
};

const DEFAULT_THEME = 'wc3-orc';
const HOME = os.homedir();
const CONFIG_PATH = path.join(HOME, '.claude', 'claude-rts-alert', 'config.json');
const SOUNDS_DIR = path.join(HOME, '.claude', 'sounds', 'claude-rts-alert');
const LOG_PATH = path.join(HOME, '.claude', 'claude-rts-alert', 'debug.log');

function log(msg) {
  try {
    const ts = new Date().toISOString();
    fs.appendFileSync(LOG_PATH, `[${ts}] ${msg}\n`);
  } catch {}
}

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
    log(`SKIP not found: ${soundPath}`);
    return;
  }

  const platform = process.platform;

  if (platform === 'win32') {
    const escaped = soundPath.replace(/'/g, "''");
    const psCmd = `(New-Object System.Media.SoundPlayer '${escaped}').PlaySync()`;
    log(`PLAY ${soundPath}`);
    spawnSync('powershell', ['-NoProfile', '-Command', psCmd], {
      stdio: 'ignore',
      windowsHide: true,
      timeout: 10000,
    });
    return;
  }

  let cmd;
  if (platform === 'darwin') {
    cmd = `afplay "${soundPath}"`;
  } else {
    cmd = `aplay "${soundPath}" 2>/dev/null || paplay "${soundPath}" 2>/dev/null || mpv --no-video "${soundPath}" 2>/dev/null`;
  }

  log(`PLAY ${soundPath}`);
  const child = exec(cmd, () => {});
  child.unref();
}

// --- Main ---

const eventName = process.argv[2] || '';
const soundName = EVENT_SOUND_MAP[eventName];

log(`EVENT ${eventName} -> ${soundName || '(none)'}`);

if (!soundName) {
  process.exit(0);
}

// PostToolUse: play on tool errors or AskUserQuestion (read stdin to check)
if (eventName === 'PostToolUse') {
  let input = '';
  const timeout = setTimeout(() => process.exit(0), 3000);

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => (input += chunk));
  process.stdin.on('end', () => {
    clearTimeout(timeout);
    try {
      const data = JSON.parse(input);
      if (data.tool_name === 'AskUserQuestion') {
        log('AskUserQuestion detected — playing needs-input');
        const theme = getActiveTheme();
        playSound(path.join(SOUNDS_DIR, theme, 'needs-input.wav'));
        return;
      }
      if (!data.tool_error) process.exit(0);
      log('PostToolUse error detected');
    } catch {
      process.exit(0);
    }
    const theme = getActiveTheme();
    playSound(path.join(SOUNDS_DIR, theme, soundName + '.wav'));
  });
} else {
  const theme = getActiveTheme();
  playSound(path.join(SOUNDS_DIR, theme, soundName + '.wav'));
}
