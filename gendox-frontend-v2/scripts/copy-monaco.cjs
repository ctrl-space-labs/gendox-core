// Copies Monaco's files into public/monaco/vs, so the editor loads from the app's own origin and
// never from a CDN. The desktop app's Content Security Policy then needs no third-party script host.
// Runs before `yarn dev` and `yarn build`; the copy is not committed (see .gitignore).
const fs = require('fs')
const path = require('path')

const source = path.join(path.dirname(require.resolve('monaco-editor/package.json')), 'min', 'vs')
const target = path.join(__dirname, '..', 'public', 'monaco', 'vs')

fs.rmSync(target, { recursive: true, force: true })
fs.cpSync(source, target, { recursive: true })
