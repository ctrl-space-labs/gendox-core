// The budget includes global setup and real browser logins; builds/stack boot happen before it.
// Locally the whole run has 60 seconds. A deployed environment answers over the network,
// and real models answer slowly, so it has E2E_GLOBAL_TIMEOUT seconds (default 15 minutes).
const { defineConfig } = require('@playwright/test');
const config = require('./playwright.config');
const target = require('./config/target');

const globalTimeout = process.env.E2E_GLOBAL_TIMEOUT
    ? Number(process.env.E2E_GLOBAL_TIMEOUT) * 1000
    : (target.deployed || target.realModels ? 15 * 60_000 : 60_000);

module.exports = defineConfig({
    ...config,
    grep: /@smoke/,
    // Configuration-level grep also applies to dependencies; always include real logins.
    webServer: undefined,
    projects: config.projects.filter(project => project.name !== 'streaming-contract').map(project => project.name === 'setup' ? { ...project, grep: /.*/ } : project),
    globalTimeout,
    timeout: target.deployed ? config.timeout : 40_000,
    expect: target.deployed ? config.expect : { timeout: 10_000 },
    retries: 0,
    use: target.deployed ? config.use : { ...config.use, actionTimeout: 15_000, navigationTimeout: 15_000 },
});
