import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../themes', () => ({
  THEME_NAMES: ['wc3-orc', 'wc3-human', 'aoe2'],
  getActiveTheme: vi.fn(() => 'aoe2'),
}));

import { listThemes } from './list';
import { getActiveTheme } from '../themes';

describe('listThemes', () => {
  let output: string;

  beforeEach(() => {
    output = '';
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk: string | Uint8Array) => {
      output += chunk.toString();
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('outputs all 3 theme names', () => {
    listThemes();
    expect(output).toContain('wc3-orc');
    expect(output).toContain('wc3-human');
    expect(output).toContain('aoe2');
  });

  it('marks the active theme with [active] suffix', () => {
    listThemes();
    const lines = output.trim().split('\n');
    const activeLine = lines.find((line) => line.includes('aoe2'));
    expect(activeLine).toContain('[active]');
  });

  it('does not mark non-active themes with [active]', () => {
    listThemes();
    const lines = output.trim().split('\n');
    const nonActiveLines = lines.filter((line) => !line.includes('aoe2'));
    for (const line of nonActiveLines) {
      expect(line).not.toContain('[active]');
    }
  });

  it('outputs one theme per line with 2-space indent', () => {
    listThemes();
    // Split on newline, filter out empty trailing line
    const lines = output.split('\n').filter((l) => l.length > 0);
    expect(lines).toHaveLength(3);
    for (const line of lines) {
      expect(line).toMatch(/^  \S/);
    }
  });
});

describe('main', () => {
  let stdoutOutput: string;
  let stderrOutput: string;

  beforeEach(() => {
    stdoutOutput = '';
    stderrOutput = '';
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk: string | Uint8Array) => {
      stdoutOutput += chunk.toString();
      return true;
    });
    vi.spyOn(process.stderr, 'write').mockImplementation((chunk: string | Uint8Array) => {
      stderrOutput += chunk.toString();
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('routes "list" to listThemes', async () => {
    const { main } = await import('./index');
    await main(['list']);
    expect(stdoutOutput).toContain('wc3-orc');
    expect(stdoutOutput).toContain('[active]');
  });

  it('prints usage to stderr for unknown command', async () => {
    const { main } = await import('./index');
    await main(['bogus']);
    expect(stderrOutput).toContain('Usage');
  });
});
