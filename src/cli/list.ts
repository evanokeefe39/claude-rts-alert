import { THEME_NAMES, getActiveTheme } from '../themes';

/**
 * Print all available themes to stdout, marking the active one.
 * Format: 2-space indent, theme name, [active] suffix if active.
 */
export function listThemes(): void {
  const active = getActiveTheme();

  for (const name of THEME_NAMES) {
    const marker = name === active ? ' [active]' : '';
    process.stdout.write(`  ${name}${marker}\n`);
  }
}
