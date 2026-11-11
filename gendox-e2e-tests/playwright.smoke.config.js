// The budget includes global setup and real browser logins; builds/stack boot happen before it.
const { defineConfig } = require('@playwright/test');
const config = require('./playwright.config');

module.exports = defineConfig({
    ...config,
    grep: /@smoke/,
    // Configuration-level grep also applies to dependencies; always include real logins.
    projects: config.projects.map(project => project.name === 'setup' ? { ...project, grep: /.*/ } : project),
    globalTimeout: 60_000,
    timeout: 40_000,
    expect: { timeout: 10_000 },
    retries: 0,
    use: { ...config.use, actionTimeout: 15_000, navigationTimeout: 15_000 },
});
