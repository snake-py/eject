import { execSync } from 'child_process';

export function commitEjection(commitMessage: string = 'Eject dependencies') {
    execSync('git add .');
    execSync(`git commit -m "${commitMessage}"`);
}

export function amendCommit() {
    execSync('git add .');
    execSync(`git commit --amend --no-edit`);
}

export function isGitInstalled() {
    try {
        execSync('git --version');
        return true;
    } catch (error) {
        return false;
    }
}

export function isGitHistoryClean() {
    try {
        execSync('git diff --exit-code');
        return true;
    } catch (error) {
        return false;
    }
}
