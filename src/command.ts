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
import type { TCommandOptions } from './types.js';
import { exit } from 'process';
import { exitCodes } from './exits.js';

export function resolveCommand(
    dependency: string,
    partial: string | undefined,
    options: TCommandOptions,
) {
    if (options.verbose) {
        console.log({
            dependency,
            options,
            isCI: process.env.GITHUB_ACTIONS,
        });
    }
    prerequisitesMet(options);

    if (options.list) {
        infoLog('Listing dependencies');
        return;
    }

    if (options.noSource) {
        eject(dependency, options);
        return;
    }

    if (partial) {
        ejectSourcePartially(dependency, partial, options);
    } else {
        ejectSource(dependency, options);
    }
}

function prerequisitesMet(options: TCommandOptions) {
    if (!options.force && !isGitInstalled()) {
        warnLog(
            'Git is not installed, please install git or use --force to bypass git check',
        );
        exit(exitCodes.GIT_NOT_INSTALLED);
    }
    if (!options.force && !isGitHistoryClean()) {
        warnLog(
            'Please commit your changes before ejecting dependencies or use --force to bypass git history',
        );
        exit(exitCodes.GIT_HISTORY_NOT_CLEAN);
    }
}

function eject(dependency: string, options: TCommandOptions) {
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

export function ejectSource(dependency: string, options: TCommandOptions) {}

export function ejectSourcePartially(
    dependency: string,
    partial: string,
    options: TCommandOptions,
) {}
