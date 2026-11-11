const { test, expect, tokenFor } = require('../../support/workspace');
const config = require('../../tests.config');
const { expectOk, textFile } = require('../../support/app');
const users = require('../../page-objects/apis/users');
const projects = require('../../page-objects/apis/projects');
const documents = require('../../page-objects/apis/documents');
const embeddings = require('../../page-objects/apis/embeddings');
const embeddingsProject = require('../../page-objects/apis/embeddingsProject');
const seed = require('../../page-objects/apis/seed');

// No sharedWorkspace or serial groups: every case can run alone, in any worker or shard.
test.describe('API smoke', { tag: '@smoke' }, () => {
    test('health: the application and database are ready', async ({ api }) => {
        const response = await api.get(`${config.gendox.contextPath}/actuator/health`);
        await expectOk(response);
        expect((await response.json()).status).toBe('UP');
    });

    for (const name of ['testUser1', 'testUser2', 'testUser3', 'testUser4']) {
        test(`identity: ${name} can authenticate and load their own profile`, async ({ api }) => {
            const response = await users.getUserProfile(api, await tokenFor(api, name));
            await expectOk(response);
            expect(await response.json()).toMatchObject({ id: seed[name], email: config.gendox.users[name].username });
        });
    }

    test('project access: a member can read and an outsider is refused on the same route', async ({ api }) => {
        const allowed = await projects.getProjectById(api, await tokenFor(api, 'testUser1'), seed.organization1, seed.project1_1);
        await expectOk(allowed);
        expect(await allowed.json()).toMatchObject({ id: seed.project1_1, organizationId: seed.organization1 });
        const denied = await projects.getProjectById(api, await tokenFor(api, 'outsider'), seed.organization1, seed.project1_1);
        expect(denied.status()).toBe(404);
    });

    test('knowledge pipeline: upload, split, embed, search and complete with local mock models', async ({ api, workspace }) => {
        const { ownerToken: token, organizationId, projectId } = workspace;
        await expectOk(await documents.uploadDocument(api, token, organizationId, projectId, textFile));
        const split = await documents.splitDocumentSections(api, token, organizationId, projectId);
        await expectOk(split);
        const sections = await split.json();
        expect(sections.length).toBeGreaterThan(0);
        expect(sections[0].sectionValue).toContain('least squares');

        const embedded = await embeddingsProject.getProjectEmbeddings(api, token, projectId);
        await expectOk(embedded);
        expect((await embedded.json())[0].embeddingVector.length).toBeGreaterThan(0);

        const question = { value: 'What are the drawbacks of least squares?' };
        const search = await embeddings.semanticSearch(api, token, question, { projectId, size: '5' });
        await expectOk(search);
        const matches = await search.json();
        expect(matches.length).toBeGreaterThan(0);
        const sectionIds = sections.map(section => section.id);
        for (const match of matches) expect(sectionIds).toContain(match.id);

        const completion = await embeddings.semanticCompletion(api, token, question, { projectId });
        await expectOk(completion);
        const answer = await completion.json();
        expect(answer.messages.at(-1).value).toContain('MOCK GEMINI RESPONSE');
        expect(answer.threadId).toBeTruthy();
    });
});
