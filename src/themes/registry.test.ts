import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  THEMES,
  THEME_NAMES,
  getThemeSoundFile,
  getActiveTheme,
  setActiveTheme,
  ThemeName,
  HookEvent,
} from './registry';

function makeTempConfigPath(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-notify-test-'));
  return path.join(dir, 'config.json');
}

let tempPaths: string[] = [];

afterEach(() => {
  for (const p of tempPaths) {
    try {
      fs.unlinkSync(p);
    } catch { /* ignore */ }
    try {
      fs.rmdirSync(path.dirname(p));
    } catch { /* ignore */ }
  }
  tempPaths = [];
});

describe('THEMES constant', () => {
  const expectedThemes: ThemeName[] = ['wc3-orc', 'wc3-human', 'aoe2'];
  const expectedEvents: HookEvent[] = ['stop', 'notification', 'session-start', 'post-tool-use'];

  it('contains all 3 themes', () => {
    for (const theme of expectedThemes) {
      expect(THEMES).toHaveProperty(theme);
    }
  });

  it('each theme maps all 4 events', () => {
    for (const theme of expectedThemes) {
      for (const event of expectedEvents) {
        expect(THEMES[theme]).toHaveProperty(event);
        expect(typeof THEMES[theme][event]).toBe('string');
      }
    }
  });

  it('sound filenames follow {theme-id}/{event-name}.wav pattern', () => {
    for (const theme of expectedThemes) {
      for (const event of expectedEvents) {
        const filename = THEMES[theme][event];
        expect(filename).toMatch(new RegExp(`^${theme}/.*\\.wav$`));
      }
    }
  });
});

describe('THEME_NAMES', () => {
  it('contains all valid theme names', () => {
    expect(THEME_NAMES).toContain('wc3-orc');
    expect(THEME_NAMES).toContain('wc3-human');
    expect(THEME_NAMES).toContain('aoe2');
    expect(THEME_NAMES).toHaveLength(3);
  });
});

describe('getThemeSoundFile', () => {
  it('returns correct path for wc3-orc stop event', () => {
    expect(getThemeSoundFile('wc3-orc', 'stop')).toBe('wc3-orc/task-complete.wav');
  });

  it('returns correct path for aoe2 notification event', () => {
    expect(getThemeSoundFile('aoe2', 'notification')).toBe('aoe2/needs-input.wav');
  });

  it('throws for invalid theme', () => {
    expect(() => getThemeSoundFile('invalid-theme' as ThemeName, 'stop'))
      .toThrow(/theme/i);
  });

  it('throws for invalid event', () => {
    expect(() => getThemeSoundFile('wc3-orc', 'invalid-event' as HookEvent))
      .toThrow(/event/i);
  });
});

describe('getActiveTheme', () => {
  it('returns "wc3-orc" when no config file exists', () => {
    const configPath = path.join(os.tmpdir(), 'nonexistent-dir-' + Date.now(), 'config.json');
    expect(getActiveTheme(configPath)).toBe('wc3-orc');
  });

  it('returns stored theme when config exists', () => {
    const configPath = makeTempConfigPath();
    tempPaths.push(configPath);
    fs.writeFileSync(configPath, JSON.stringify({ activeTheme: 'aoe2' }));
    expect(getActiveTheme(configPath)).toBe('aoe2');
  });

  it('returns default when stored theme is invalid', () => {
    const configPath = makeTempConfigPath();
    tempPaths.push(configPath);
    fs.writeFileSync(configPath, JSON.stringify({ activeTheme: 'invalid-theme' }));
    expect(getActiveTheme(configPath)).toBe('wc3-orc');
  });
});

describe('setActiveTheme', () => {
  it('writes theme and subsequent getActiveTheme returns it', () => {
    const configPath = makeTempConfigPath();
    tempPaths.push(configPath);
    setActiveTheme('aoe2', configPath);
    expect(getActiveTheme(configPath)).toBe('aoe2');
  });

  it('throws for invalid theme name', () => {
    const configPath = makeTempConfigPath();
    tempPaths.push(configPath);
    expect(() => setActiveTheme('invalid-theme' as ThemeName, configPath))
      .toThrow(/theme/i);
  });

  it('preserves other config keys when setting theme', () => {
    const configPath = makeTempConfigPath();
    tempPaths.push(configPath);
    fs.writeFileSync(configPath, JSON.stringify({ otherKey: 'value' }));
    setActiveTheme('wc3-human', configPath);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(config.otherKey).toBe('value');
    expect(config.activeTheme).toBe('wc3-human');
  });
});
