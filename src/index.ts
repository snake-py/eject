import { cac } from 'cac';

import { resolveCommand } from './command.js';
import { config } from './staticConfig.js';

const cli = cac('eject');

cli.command('<dependency> [partial]', 'Ejects a dependency from node_modules', {
    allowUnknownOptions: true,
})
    .option('-f, --force', 'Bypass git history check')
    .option('-v, --verbose', 'Verbose output')
    .option('--no-source', 'Do not copy source files')
    .action(resolveCommand);

cli.help();
cli.version(config.projectVersion);

cli.parse(
    process.argv.length === 2 ? [...process.argv, '--help'] : process.argv,
);

process.on('unhandledRejection', (rejectValue) => {
    throw rejectValue;
});
