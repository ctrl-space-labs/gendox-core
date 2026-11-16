const { test, expect, ensureAccess } = require('../../support/workspace');
const { call, ok, json, orgPath, projectPath } = require('../../support/domain');
const config = require('../../tests.config');
const organizations = require('../../page-objects/apis/organizations');
const { own } = require('../../support/guard');

// API keys are returned masked, as "****" and the last four characters. Creating a key
// and revealing one are the only answers that hold the key in full.
const masked = key => `****${key.slice(-4)}`;

test.describe('API key reveal', { tag: '@p2' }, () => {
    test('a key is in full when created and revealed, and masked in the list', async ({ api, workspace: w }) => {
        const created = await json(await call(api, w, 'post', `${orgPath(w)}/api-keys`, { name: 'Reveal key', durationInDays: 1 }));
        expect(created.apiKey).toMatch(/^gxsk-[0-9a-f]{64}$/);

        const listed = (await json(await call(api, w, 'get', `${orgPath(w)}/api-keys`))).find(k => k.id === created.id);
        expect(listed.apiKey).toBe(masked(created.apiKey));

        const revealed = await json(await call(api, w, 'post', `${orgPath(w)}/api-keys/${created.id}/reveal`));
        expect(revealed.apiKey).toBe(created.apiKey);

        // the revealed key is the one that authenticates
        await ok(await api.get(`${config.gendox.contextPath}${projectPath(w)}`, { headers: { 'x-api-key': revealed.apiKey } }));

        // renaming returns the key masked, and does not change it
        const renamed = await json(await call(api, w, 'put', `${orgPath(w)}/api-keys/${created.id}`, { name: 'Reveal key renamed' }));
        expect(renamed.apiKey).toBe(masked(created.apiKey));
        expect((await json(await call(api, w, 'post', `${orgPath(w)}/api-keys/${created.id}/reveal`))).apiKey).toBe(created.apiKey);
    });

    for (const [role, canReveal] of [['ROLE_ADMIN', true], ['ROLE_EDITOR', false], ['ROLE_READER', false]]) {
        test.describe(role, () => {
            test.use({ workspaceOptions: { members: { testUser3: role } } });
            test(`${role} ${canReveal ? 'can' : 'cannot'} reveal a key`, async ({ api, workspace: w }) => {
                const created = await json(await call(api, w, 'post', `${orgPath(w)}/api-keys`, { name: 'Permission key', durationInDays: 1 }));
                const path = `${orgPath(w)}/api-keys/${created.id}/reveal`;
                const response = await call(api, w, 'post', path, undefined, w.tokens.testUser3);
                if (canReveal) {
                    expect((await json(response)).apiKey).toBe(created.apiKey);
                } else {
                    // the owner reveals the same key on the same route, so a wrong route cannot make this pass
                    expect((await json(await call(api, w, 'post', path))).apiKey).toBe(created.apiKey);
                    expect(response.status()).toBe(404);
                    expect(await response.text()).not.toContain(created.apiKey);
                }
            });
        });
    }

    test('a key of another organization cannot be revealed through this one', async ({ api, workspace: w }) => {
        const created = await json(await call(api, w, 'post', `${orgPath(w)}/api-keys`, { name: 'Other key', durationInDays: 1 }));
        // the same owner administers a second organization; the key is looked up in the organization of the path
        const name = `${w.name} other`;
        const other = await json(await organizations.createOrganization(api, w.ownerToken, { name, displayName: name }));
        own(other.id);
        try {
            await ensureAccess(api, w.ownerToken, other.id);
            const response = await call(api, w, 'post', `/organizations/${other.id}/api-keys/${created.id}/reveal`);
            expect(response.ok()).toBe(false);
            expect(await response.text()).not.toContain(created.apiKey);
        } finally {
            await organizations.deactivateOrganization(api, w.ownerToken, other.id);
        }
    });
});
