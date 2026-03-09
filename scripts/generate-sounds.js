#!/usr/bin/env node
/**
 * Generate synthesized WAV sound files for all theme packs.
 *
 * Each theme gets a different base frequency range, and each event type
 * gets a different tonal pattern so sounds are audibly distinguishable.
 *
 * Usage: node scripts/generate-sounds.js
 */

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 8000;
const BITS_PER_SAMPLE = 8;
const NUM_CHANNELS = 1;

/**
 * Create a WAV file buffer from raw 8-bit PCM samples.
 */
function createWav(samples) {
  const dataSize = samples.length;
  const fileSize = 44 + dataSize;
  const buffer = Buffer.alloc(fileSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(fileSize - 8, 4);
  buffer.write('WAVE', 8);

  // fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Sub-chunk size
  buffer.writeUInt16LE(1, 20);  // PCM format
  buffer.writeUInt16LE(NUM_CHANNELS, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * NUM_CHANNELS * BITS_PER_SAMPLE / 8, 28); // Byte rate
  buffer.writeUInt16LE(NUM_CHANNELS * BITS_PER_SAMPLE / 8, 32); // Block align
  buffer.writeUInt16LE(BITS_PER_SAMPLE, 34);

  // data sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < dataSize; i++) {
    buffer.writeUInt8(samples[i], 44 + i);
  }

  return buffer;
}

/**
 * Generate a sine wave tone segment (8-bit unsigned PCM).
 */
function generateTone(freq, durationSec, volume = 0.8) {
  const numSamples = Math.floor(SAMPLE_RATE * durationSec);
  const samples = new Uint8Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // 8-bit PCM: 128 = silence, 0-255 range
    const value = 128 + Math.round(127 * volume * Math.sin(2 * Math.PI * freq * t));
    samples[i] = Math.max(0, Math.min(255, value));
  }
  return samples;
}

/**
 * Concatenate multiple Uint8Arrays into one.
 */
function concat(...arrays) {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Rising two-note pattern (triumphant) for task-complete.
 */
function risingTwoNote(freqLow, freqHigh) {
  return concat(generateTone(freqLow, 0.15), generateTone(freqHigh, 0.15));
}

/**
 * Repeated pulse pattern (attention-getting) for needs-input.
 */
function repeatedPulse(freq) {
  const pulse = generateTone(freq, 0.1);
  const silence = new Uint8Array(Math.floor(SAMPLE_RATE * 0.05)).fill(128);
  return concat(pulse, silence, pulse, silence, pulse);
}

/**
 * Single warm tone for greeting.
 */
function singleTone(freq) {
  return generateTone(freq, 0.4);
}

/**
 * Descending tone (negative feedback) for error.
 */
function descendingTone(freqHigh, freqLow) {
  return concat(generateTone(freqHigh, 0.15), generateTone(freqLow, 0.15));
}

// Theme definitions: [themeId, baseFreq, taskCompleteHigh, errorHigh]
const themes = [
  { id: 'wc3-orc',          base: 200, tcHigh: 300, errHigh: 300, errLow: 150, pulse: 250 },
  { id: 'wc3-human',        base: 400, tcHigh: 600, errHigh: 600, errLow: 300, pulse: 450 },
  { id: 'aoe2',             base: 600, tcHigh: 900, errHigh: 900, errLow: 450, pulse: 650 },
  { id: 'classic-windows',  base: 800, tcHigh: 1200, errHigh: 1200, errLow: 600, pulse: 850 },
];

const assetsDir = path.resolve(__dirname, '..', 'assets', 'sounds');

for (const theme of themes) {
  const themeDir = path.join(assetsDir, theme.id);
  fs.mkdirSync(themeDir, { recursive: true });

  const files = {
    'task-complete.wav': risingTwoNote(theme.base, theme.tcHigh),
    'needs-input.wav': repeatedPulse(theme.pulse),
    'greeting.wav': singleTone(theme.base),
    'error.wav': descendingTone(theme.errHigh, theme.errLow),
  };

  for (const [filename, samples] of Object.entries(files)) {
    const filePath = path.join(themeDir, filename);
    const wav = createWav(samples);
    fs.writeFileSync(filePath, wav);
    console.log(`Created: ${theme.id}/${filename} (${wav.length} bytes)`);
  }
}

console.log('\nDone! Generated 16 sound files across 4 themes.');
