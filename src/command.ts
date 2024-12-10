import chalk from 'chalk';
import { config } from './staticConfig.js';
import {
    getParsedDependencyConfigs,
    getPartialEjections,
    TDependencyEjectionConfig,
} from './config.js';
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
    downloadSource,
    getDependencyPath,
    install,
    updatePackageJson,
} from './system.js';
import type { TCommandOptions } from './types.js';
import { exit } from 'process';
import { exitCodes } from './exits.js';

export function resolveCommand(
    dependency: string,
    partial: string | undefined,
    options: TCommandOptions,
) {
    console.log('\n');
    if (options.verbose) {
        console.log({
            dependency,
            options,
            isCI: process.env.GITHUB_ACTIONS,
        });
    }
    prerequisitesMet(options);

    const dependencyPath = getDependencyPath(dependency);
    if (options.list) {
        const configs = getPartialEjections(dependency, dependencyPath);
        infoLog('Available partial ejections for', dependency, '\n');
        for (const config of configs) {
            console.log('   -', chalk.bold(config));
        }
        console.log(
            `\nUse`,
            chalk.bold(`npx eject ${dependency} <partial>`),
            `to eject a specific partial \n`,
        );
        return;
    }

    if (options.noSource) {
        eject(dependency, options);
        return;
    }

    const configs = getParsedDependencyConfigs(dependency, dependencyPath);
    console.log({ configs });
    ejectSource(dependency, options, configs);

    // if (partial) {
    //     ejectSourcePartially(dependency, partial, options);
    // } else {
    // }
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

/**
 * This ejection function is used to eject a dependency from node_modules and then use the package manager to install it as a local dependency.
 * @param dependency
 * @param options
 * @returns
 */
function eject(dependency: string, options: TCommandOptions) {
    try {
        copyDependency(dependency);
        console.log('✅ Ejected dependencies:', chalk.bold(dependency));
    } catch (error) {
        if (options.verbose) {
            errorLog('Error ejecting dependency:', dependency);
            console.error(error);
        }
        console.log('❌ Ejected dependencies: ', chalk.bold(dependency));
        return exitCodes.EJECTION_FAILED;
    }

    const { packageManager, lockFilePath } = detectPackageManager();
    updatePackageJson(dependency, packageManager === 'pnpm' ? 'link' : 'file');
    commitEjection(config.COMMIT_MESSAGE);

    // some package managers require custom actions after ejecting
    const needsToCommit = dependencyManagerAction(packageManager);
    if (needsToCommit) amendCommit();

    install(packageManager, lockFilePath);
}

export function ejectSource(
    dependency: string,
    options: TCommandOptions,
    configs: TDependencyEjectionConfig,
) {
    // download the source code
    const downloadPath = downloadSource(dependency, configs.source);
    // extract the source code
    // copy the source code to ejected/dependency
    // update the package.json
    // commit the changes
    // install the dependency
}

export function ejectSourcePartially(
    dependency: string,
    partial: string,
    options: TCommandOptions,
) {}
