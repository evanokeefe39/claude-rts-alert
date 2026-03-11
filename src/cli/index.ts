#!/usr/bin/env node

import { listThemes } from './list';
import { uninstall } from './uninstall';
import { setup } from './setup';

/**
 * CLI entry point. Routes argv to the appropriate command handler.
 */
export async function main(args: string[]): Promise<void> {
  const command = args[0] ?? 'setup';

  // Parse --theme flag from anywhere in args
  const themeIdx = args.indexOf('--theme');
  const theme = themeIdx !== -1 ? args[themeIdx + 1] : undefined;

  switch (command) {
    case 'list':
      listThemes();
      break;

    case 'uninstall':
      await uninstall();
      break;

    case 'setup':
      await setup({ theme });
      break;

    default:
      process.stderr.write(
        `Usage: claude-rts-alert <command>\n\nCommands:\n  setup [--theme <name>]  Configure themes and install hooks (default)\n  list                   Show available themes\n  uninstall              Remove all hooks and sound files\n\nThemes: wc3-orc, wc3-human, aoe2\n`,
      );
      break;
  }
}

if (require.main === module) {
  main(process.argv.slice(2));
}
