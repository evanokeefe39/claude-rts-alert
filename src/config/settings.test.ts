import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { readSettings, writeSettings, mergeHooks } from './settings';
import type { HookEntry } from './settings';

describe('settings', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-notify-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('readSettings', () => {
    it('returns empty object for nonexistent file', () => {
      const result = readSettings(path.join(tmpDir, 'nonexistent.json'));
      expect(result).toEqual({});
    });

    it('returns parsed content for valid JSON file', () => {
      const settingsPath = path.join(tmpDir, 'settings.json');
      fs.writeFileSync(settingsPath, JSON.stringify({ theme: 'dark', apiKey: 'abc123' }));
      const result = readSettings(settingsPath);
      expect(result).toEqual({ theme: 'dark', apiKey: 'abc123' });
    });

    it('throws descriptive error for malformed JSON', () => {
      const settingsPath = path.join(tmpDir, 'settings.json');
      fs.writeFileSync(settingsPath, '{ invalid json }');
      expect(() => readSettings(settingsPath)).toThrow(settingsPath);
    });
  });

  describe('writeSettings', () => {
    it('creates parent directories if they do not exist', () => {
      const settingsPath = path.join(tmpDir, 'deep', 'nested', 'settings.json');
      writeSettings(settingsPath, { hello: 'world' });
      expect(fs.existsSync(settingsPath)).toBe(true);
    });

    it('writes pretty-printed JSON with 2-space indent and trailing newline', () => {
      const settingsPath = path.join(tmpDir, 'settings.json');
      const data = { theme: 'dark', count: 42 };
      writeSettings(settingsPath, data);
      const content = fs.readFileSync(settingsPath, 'utf-8');
      expect(content).toBe(JSON.stringify(data, null, 2) + '\n');
    });

    it('writes atomically via temp file rename', () => {
      const settingsPath = path.join(tmpDir, 'settings.json');
      writeSettings(settingsPath, { safe: true });
      // After successful write, no .tmp file should remain
      expect(fs.existsSync(settingsPath + '.tmp')).toBe(false);
      expect(fs.existsSync(settingsPath)).toBe(true);
      expect(JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))).toEqual({ safe: true });
    });
  });

  describe('mergeHooks', () => {
    const notifyHook: HookEntry = {
      type: 'command',
      command: 'node /path/to/claude-notify/handler.js',
    };

    const otherHook: HookEntry = {
      type: 'command',
      command: 'echo hello',
    };

    it('returns settings with new hooks when existing is empty', () => {
      const result = mergeHooks({}, { Stop: [notifyHook] });
      expect(result).toEqual({
        hooks: { Stop: [notifyHook] },
      });
    });

    it('preserves all non-hook keys in settings', () => {
      const existing = { theme: 'dark', apiKey: 'secret', nested: { a: 1 } };
      const result = mergeHooks(existing, { Stop: [notifyHook] });
      expect(result).toMatchObject({
        theme: 'dark',
        apiKey: 'secret',
        nested: { a: 1 },
      });
    });

    it('preserves existing hooks from other sources', () => {
      const existing = {
        hooks: {
          Stop: [otherHook],
        },
      };
      const result = mergeHooks(existing, { Stop: [notifyHook] });
      const stopHooks = (result as any).hooks.Stop;
      expect(stopHooks).toContainEqual(otherHook);
      expect(stopHooks).toContainEqual(notifyHook);
      expect(stopHooks).toHaveLength(2);
    });

    it('replaces existing claude-notify hooks with new ones', () => {
      const oldNotifyHook: HookEntry = {
        type: 'command',
        command: 'node /old/path/claude-notify/old-handler.js',
      };
      const existing = {
        hooks: {
          Stop: [otherHook, oldNotifyHook],
        },
      };
      const result = mergeHooks(existing, { Stop: [notifyHook] });
      const stopHooks = (result as any).hooks.Stop;
      expect(stopHooks).toContainEqual(otherHook);
      expect(stopHooks).toContainEqual(notifyHook);
      expect(stopHooks).not.toContainEqual(oldNotifyHook);
      expect(stopHooks).toHaveLength(2);
    });

    it('handles multiple event types independently', () => {
      const existing = {
        hooks: {
          Stop: [otherHook],
        },
      };
      const result = mergeHooks(existing, {
        Stop: [notifyHook],
        Notification: [{ type: 'command' as const, command: 'node /path/to/claude-notify/notify.js' }],
      });
      const hooks = (result as any).hooks;
      expect(hooks.Stop).toHaveLength(2);
      expect(hooks.Notification).toHaveLength(1);
    });

    it('preserves hooks for events not in newHooks', () => {
      const sessionHook: HookEntry = { type: 'command', command: 'echo session' };
      const existing = {
        hooks: {
          SessionStart: [sessionHook],
        },
      };
      const result = mergeHooks(existing, { Stop: [notifyHook] });
      const hooks = (result as any).hooks;
      expect(hooks.SessionStart).toEqual([sessionHook]);
      expect(hooks.Stop).toEqual([notifyHook]);
    });
  });
});
