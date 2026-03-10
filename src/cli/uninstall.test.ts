import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const mockRemoveInstalledFiles = vi.hoisted(() => vi.fn());
const mockCleanupLegacy = vi.hoisted(() => vi.fn());

vi.mock('../installer', () => ({
  removeInstalledFiles: mockRemoveInstalledFiles,
  cleanupLegacy: mockCleanupLegacy,
}));

import { uninstall } from './uninstall';

describe('uninstall', () => {
  let tmpDir: string;
  let settingsPath: string;
  let output: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-rts-alert-uninstall-'));
    settingsPath = path.join(tmpDir, 'settings.json');
    output = '';
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk: string | Uint8Array) => {
      output += chunk.toString();
      return true;
    });
    mockRemoveInstalledFiles.mockReset();
    mockCleanupLegacy.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('removes claude-rts-alert hooks from settings.json while preserving others', async () => {
    const settings = {
      theme: 'dark',
      hooks: {
        Stop: [
          { hooks: [{ type: 'command', command: 'echo done' }] },
          { hooks: [{ type: 'command', command: 'node ~/.claude/hooks/claude-rts-alert.js # claude-rts-alert' }] },
        ],
        Notification: [
          { hooks: [{ type: 'command', command: 'node ~/.claude/hooks/claude-rts-alert.js # claude-rts-alert' }] },
        ],
      },
    };
    fs.writeFileSync(settingsPath, JSON.stringify(settings));

    await uninstall(settingsPath);

    const result = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    expect(result.theme).toBe('dark');
    expect(result.hooks.Stop).toEqual([{ hooks: [{ type: 'command', command: 'echo done' }] }]);
    expect(result.hooks.Notification).toBeUndefined();
  });

  it('also removes legacy claude-notify hooks', async () => {
    const settings = {
      hooks: {
        Stop: [
          { hooks: [{ type: 'command', command: 'node /old/path/claude-notify/handler.js' }] },
        ],
      },
    };
    fs.writeFileSync(settingsPath, JSON.stringify(settings));

    await uninstall(settingsPath);

    const result = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    expect(result.hooks).toBeUndefined();
  });

  it('removes hooks key entirely when all hooks are ours', async () => {
    const settings = {
      hooks: {
        Stop: [
          { hooks: [{ type: 'command', command: 'node ~/.claude/hooks/claude-rts-alert.js # claude-rts-alert' }] },
        ],
      },
    };
    fs.writeFileSync(settingsPath, JSON.stringify(settings));

    await uninstall(settingsPath);

    const result = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    expect(result.hooks).toBeUndefined();
  });

  it('handles missing settings.json gracefully', async () => {
    await expect(uninstall(settingsPath)).resolves.toBeUndefined();
  });

  it('calls removeInstalledFiles', async () => {
    await uninstall(settingsPath);
    expect(mockRemoveInstalledFiles).toHaveBeenCalledOnce();
  });

  it('calls cleanupLegacy', async () => {
    await uninstall(settingsPath);
    expect(mockCleanupLegacy).toHaveBeenCalledWith(settingsPath);
  });

  it('prints confirmation message', async () => {
    await uninstall(settingsPath);
    expect(output).toContain('uninstalled');
  });
});
