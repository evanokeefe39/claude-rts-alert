import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';
import { resolveAssetPath } from './player';

const mockPlay = vi.hoisted(() =>
  vi.fn((_filepath: string, cb: (err: Error | null) => void) => {
    cb(null);
  })
);

vi.mock('play-sound', () => {
  return {
    default: () => ({
      play: mockPlay,
    }),
  };
});

describe('resolveAssetPath', () => {
  it('returns an absolute path for an existing asset file', () => {
    const result = resolveAssetPath('placeholder.wav');
    expect(path.isAbsolute(result)).toBe(true);
    expect(result).toContain('assets');
    expect(result).toContain('placeholder.wav');
  });

  it('returned path points to a file that exists on disk', async () => {
    const fs = await import('fs');
    const result = resolveAssetPath('placeholder.wav');
    expect(fs.existsSync(result)).toBe(true);
  });

  it('throws an error for a nonexistent file', () => {
    expect(() => resolveAssetPath('nonexistent.wav')).toThrow();
  });
});

describe('playSound', () => {
  beforeEach(() => {
    mockPlay.mockClear();
  });

  it('calls play-sound play method with the resolved path', async () => {
    const { playSound } = await import('./player');
    await playSound('placeholder.wav');

    expect(mockPlay).toHaveBeenCalledTimes(1);
    const calledPath = mockPlay.mock.calls[0][0];
    expect(calledPath).toContain('placeholder.wav');
    expect(path.isAbsolute(calledPath)).toBe(true);
  });

  it('rejects with an error when file does not exist', async () => {
    const { playSound } = await import('./player');
    await expect(playSound('nonexistent.wav')).rejects.toThrow();
  });
});
