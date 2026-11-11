const { test, expect } = require('../../support/workspace');
const { call, ok, json, projectPath } = require('../../support/domain');
const projectUsers = require('../../page-objects/apis/projectUsers');
const seed = require('../../page-objects/apis/seed');

test.describe('Organization role matrix', { tag: '@p1' }, () => {
    test.use({ workspaceOptions: { members: { testUser2: 'ROLE_ADMIN', testUser3: 'ROLE_EDITOR', testUser4: 'ROLE_READER' } } });
    for (const [user, canWrite] of [['testUser2', true], ['testUser3', true], ['testUser4', false]]) {
        test(`${user} reads project and ${canWrite ? 'can' : 'cannot'} update its description`, async ({ api, workspace: w }) => {
            const project = await json(await call(api, w, 'get', projectPath(w), undefined, w.tokens[user]));
            const updated = await call(api, w, 'put', projectPath(w), { ...project, description: 'Role matrix update' }, w.tokens[user]);
            if (canWrite) {
                await ok(updated);
                expect((await json(await call(api, w, 'get', projectPath(w)))).description).toBe('Role matrix update');
            } else {
                // Same resource and payload are writable by the owner, so a bad route cannot make this pass.
                await ok(await call(api, w, 'put', projectPath(w), project));
                expect(updated.status()).toBe(404);
                expect((await json(await call(api, w, 'get', projectPath(w)))).description).toBe(project.description);
            }
        });
    }
    test('project membership removal revokes the reader after refreshing their profile', async ({ api, workspace: w }) => {
        await ok(await call(api, w, 'get', projectPath(w), undefined, w.tokens.testUser4));
        await ok(await projectUsers.deleteProjectMember(api, w.ownerToken, w.organizationId, w.projectId, seed.testUser4));
        await ok(await call(api, w, 'delete', '/profile/caches', undefined, w.tokens.testUser4));
        expect((await call(api, w, 'get', projectPath(w), undefined, w.tokens.testUser4)).status()).toBe(404);
    });
});

test.describe('Role transitions', { tag: '@p1' }, () => {
    test.use({ workspaceOptions: { members: { testUser4: 'ROLE_READER' } } });
    test('promoting a reader enables project editing and demoting them revokes it', async ({ api, workspace: w }) => {
        const path = `/organizations/${w.organizationId}/users/${seed.testUser4}/roles`;
        await ok(await call(api, w, 'put', path, { roleName: 'ROLE_EDITOR' }));
        await ok(await call(api, w, 'delete', '/profile/caches', undefined, w.tokens.testUser4));
        const project = await json(await call(api, w, 'get', projectPath(w)));
        await ok(await call(api, w, 'put', projectPath(w), { ...project, description: 'Promoted member edit' }, w.tokens.testUser4));
        await ok(await call(api, w, 'put', path, { roleName: 'ROLE_READER' }));
        await ok(await call(api, w, 'delete', '/profile/caches', undefined, w.tokens.testUser4));
        expect((await call(api, w, 'put', projectPath(w), { ...project, description: 'Demoted member edit' }, w.tokens.testUser4)).status()).toBe(404);
        expect((await json(await call(api, w, 'get', projectPath(w)))).description).toBe('Promoted member edit');
    });
});
