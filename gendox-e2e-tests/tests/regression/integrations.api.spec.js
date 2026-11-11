const { test, expect } = require('../../support/workspace');
const { call, ok, json, orgPath } = require('../../support/domain');

test.describe('Integration configuration', { tag: '@p2' }, () => {
    for (const type of ['GIT_INTEGRATION', 'AWS_S3_INTEGRATION']) {
        test(`${type}: configure an inactive source, change schedule and remove it`, async ({ api, workspace: w }) => {
            const path = `${orgPath(w)}/integrations`;
            // Inactive by design: configuration checks must not contact an external repository/bucket.
            const integration = await json(await call(api, w, 'post', path, { type, projectId: w.projectId, active: false, runIntervalMinutes: 60, url: type === 'GIT_INTEGRATION' ? 'https://example.invalid/e2e.git' : 's3://e2e-local-fixture', repoHead: 'main', directoryPath: '' }));
            expect(integration.active).toBe(false);
            await ok(await call(api, w, 'put', `${path}/${integration.id}/schedule`, { runIntervalMinutes: 120 }));
            const stored = await json(await call(api, w, 'get', `${path}/${integration.id}`));
            expect(stored.runIntervalMinutes).toBe(120);
            await ok(await call(api, w, 'delete', `${path}/${integration.id}`));
            const list = await json(await call(api, w, 'get', `/integrations?organizationId=${w.organizationId}`));
            expect(list.content.map(i => i.id)).not.toContain(integration.id);
        });
    }
    test('missing project and unsupported integration type are rejected', async ({ api, workspace: w }) => {
        const path = `${orgPath(w)}/integrations`;
        expect((await call(api, w, 'post', path, { type: 'GIT_INTEGRATION' })).status()).toBe(400);
        expect((await call(api, w, 'post', path, { type: 'UNKNOWN_TEST_TYPE', projectId: w.projectId, active: false })).status()).toBe(400);
    });

    test('web scrape budget and initial source list are available', async ({ api, workspace: w }) => {
        expect(await json(await call(api, w, 'get', `${orgPath(w)}/websites`))).toEqual([]);
        const budget = await json(await call(api, w, 'get', `${orgPath(w)}/web-scrape/budget`));
        expect(budget).toBeTruthy();
    });
});

test('website configuration can be created, renamed and removed without contacting an upstream', { tag: '@p2' }, async ({ api, workspace: w }) => {
    const path = `${orgPath(w)}/websites`;
    const site = await json(await call(api, w, 'post', path, { name: 'E2E website', url: 'https://example.invalid' }));
    expect(site.id).toBeTruthy();
    await ok(await call(api, w, 'put', `${path}/${site.id}`, { name: 'Renamed website', url: site.url }));
    expect((await json(await call(api, w, 'get', path))).find(s => s.id === site.id).name).toBe('Renamed website');
    await ok(await call(api, w, 'delete', `${path}/${site.id}`));
    expect(await json(await call(api, w, 'get', path))).toEqual([]);
});

test('scraping budget reports a consistent remaining allowance without contacting a provider', { tag: '@p2' }, async ({ api, workspace: w }) => {
    const budget = await json(await call(api, w, 'get', `${orgPath(w)}/web-scrape/budget`));
    expect(budget.usedPages).toBeGreaterThanOrEqual(0);
    if (budget.maxPages !== null) {
        expect(budget.remainingPages).toBe(Math.max(0, budget.maxPages - budget.usedPages));
    } else {
        expect(budget.remainingPages).toBeNull();
    }
});
