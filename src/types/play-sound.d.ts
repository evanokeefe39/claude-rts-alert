declare module 'play-sound' {
  interface Player {
    play(filepath: string, callback: (err: Error | null) => void): void;
  }

  function playSound(opts?: Record<string, unknown>): Player;
  export default playSound;
}
