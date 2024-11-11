import chalk from 'chalk';
import { config } from './config.js';
import {
    amendCommit,
    commitEjection,
    isGitHistoryClean,
    isGitInstalled,
} from './git.js';
import { errorLog, infoLog, warnLog } from './log.js';
import { copyDependency, detectPackageManager, updatePackageJson } from './system.js';
import {execSync} from 'child_process';

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
    const packageManager = detectPackageManager()
    const installCmd = `${packageManager} install`
    const installLog = chalk.bold(installCmd)
    console.log(
        `📦 Running ${installLog} (you can skip this e.g. with ${chalk.bold('Ctrl + C')})`,
    );
    execSync(installCmd, { stdio: 'inherit' });
    console.log(`✅ ${installLog} done`);
    amendCommit();
    console.log(
        '➡️  Run',
        chalk.bold('git show HEAD'),
        'to see the ejected code',
    );
}
