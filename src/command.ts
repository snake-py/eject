import chalk from 'chalk';
import { config } from './config.js';
import {
    amendCommit,
    commitEjection,
    isGitHistoryClean,
    isGitInstalled,
} from './git.js';
import { errorLog, infoLog, warnLog } from './log.js';
import { copyDependency, install, updatePackageJson } from './system.js';

export function eject(
    dependencies: string[],
    options: { force: boolean; verbose: boolean },
) {
    if (!options.force && !isGitInstalled()) {
        warnLog(
            'Git is not installed, please install git or use --force to bypass git check',
        );
        return;
    }
    if (!options.force && !isGitHistoryClean()) {
        warnLog(
            'Please commit your changes before ejecting dependencies or use --force to bypass git history',
        );
        return;
    }
    const successFullEjections = [];
    const failedEjections = [];
    for (const dependency of dependencies) {
        try {
            copyDependency(dependency);
            successFullEjections.push(dependency);
        } catch (error) {
            if (options.verbose) {
                errorLog('Error ejecting dependency:', dependency);
            }
            failedEjections.push(dependency);
        }
    }
    if (successFullEjections.length > 0) {
        console.log(
            '✅ Ejected dependencies:',
            chalk.bold(successFullEjections),
        );
    } else {
        warnLog('No dependencies ejected');
        return;
    }
    if (failedEjections.length > 0) {
        console.log('❌ Ejected dependencies: ', chalk.bold(failedEjections));
    }
    updatePackageJson(successFullEjections);
    commitEjection(config.COMMIT_MESSAGE);
    console.log(
        `📦 Installing dependencies (you can skip this e.g. with ${chalk.bold('Ctrl + C')})`,
    );
    install();
    console.log('✅ Install done');
    amendCommit(config.COMMIT_MESSAGE);
    console.log(
        '➡️  Run',
        chalk.bold('git show HEAD'),
        'to see the ejected code',
    );
}
