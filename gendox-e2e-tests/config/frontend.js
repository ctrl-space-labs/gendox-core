const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../..');
const version = process.env.E2E_FRONTEND || (fs.existsSync(path.join(repoRoot, 'gendox-frontend-v2')) ? 'v2' : 'v1');
if (!['v1', 'v2'].includes(version)) throw new Error('E2E_FRONTEND must be v1 or v2');
const directory = version === 'v2' ? 'gendox-frontend-v2' : 'gendox-frontend';
if (!fs.existsSync(path.join(repoRoot, directory))) throw new Error(`Frontend ${version} is not present in this checkout`);

module.exports = { version, directory, root: path.join(repoRoot, directory) };
