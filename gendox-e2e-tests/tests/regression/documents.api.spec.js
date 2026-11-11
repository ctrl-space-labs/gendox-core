const path = require('path');
const fs = require('fs');
const { test, expect } = require('../../support/workspace');
const { call, ok, json, projectPath, upload } = require('../../support/domain');
const documents = require('../../page-objects/apis/documents');

test.describe('Document formats and persistence', { tag: '@p1' }, () => {
    for (const extension of ['txt', 'md', 'pdf', 'docx', 'xlsx']) {
        test(`${extension}: upload, parse sections, read metadata and original bytes`, async ({ api, workspace: w }) => {
            const file = path.resolve(__dirname, `../../fixtures/formats/sample.${extension}`);
            const doc = await upload(api, w, file);
            const sections = await json(await call(api, w, 'get', `/documents/${doc.id}/sections`));
            expect(sections.length).toBeGreaterThan(0);
            expect(sections.map(s => s.sectionValue).join(' ').toLowerCase().replace(/\s+/g, ' ')).toContain('least squares');
            const metadata = await json(await call(api, w, 'get', `/documents/${doc.id}`));
            expect(metadata.id).toBe(doc.id);
            const original = await ok(await call(api, w, 'get', `/documents/${doc.id}/content`));
            expect(await original.body()).toEqual(fs.readFileSync(file));
        });
    }

    test('project document pagination returns distinct pages from its own data', async ({ api, workspace: w }) => {
        for (const title of ['Alpha', 'Beta', 'Gamma']) {
            const response = await api.post(require('../../tests.config').gendox.contextPath + projectPath(w) + '/documents/upload', { headers: { Authorization: `Bearer ${w.ownerToken}` }, multipart: { file: { name: `${title}.txt`, mimeType: 'text/plain', buffer: Buffer.from(title + ' fixture') } } });
            await ok(response);
        }
        const first = await json(await call(api, w, 'get', `${projectPath(w)}/documents?size=2&page=0&sort=title,asc`));
        const second = await json(await call(api, w, 'get', `${projectPath(w)}/documents?size=2&page=1&sort=title,asc`));
        expect(first.totalElements).toBe(3);
        expect(first.content.map(d => d.title)).toEqual(['Alpha', 'Beta']);
        expect(second.content.map(d => d.title)).toEqual(['Gamma']);
    });

    test('rename document and remove it from the project', async ({ api, workspace: w }) => {
        const doc = await upload(api, w);
        await ok(await call(api, w, 'put', `/documents/${doc.id}`, { ...doc, title: 'Renamed fixture' }));
        expect((await json(await call(api, w, 'get', `/documents/${doc.id}`))).title).toBe('Renamed fixture');
        await ok(await documents.deleteDocumentInstance(api, w.ownerToken, w.organizationId, w.projectId, doc.id));
        expect((await json(await call(api, w, 'get', `${projectPath(w)}/documents`))).content).toEqual([]);
    });

    test('semantic search returns no matches for an empty project', { tag: '@p2' }, async ({ api, workspace: w }) => {
        const result = await json(await call(api, w, 'post', `/messages/search?projectId=${w.projectId}&size=5`, { value: 'least squares' }));
        expect(result).toEqual([]);
    });
});
