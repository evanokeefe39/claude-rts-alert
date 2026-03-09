import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Hoist mock functions so they're available in vi.mock factories
const mockSelect = vi.hoisted(() => vi.fn());
const mockPlaySound = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('@inquirer/select', () => ({ default: mockSelect }));

vi.mock('../audio', () => ({
  playSound: mockPlaySound,
}));

import { setup } from './setup';
import { getActiveTheme } from '../themes';
import type { HookEntry } from '../config';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'setup-test-'));
}

describe('setup', () => {
  let tmpDir: string;
  let settingsPath: string;
  let configPath: string;
  let stdoutSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    settingsPath = path.join(tmpDir, 'settings.json');
    configPath = path.join(tmpDir, 'config.json');
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    mockSelect.mockReset();
    mockPlaySound.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('calls setActiveTheme with the selected theme on confirm', async () => {
    mockSelect.mockResolvedValueOnce('aoe2').mockResolvedValueOnce('yes');

    await setup({ settingsPath, configPath });

    expect(getActiveTheme(configPath)).toBe('aoe2');
  });

  it('writes hooks to settings.json with correct Claude event names', async () => {
    mockSelect.mockResolvedValueOnce('wc3-orc').mockResolvedValueOnce('yes');

    await setup({ settingsPath, configPath });

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    const hooks = settings.hooks;

    expect(hooks).toHaveProperty('Stop');
    expect(hooks).toHaveProperty('Notification');
    expect(hooks).toHaveProperty('SessionStart');
    expect(hooks).toHaveProperty('PostToolUse');
  });

  it('hook commands contain "claude-notify" and "handler.js"', async () => {
    mockSelect.mockResolvedValueOnce('wc3-orc').mockResolvedValueOnce('yes');

    await setup({ settingsPath, configPath });

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    const hooks = settings.hooks as Record<string, HookEntry[]>;

    for (const event of ['Stop', 'Notification', 'SessionStart', 'PostToolUse']) {
      const entries = hooks[event];
      expect(entries.length).toBeGreaterThan(0);
      expect(entries[0].command).toContain('claude-notify');
      expect(entries[0].command).toContain('handler.js');
    }
  });

  it('PostToolUse hook entry has matcher ".*"', async () => {
    mockSelect.mockResolvedValueOnce('wc3-orc').mockResolvedValueOnce('yes');

    await setup({ settingsPath, configPath });

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    const hooks = settings.hooks as Record<string, HookEntry[]>;

    expect(hooks['PostToolUse'][0].matcher).toBe('.*');
    expect(hooks['Stop'][0].matcher).toBeUndefined();
  });

  it('cancel flow prints cancellation message without installing', async () => {
    mockSelect.mockResolvedValueOnce('wc3-orc').mockResolvedValueOnce('cancel');

    await setup({ settingsPath, configPath });

    const output = stdoutSpy.mock.calls.map((c) => c[0]).join('');
    expect(output).toContain('cancelled');

    expect(fs.existsSync(settingsPath)).toBe(false);
  });

  it('retry flow allows picking a different theme', async () => {
    mockSelect
      .mockResolvedValueOnce('wc3-human')
      .mockResolvedValueOnce('retry')
      .mockResolvedValueOnce('aoe2')
      .mockResolvedValueOnce('yes');

    await setup({ settingsPath, configPath });

    expect(getActiveTheme(configPath)).toBe('aoe2');
  });

  it('preserves existing non-claude-notify hooks in settings.json', async () => {
    const existing = {
      hooks: {
        Stop: [{ type: 'command', command: 'echo done' }],
      },
    };
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(existing), 'utf-8');

    mockSelect.mockResolvedValueOnce('wc3-orc').mockResolvedValueOnce('yes');

    await setup({ settingsPath, configPath });

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    const stopHooks = settings.hooks.Stop as HookEntry[];

    expect(stopHooks.length).toBe(2);
    expect(stopHooks[0].command).toBe('echo done');
    expect(stopHooks[1].command).toContain('claude-notify');
  });
});
