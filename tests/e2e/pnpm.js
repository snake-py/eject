// read command line arguments
import assert from 'assert';
import fs from 'fs';
import { resolve } from 'path';
import { parse } from 'yaml';

const args = process.argv.slice(2);
const dependency = args[0];
const testProjectPath = args[1];

assert(
    fs.existsSync(resolve(testProjectPath, 'pnpm-workspace.yaml')),
    'pnpm-workspace.yaml does not exist',
);
const workspace = parse(
    fs.readFileSync(resolve(testProjectPath, 'pnpm-workspace.yaml'), 'utf-8'),
);
console.log(workspace);
assert(workspace.packages.includes(`ejected/*`), 'No ejected workspace found');
