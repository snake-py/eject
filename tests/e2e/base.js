// read command line arguments
import assert from 'assert';
import fs from 'fs';
import { resolve } from 'path';
const args = process.argv.slice(2);
const dependency = args[0];
const testProjectPath = args[1];
const dependencyManager = args[2] ?? 'npm';

assert(fs.existsSync(testProjectPath), 'testProjectPath does not exist');
assert(
    fs.existsSync(resolve(testProjectPath, 'ejected')),
    'No ejected folder found',
);
assert(
    fs.existsSync(resolve(testProjectPath, 'ejected', dependency)),
    'No ejection found for dependency',
);

const packageJson = JSON.parse(
    fs.readFileSync(resolve(testProjectPath, 'package.json'), 'utf8'),
);

assert(
    packageJson.dependencies[dependency].includes(
        dependencyManager === 'pnpm'
            ? 'link:./ejected/' + dependency
            : 'file:./ejected/' + dependency,
    ),
    'Dependency is not properly ejected',
);
