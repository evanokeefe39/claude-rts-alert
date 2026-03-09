import path from 'path';
import fs from 'fs';
import playSound_ from 'play-sound';

const player = playSound_({});

/**
 * Resolves a sound filename to an absolute path within the bundled assets directory.
 * Throws if the file does not exist.
 */
export function resolveAssetPath(filename: string): string {
  const assetPath = path.resolve(__dirname, '../../assets/sounds/', filename);
  if (!fs.existsSync(assetPath)) {
    throw new Error(`Sound file not found: ${filename} (looked at ${assetPath})`);
  }
  return assetPath;
}

/**
 * Plays a sound file from the bundled assets directory.
 * Returns a Promise that resolves when playback completes.
 */
export function playSound(filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let filePath: string;
    try {
      filePath = resolveAssetPath(filename);
    } catch (err) {
      reject(err);
      return;
    }

    player.play(filePath, (err: Error | null) => {
      if (err) {
        reject(new Error(`Failed to play ${filename} on ${process.platform}: ${err.message}`));
      } else {
        resolve();
      }
    });
  });
}
