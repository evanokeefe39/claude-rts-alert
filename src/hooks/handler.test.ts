import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../audio', () => ({
  playSound: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../themes', () => ({
  getActiveTheme: vi.fn().mockReturnValue('wc3-orc'),
  getThemeSoundFile: vi.fn().mockImplementation((theme: string, event: string) => {
    const map: Record<string, string> = {
      'stop': `${theme}/task-complete.wav`,
      'notification': `${theme}/needs-input.wav`,
      'session-start': `${theme}/greeting.wav`,
      'post-tool-use': `${theme}/error.wav`,
    };
    return map[event] ?? '';
  }),
}));

import { handleHookEvent } from './handler';
import { playSound } from '../audio';
import { getActiveTheme, getThemeSoundFile } from '../themes';

const mockPlaySound = vi.mocked(playSound);
const mockGetActiveTheme = vi.mocked(getActiveTheme);
const mockGetThemeSoundFile = vi.mocked(getThemeSoundFile);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetActiveTheme.mockReturnValue('wc3-orc');
});

describe('handleHookEvent', () => {
  it('Stop event plays task-complete sound', async () => {
    await handleHookEvent('Stop');
    expect(mockGetActiveTheme).toHaveBeenCalled();
    expect(mockGetThemeSoundFile).toHaveBeenCalledWith('wc3-orc', 'stop');
    expect(mockPlaySound).toHaveBeenCalledWith('wc3-orc/task-complete.wav');
  });

  it('Notification event plays needs-input sound', async () => {
    await handleHookEvent('Notification');
    expect(mockGetThemeSoundFile).toHaveBeenCalledWith('wc3-orc', 'notification');
    expect(mockPlaySound).toHaveBeenCalledWith('wc3-orc/needs-input.wav');
  });

  it('SessionStart event plays greeting sound', async () => {
    await handleHookEvent('SessionStart');
    expect(mockGetThemeSoundFile).toHaveBeenCalledWith('wc3-orc', 'session-start');
    expect(mockPlaySound).toHaveBeenCalledWith('wc3-orc/greeting.wav');
  });

  it('PostToolUse with error plays error sound', async () => {
    await handleHookEvent('PostToolUse', { toolName: 'Bash', toolError: 'exit code 1' });
    expect(mockGetThemeSoundFile).toHaveBeenCalledWith('wc3-orc', 'post-tool-use');
    expect(mockPlaySound).toHaveBeenCalledWith('wc3-orc/error.wav');
  });

  it('PostToolUse without error does NOT play sound', async () => {
    await handleHookEvent('PostToolUse', { toolName: 'Bash' });
    expect(mockPlaySound).not.toHaveBeenCalled();
  });

  it('PostToolUse with no context does NOT play sound', async () => {
    await handleHookEvent('PostToolUse');
    expect(mockPlaySound).not.toHaveBeenCalled();
  });

  it('PostToolUse with empty toolError does NOT play sound', async () => {
    await handleHookEvent('PostToolUse', { toolName: 'Bash', toolError: '' });
    expect(mockPlaySound).not.toHaveBeenCalled();
  });

  it('unknown event does not throw and does not play sound', async () => {
    await expect(handleHookEvent('UnknownEvent')).resolves.toBeUndefined();
    expect(mockPlaySound).not.toHaveBeenCalled();
  });

  it('playSound error is caught and does not throw', async () => {
    mockPlaySound.mockRejectedValueOnce(new Error('audio fail'));
    // Should not throw
    await expect(handleHookEvent('Stop')).resolves.toBeUndefined();
  });

  it('uses active theme from getActiveTheme', async () => {
    mockGetActiveTheme.mockReturnValue('aoe2' as any);
    await handleHookEvent('Stop');
    expect(mockGetThemeSoundFile).toHaveBeenCalledWith('aoe2', 'stop');
  });
});
