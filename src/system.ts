import { resolve } from 'path';
import fs from 'fs';
import assert from 'assert';
import { parse, stringify } from 'yaml';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { amendCommit } from './git.js';

export function getDependencyPath(
    dependency: string,
    dependencyDir = './node_modules',
) {
    return resolve(dependencyDir, dependency);
}

export function downloadSource(dependency: string) {
    // locate the dependency in node_modules
    // if (!fs.existsSync('./ejected/tmp')) {
    //     fs.mkdirSync('./ejected/tmp', { recursive: true });
    // }
    // const outStream = fs.createWriteStream(downloadPath, { flags: 'w' });
    // console.log('Downloading...');
    // const response = await fetch(repoUrl);
    // if (!response.ok) {
    //     throw new Error('Failed to download source code');
    // }
    // const stream = response.body;
    // if (!stream) {
    //     throw new Error('Failed to get response body');
    // }
    // // @ts-ignore
    // await finished(Readable.fromWeb(stream).pipe(outStream));
    // download the source code
    // extract the source code
    // copy the source code to ejected/dependency
    // update the package.json
    // commit the changes
    // install the dependency
}

export function updatePackageJson(
    ejectedDependency: string,
    protocol: string = 'file',
) {
    const packageJson = JSON.parse(
        fs.readFileSync(resolve('./package.json'), 'utf-8'),
    );
    packageJson['devDependencies'] = setPathAsVersion(
        packageJson['devDependencies'],
        ejectedDependency,
        protocol,
    );
    packageJson['dependencies'] = setPathAsVersion(
        packageJson['dependencies'],
        ejectedDependency,
        protocol,
    );
    fs.writeFileSync(
        resolve('./package.json'),
        JSON.stringify(packageJson, null, 2),
    );
    return true;
}

function setPathAsVersion(
    dependencies: Record<string, string>,
    ejectedDependency: string,
    protocol: string = 'file',
) {
    const updatedDependencies: Record<string, string> = {};
    for (const key in dependencies) {
        if (ejectedDependency !== key) {
            updatedDependencies[key] = dependencies[key] as string;
        } else {
            updatedDependencies[key] = `${protocol}:./ejected/${key}`;
        }
    }
    return updatedDependencies;
}

export function copyDependency(dependency: string) {
    const dependencyPath = getDependencyPath(dependency);
    if (!fs.existsSync(dependencyPath)) {
        throw new Error('Dependency not found in node_modules');
    }

    if (!fs.existsSync('./ejected')) {
        fs.mkdirSync('./ejected');
    }
    if (fs.existsSync(resolve('./ejected', dependency))) {
        throw new Error('Dependency already ejected');
    }

    fs.cpSync(dependencyPath, resolve('./ejected', dependency), {
        recursive: true,
        force: true,
        dereference: true,
    });
}

export function detectPackageManager(
    currentDir: string = './',
    depth: number = 0,
) {
    if (depth > 20) {
        throw new Error('No lock file found');
    }

    // scan for lock files
    const lockFiles = [
        'yarn.lock',
        'package-lock.json',
        'pnpm-lock.yaml',
        'bun.lock',
    ];

    const foundLockFiles = lockFiles.filter((lockFile) =>
        fs.existsSync(resolve(currentDir, lockFile)),
    );

    if (foundLockFiles.length === 0) {
        return detectPackageManager(resolve(currentDir, '..'), depth + 1);
    }

    if (foundLockFiles.length > 1) {
        throw new Error('Multiple lock files found');
    }

    const lockFile = foundLockFiles[0] as string;
    let packageManager: string | undefined;
    if (lockFile === 'yarn.lock') {
        packageManager = 'yarn';
    } else if (lockFile === 'package-lock.json') {
        packageManager = 'npm';
    } else if (lockFile === 'pnpm-lock.yaml') {
        packageManager = 'pnpm';
    } else if (lockFile === 'bun.lock') {
        packageManager = 'bun';
    }
    assert(packageManager);
    return { packageManager, lockFilePath: lockFile };
}

function detectWorkspaceFile(currentDir: string = './', depth: number = 0) {
    if (depth > 20) {
        return undefined;
    }

    const workspaceFiles = ['pnpm-workspace.yaml', 'yarn-workspace.json'];

    const foundWorkspaceFiles = workspaceFiles.filter((workspaceFile) =>
        fs.existsSync(resolve(currentDir, workspaceFile)),
    );

    if (foundWorkspaceFiles.length === 0) {
        return detectWorkspaceFile(resolve(currentDir, '..'), depth + 1);
    }

    if (foundWorkspaceFiles.length > 1) {
        throw new Error('Multiple workspace files found');
    }

    return foundWorkspaceFiles[0];
}

function pnpm() {
    const workspaceFile = detectWorkspaceFile();
    if (!workspaceFile) {
        fs.writeFileSync(
            './pnpm-workspace.yaml',
            stringify({ packages: [`ejected/*`] }),
        );
        return true;
    } else {
        const workspace = parse(
            fs.readFileSync(resolve('./', workspaceFile), 'utf-8'),
        );
        if (workspace.packages.includes('ejected/*')) return false;
        workspace.packages.push('ejected/*');
        fs.writeFileSync(resolve('./', workspaceFile), stringify(workspace));
        return true;
    }
}

const action = {
    pnpm,
};

export function dependencyManagerAction(packageManager: string) {
    if (packageManager in action) {
        return action[packageManager as keyof typeof action]();
    }

    return false;
}

export function install(packageManager: string, lockFilePath: string) {
    let installCmd = `${packageManager} install`;
    if (process.env.GITHUB_ACTIONS && packageManager === 'pnpm') {
        installCmd = 'pnpm install --no-frozen-lockfile';
    }
    const installLog = chalk.bold(installCmd);
    console.log(
        `📦 Running ${installLog} to update ${chalk.bold(lockFilePath)}`,
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
