#!/usr/bin/env node

import { listThemes } from './list';
import { uninstall } from './uninstall';

/**
 * CLI entry point. Routes argv to the appropriate command handler.
 */
export async function main(args: string[]): Promise<void> {
  const command = args[0] ?? 'setup';

  switch (command) {
    case 'list':
      listThemes();
      break;

    case 'uninstall':
      await uninstall();
      break;

    case 'setup':
      // Placeholder -- wired in Plan 02
      process.stdout.write('Setup not yet implemented.\n');
      break;

    default:
      process.stderr.write(
        `Usage: claude-notify <command>\n\nCommands:\n  setup       Configure themes and install hooks (default)\n  list        Show available themes\n  uninstall   Remove all hooks and sound files\n`,
      );
      break;
  }
}

if (require.main === module) {
  main(process.argv.slice(2));
}
