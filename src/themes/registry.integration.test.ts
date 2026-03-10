import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import { THEME_NAMES, getThemeSoundFile } from '../themes';
import type { HookEvent } from '../themes';
import { resolveAssetPath } from '../audio';

describe('theme sound file resolution (integration)', () => {
  const events: HookEvent[] = ['stop', 'notification', 'session-start', 'post-tool-use'];

  for (const theme of THEME_NAMES) {
    for (const event of events) {
      it(`${theme}/${event} resolves to existing WAV file`, () => {
        const soundFile = getThemeSoundFile(theme, event);
        const absPath = resolveAssetPath(soundFile);
        expect(fs.existsSync(absPath)).toBe(true);
        const stat = fs.statSync(absPath);
        expect(stat.size).toBeGreaterThan(44); // Valid WAV header minimum
      });
    }
  }

  it('covers all 12 theme-event combinations', () => {
    expect(THEME_NAMES.length * events.length).toBe(12);
  });
});
