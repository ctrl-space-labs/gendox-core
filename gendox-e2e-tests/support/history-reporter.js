const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

/**
 * Playwright keeps only the last run. This reporter keeps the history, in test-history/:
 *
 *   STATUS.md      every test with its tags, last result, last run and last pass
 *   runs.jsonl     one line per run: time, branch, commit, command, counts
 *   <run>/         for a run with failures: failures.md, each failed test's trace and
 *                  screenshot, and the API log for the time of the run
 *
 * It ends the terminal output with one summary line and the failures, so an agent
 * reads a few lines instead of the whole log.
 */
const e2eDir = path.resolve(__dirname, '..');
const historyDir = path.join(e2eDir, 'test-history');
const statusFile = path.join(historyDir, 'status.json');
const runsFile = path.join(historyDir, 'runs.jsonl');
const composeDir = path.resolve(e2eDir, '../gendox-compose-scripts/ephemeral');

// Folders of failed runs kept. Older ones are removed when a new one is written.
const KEPT_FAILED_RUNS = 30;

const stripAnsi = (text) => (text || '').replace(/\u001b\[[0-9;]*[A-Za-z]/g, '');
const keyOf = (titlePath) => titlePath.filter(Boolean).join(' › ');
const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(-80);
const git = (...args) => {
    try {
        return execFileSync('git', args, { cwd: e2eDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    } catch {
        return '';
    }
};
const readJson = (file, fallback) => {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
        return fallback;
    }
};

class HistoryReporter {
    onBegin(config, suite) {
        this.startedAt = new Date();
        this.run = this.startedAt.toISOString().replace(/\.\d+Z$/, '').replace(/:/g, '-');
        this.results = new Map();
        this.planned = suite.allTests().length;
    }

    onTestEnd(test, result) {
        // With retries, the last attempt is the one that counts.
        this.results.set(test.id, { test, result });
    }

    async onEnd(fullResult) {
        if (!this.results || this.results.size === 0) return;
        fs.mkdirSync(historyDir, { recursive: true });

        const finishedAt = new Date();
        const counts = { passed: 0, failed: 0, flaky: 0, skipped: 0 };
        const failures = [];
        const status = readJson(statusFile, {});

        for (const { test, result } of this.results.values()) {
            const key = keyOf(test.titlePath());
            const outcome = test.outcome(); // expected, unexpected, flaky, skipped
            const label = { expected: 'passed', unexpected: 'failed', flaky: 'flaky', skipped: 'skipped' }[outcome];
            counts[label] += 1;

            const entry = status[key] || {};
            entry.tags = test.tags;
            entry.location = `${path.relative(e2eDir, test.location.file)}:${test.location.line}`;
            if (label !== 'skipped') {
                entry.lastResult = label;
                entry.lastRun = this.startedAt.toISOString();
                entry.lastRunId = this.run;
                if (label === 'failed') {
                    entry.failingRuns = (entry.failingRuns || 0) + 1;
                } else {
                    entry.failingRuns = 0;
                    entry.lastPassed = this.startedAt.toISOString();
                }
            }
            status[key] = entry;
            if (label === 'failed') failures.push({ key, test, result });
        }

        const runDir = path.join(historyDir, this.run);
        if (failures.length > 0) {
            this.writeFailures(runDir, failures, finishedAt);
            this.dropOldRuns();
        }

        const summary = {
            run: this.run,
            startedAt: this.startedAt.toISOString(),
            durationSeconds: Math.round((finishedAt - this.startedAt) / 1000),
            branch: git('rev-parse', '--abbrev-ref', 'HEAD'),
            commit: git('rev-parse', '--short', 'HEAD'),
            uncommittedChanges: git('status', '--porcelain') !== '',
            command: process.argv.slice(2).join(' '),
            status: fullResult.status,
            ...counts,
            failures: failures.map(failure => failure.key),
        };
        fs.appendFileSync(runsFile, JSON.stringify(summary) + '\n');

        this.forgetRemovedTests(status);
        fs.writeFileSync(statusFile, JSON.stringify(status, null, 2) + '\n');
        this.writeStatusPage(status);

        const relative = (file) => path.relative(process.cwd(), file);
        console.log(`\n[e2e] ${counts.failed} failed, ${counts.passed} passed, ${counts.flaky} flaky, ` +
            `${counts.skipped} skipped in ${summary.durationSeconds}s`);
        for (const { key, result } of failures) {
            console.log(`[e2e] FAILED ${key}`);
            console.log(`        ${stripAnsi(result.error?.message).split('\n')[0]}`);
        }
        if (failures.length > 0) {
            console.log(`[e2e] Details, traces and the API log: ${relative(path.join(runDir, 'failures.md'))}`);
        }
        console.log(`[e2e] Every test's last result: ${relative(path.join(historyDir, 'STATUS.md'))}`);
    }

    writeFailures(runDir, failures, finishedAt) {
        fs.mkdirSync(runDir, { recursive: true });
        const lines = [`# Failures of run ${this.run}`, ''];

        for (const { key, test, result } of failures) {
            lines.push(`## ${key}`, '');
            lines.push(`- Location: \`${path.relative(e2eDir, test.location.file)}:${test.location.line}\``);
            lines.push(`- Status: ${result.status} after ${Math.round(result.duration / 1000)}s`);
            for (const annotation of test.annotations.filter(a => a.type === 'kept organization')) {
                lines.push(`- Organization kept for inspection: \`${annotation.description}\``);
            }

            const kept = path.join(runDir, slug(key));
            for (const attachment of result.attachments) {
                if (!attachment.path || !fs.existsSync(attachment.path)) continue;
                fs.mkdirSync(kept, { recursive: true });
                const copy = path.join(kept, path.basename(attachment.path));
                fs.copyFileSync(attachment.path, copy);
                const hint = attachment.name === 'trace'
                    ? ` (open with \`npx playwright show-trace ${path.relative(e2eDir, copy)}\`)` : '';
                lines.push(`- ${attachment.name}: \`${path.relative(e2eDir, copy)}\`${hint}`);
            }

            lines.push('', '```', stripAnsi(result.error?.stack || result.error?.message || 'No error message')
                .split('\n').slice(0, 40).join('\n'), '```', '');

            const steps = result.steps.filter(step => step.category !== 'hook' || step.error);
            if (steps.length > 0) {
                lines.push('Last steps:', '');
                for (const step of steps.slice(-12)) {
                    lines.push(`- ${step.error ? 'FAILED ' : ''}${stripAnsi(step.title)}`);
                }
                lines.push('');
            }
        }

        const apiLog = this.apiLog(finishedAt);
        if (apiLog) {
            fs.writeFileSync(path.join(runDir, 'api.log'), apiLog);
            lines.push('## API log', '', `The API's output during this run: \`${path.relative(e2eDir, path.join(runDir, 'api.log'))}\``, '');
        }
        fs.writeFileSync(path.join(runDir, 'failures.md'), lines.join('\n'));
    }

    apiLog(finishedAt) {
        if (!fs.existsSync(path.join(composeDir, '.env'))) return '';
        try {
            return execFileSync('docker', ['compose', 'logs', 'api', '--no-color', '--no-log-prefix',
                '--since', this.startedAt.toISOString(), '--until', finishedAt.toISOString()],
                { cwd: composeDir, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 })
                .toString().split('\n').slice(-3000).join('\n');
        } catch {
            return '';
        }
    }

    dropOldRuns() {
        const runs = fs.readdirSync(historyDir, { withFileTypes: true })
            .filter(entry => entry.isDirectory() && /^\d{4}-\d{2}-\d{2}T/.test(entry.name))
            .map(entry => entry.name).sort();
        for (const old of runs.slice(0, Math.max(0, runs.length - KEPT_FAILED_RUNS))) {
            fs.rmSync(path.join(historyDir, old), { recursive: true, force: true });
        }
    }

    // A filtered run sees only its own tests. Ask Playwright for all of them, so the
    // status page lists tests that never ran and drops tests that no longer exist.
    forgetRemovedTests(status) {
        let listed;
        try {
            const cli = require.resolve('@playwright/test/cli');
            listed = JSON.parse(execFileSync(process.execPath, [cli, 'test', '--list', '--reporter=json'],
                { cwd: e2eDir, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }).toString());
        } catch {
            return;
        }
        const existing = new Map();
        const walk = (suite, describes) => {
            for (const spec of suite.specs || []) {
                for (const test of spec.tests || []) {
                    existing.set(keyOf([test.projectName, spec.file, ...describes, spec.title]),
                        { tags: (spec.tags || []).map(tag => (tag.startsWith('@') ? tag : `@${tag}`)), location: `tests/${spec.file}:${spec.line}` });
                }
            }
            for (const child of suite.suites || []) walk(child, [...describes, child.title]);
        };
        for (const file of listed.suites || []) walk(file, []);
        if (existing.size === 0) return;

        for (const key of Object.keys(status)) {
            if (!existing.has(key)) delete status[key];
        }
        for (const [key, known] of existing) {
            if (!status[key]) status[key] = known;
        }
    }

    writeStatusPage(status) {
        const day = (iso) => (iso ? iso.replace('T', ' ').slice(0, 16) : 'never');
        const rank = (entry) => ({ failed: 0, flaky: 1, undefined: 2, passed: 3 }[entry.lastResult] ?? 2);
        const keys = Object.keys(status).sort((a, b) => rank(status[a]) - rank(status[b]) || a.localeCompare(b));
        const count = (result) => keys.filter(key => status[key].lastResult === result).length;

        const lines = [
            '# Test status',
            '',
            'Written by `support/history-reporter.js` after every run. Times are UTC.',
            '',
            `${keys.length} tests: ${count('passed')} passed, ${count('failed')} failed, ${count('flaky')} flaky, ` +
            `${keys.filter(key => !status[key].lastResult).length} never ran.`,
            '',
            '| Test | Tags | Last result | Last run | Last passed | Failing runs in a row |',
            '|---|---|---|---|---|---|',
        ];
        for (const key of keys) {
            const entry = status[key];
            lines.push(`| ${key.replace(/\|/g, '\\|')} | ${(entry.tags || []).join(' ')} | ` +
                `${entry.lastResult ? entry.lastResult.toUpperCase() : 'not run'} | ${day(entry.lastRun)} | ` +
                `${day(entry.lastPassed)} | ${entry.failingRuns || ''} |`);
        }

        const runs = fs.readFileSync(runsFile, 'utf8').trim().split('\n').slice(-15).reverse().map(line => JSON.parse(line));
        lines.push('', '## Recent runs', '',
            '| Run | Branch | Commit | Command | Failed | Passed | Skipped | Seconds |', '|---|---|---|---|---|---|---|---|');
        for (const run of runs) {
            const details = fs.existsSync(path.join(historyDir, run.run, 'failures.md'));
            lines.push(`| ${details ? `[${run.run}](${run.run}/failures.md)` : run.run} | ${run.branch} | ` +
                `${run.commit}${run.uncommittedChanges ? ' + changes' : ''} | \`${run.command || 'test'}\` | ` +
                `${run.failed} | ${run.passed} | ${run.skipped} | ${run.durationSeconds} |`);
        }
        fs.writeFileSync(path.join(historyDir, 'STATUS.md'), lines.join('\n') + '\n');
    }
}

module.exports = HistoryReporter;
