import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { uninstall } from './uninstall';

describe('uninstall', () => {
  let tmpDir: string;
  let settingsPath: string;
  let soundsDir: string;
  let configDir: string;
  let output: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-notify-uninstall-'));
    settingsPath = path.join(tmpDir, 'settings.json');
    soundsDir = path.join(tmpDir, 'sounds');
    configDir = path.join(tmpDir, 'config');
    output = '';
    // Capture stdout
    const origWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: string | Uint8Array) => {
      output += chunk.toString();
      return true;
    }) as typeof process.stdout.write;
  });

  afterEach(() => {
    // Restore stdout (vitest handles this, but be safe)
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('removes claude-notify hooks from settings.json while preserving others', async () => {
    const settings = {
      theme: 'dark',
      hooks: {
        Stop: [
          { type: 'command', command: 'echo done' },
          { type: 'command', command: 'node /path/to/claude-notify/handler.js stop' },
        ],
        Notification: [
          { type: 'command', command: 'node /path/to/claude-notify/handler.js notification' },
        ],
      },
    };
    fs.writeFileSync(settingsPath, JSON.stringify(settings));

    await uninstall(settingsPath, soundsDir, configDir);

    const result = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    expect(result.theme).toBe('dark');
    // Stop should only have the non-claude-notify hook
    expect(result.hooks.Stop).toEqual([{ type: 'command', command: 'echo done' }]);
    // Notification had only claude-notify hooks, so the key should be removed
    expect(result.hooks.Notification).toBeUndefined();
  });

  it('removes hooks key entirely when all hooks are claude-notify', async () => {
    const settings = {
      hooks: {
        Stop: [
          { type: 'command', command: 'node /path/to/claude-notify/handler.js stop' },
        ],
      },
    };
    fs.writeFileSync(settingsPath, JSON.stringify(settings));

    await uninstall(settingsPath, soundsDir, configDir);

    const result = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    expect(result.hooks).toBeUndefined();
  });

  it('handles missing settings.json gracefully', async () => {
    // settingsPath does not exist -- should not throw
    await expect(uninstall(settingsPath, soundsDir, configDir)).resolves.toBeUndefined();
  });

  it('deletes sounds directory if it exists', async () => {
    fs.mkdirSync(soundsDir, { recursive: true });
    fs.writeFileSync(path.join(soundsDir, 'test.wav'), 'data');

    await uninstall(settingsPath, soundsDir, configDir);

    expect(fs.existsSync(soundsDir)).toBe(false);
  });

  it('deletes config directory if it exists', async () => {
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, 'config.json'), '{}');

    await uninstall(settingsPath, soundsDir, configDir);

    expect(fs.existsSync(configDir)).toBe(false);
  });

  it('handles missing sound and config directories gracefully', async () => {
    // Neither dir exists -- should not throw
    await expect(uninstall(settingsPath, soundsDir, configDir)).resolves.toBeUndefined();
  });

  it('prints confirmation message', async () => {
    await uninstall(settingsPath, soundsDir, configDir);

    expect(output).toContain('uninstalled');
  });
});
