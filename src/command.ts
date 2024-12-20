import chalk from 'chalk';
import { config } from './config.js';
import {
    amendCommit,
    commitEjection,
    isGitHistoryClean,
    isGitInstalled,
} from './git.js';
import { errorLog, infoLog, warnLog } from './log.js';
import {
    copyDependency,
    dependencyManagerAction,
    detectPackageManager,
    updatePackageJson,
} from './system.js';
import { execSync } from 'child_process';

export function eject(
    dependency: string,
    options: { force: boolean; verbose: boolean },
) {
    if (options.verbose) {
        console.log({
            dependency,
            options,
            isCI: process.env.GITHUB_ACTIONS,
        });
    }

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
    let successfulEjected = false;
    try {
        copyDependency(dependency);
        successfulEjected = true;
    } catch (error) {
        if (options.verbose) {
            errorLog('Error ejecting dependency:', dependency);
            console.error(error);
        }
    }

    if (successfulEjected) {
        console.log('✅ Ejected dependencies:', chalk.bold(dependency));
    } else {
        console.log('❌ Ejected dependencies: ', chalk.bold(dependency));
        return 150;
    }
    const { packageManager, lockFile } = detectPackageManager();
    updatePackageJson(dependency, packageManager === 'pnpm' ? 'link' : 'file');
    commitEjection(config.COMMIT_MESSAGE);
    const needsToCommit = dependencyManagerAction(packageManager);
    if (needsToCommit) amendCommit();
    let installCmd = `${packageManager} install`;
    if (process.env.GITHUB_ACTIONS && packageManager === 'pnpm') {
        installCmd = 'pnpm install --no-frozen-lockfile';
    }
    const installLog = chalk.bold(installCmd);
    console.log(`📦 Running ${installLog} to update ${chalk.bold(lockFile)}`);
    execSync(installCmd, { stdio: 'inherit' });
    console.log(`✅ ${installLog} done`);
    amendCommit();
    console.log(
        '➡️  Run',
        chalk.bold('git show HEAD'),
        'to see the ejected code',
    );
}
