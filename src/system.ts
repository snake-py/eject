import { resolve } from 'path';
import fs from 'fs';
import assert from 'assert';

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
    const dependencyPath = resolve('./node_modules', dependency);
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
    return { packageManager, lockFile };
}
