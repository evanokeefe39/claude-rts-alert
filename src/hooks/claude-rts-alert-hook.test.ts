import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync, spawn } from 'child_process';

const HOOK_PATH = path.resolve(__dirname, 'claude-rts-alert-hook.cjs');
const HOME = os.homedir();
const CONFIG_DIR = path.join(HOME, '.claude', 'claude-rts-alert');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
const SOUNDS_DIR = path.join(HOME, '.claude', 'sounds', 'claude-rts-alert');

// Helper: run the hook script with a given event name and optional stdin
function runHook(
  eventName: string,
  stdinData?: string,
): Promise<{ exitCode: number | null; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn('node', [HOOK_PATH], {
      env: { ...process.env, CLAUDE_HOOK_EVENT_NAME: eventName },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stderr = '';
    child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));

    child.on('close', (code) => {
      resolve({ exitCode: code, stderr });
    });

    if (stdinData !== undefined) {
      child.stdin.write(stdinData);
      child.stdin.end();
    } else {
      child.stdin.end();
    }
  });
}

describe('claude-rts-alert-hook.cjs', () => {
  it('exits cleanly for unknown events', async () => {
    const { exitCode } = await runHook('SomeRandomEvent');
    expect(exitCode).toBe(0);
  });

  it('exits cleanly for PostToolUse with no tool_error', async () => {
    const stdinData = JSON.stringify({ tool_name: 'Bash' });
    const { exitCode } = await runHook('PostToolUse', stdinData);
    expect(exitCode).toBe(0);
  });

  it('exits cleanly for PostToolUse with invalid JSON stdin', async () => {
    const { exitCode } = await runHook('PostToolUse', 'not json');
    expect(exitCode).toBe(0);
  });

  it('exits cleanly for SessionStart even if sounds dir missing', async () => {
    const { exitCode } = await runHook('SessionStart');
    expect(exitCode).toBe(0);
  });

  it('event map covers expected hook events', async () => {
    // Verify that the script at least doesn't crash for each mapped event
    const events = ['Stop', 'Notification', 'SubagentStop', 'SessionStart'];
    for (const event of events) {
      const { exitCode } = await runHook(event);
      expect(exitCode).toBe(0);
    }
  });

  it('PostToolUse with tool_error attempts to play sound (exits cleanly)', async () => {
    const stdinData = JSON.stringify({ tool_error: 'exit code 1' });
    const { exitCode } = await runHook('PostToolUse', stdinData);
    expect(exitCode).toBe(0);
  });
});
