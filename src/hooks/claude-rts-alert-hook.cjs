#!/usr/bin/env node
// claude-rts-alert hook — zero-dependency CJS script
// Installed to ~/.claude/hooks/claude-rts-alert.js
// Plays themed RTS sounds for Claude Code hook events.

const { exec } = require('child_process');
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
  if (!fs.existsSync(soundPath)) return;

  const platform = process.platform;
  let cmd;

  if (platform === 'win32') {
    const escaped = soundPath.replace(/'/g, "''");
    cmd = `powershell -Command "Add-Type -AssemblyName presentationCore; $p = New-Object System.Windows.Media.MediaPlayer; $p.Open([Uri]'${escaped}'); $p.Play(); Start-Sleep -Seconds 3; $p.Close()"`;
  } else if (platform === 'darwin') {
    cmd = `afplay "${soundPath}"`;
  } else {
    cmd = `aplay "${soundPath}" 2>/dev/null || paplay "${soundPath}" 2>/dev/null || mpv --no-video "${soundPath}" 2>/dev/null`;
  }

  const child = exec(cmd, () => {}); // silent failures
  child.unref();
}

// --- Main ---

const eventName = process.env.CLAUDE_HOOK_EVENT_NAME || '';
const soundName = EVENT_SOUND_MAP[eventName];

if (!soundName) {
  // Unknown event — exit silently
  process.exit(0);
}

// PostToolUse requires reading stdin to check for errors
if (eventName === 'PostToolUse') {
  let input = '';

  // Timeout guard: if stdin doesn't close within 3s, exit silently
  // Prevents hanging on Windows/Git Bash pipe issues
  const stdinTimeout = setTimeout(() => process.exit(0), 3000);

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => (input += chunk));
  process.stdin.on('end', () => {
    clearTimeout(stdinTimeout);
    try {
      const data = JSON.parse(input);
      // Only play error sound when there's an actual tool error
      if (!data.tool_error) {
        process.exit(0);
      }
    } catch {
      // Can't parse stdin — exit silently
      process.exit(0);
    }

    const theme = getActiveTheme();
    const soundPath = path.join(SOUNDS_DIR, theme, soundName + '.wav');
    playSound(soundPath);
  });
} else {
  // Non-stdin events: play immediately
  const theme = getActiveTheme();
  const soundPath = path.join(SOUNDS_DIR, theme, soundName + '.wav');
  playSound(soundPath);
}
