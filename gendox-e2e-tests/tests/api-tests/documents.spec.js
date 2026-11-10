// @ts-check
const { test, expect, sharedWorkspace } = require('../../support/workspace');
const documents = require('../../page-objects/apis/documents');
const documentsProject = require('../../page-objects/apis/documentsProject');

const path = require('path');

const testFile = path.resolve(__dirname, '../../fixtures/least-squares.txt');

// Tests the Documents CRUD API, by performing API calls to the API server.
// The tests follow one document through its life, so they run in order.
test.describe('Documents CRUD API', () => {
    test.describe.configure({ mode: 'serial' });

    let token;
    let readerToken;
    let organizationId;
    let projectId;

    const workspace = sharedWorkspace('documents', { members: { testUser4: 'ROLE_READER' } });

    test.beforeAll(async () => {
        token = workspace.tokens.testUser1;
        readerToken = workspace.tokens.testUser4;
        organizationId = workspace.organizationId;
        projectId = workspace.projectId;
    });

//Scenario: Upload a document.
//Given that the user is logged in
//Given a project and a file.
//Then the file is uploaded and the project has one document.

test('Upload Document', { tag: '@smoke' }, async ({ request }) => {

        const response = await documents.uploadDocument(request, token, organizationId, projectId, testFile);

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.message).toBe("Files uploaded successfully");

        const projectDocuments = await documents.getProjectDocuments(request, token, organizationId, projectId);
        expect(projectDocuments.ok()).toBeTruthy();
        expect((await projectDocuments.json()).content.length).toBe(1);

    });

//Scenario: Upload a document without the permission.
//Given that the user is logged in
//When the user is a project member with only reading rights in the organization.
//Then an access denied error is returned.

test('Reader Upload Document', async ({ request }) => {

        const response = await documents.uploadDocument(request, readerToken, organizationId, projectId, testFile);

        expect(response.status()).toBe(404);

    });

//Scenario: Split document sections for a project.
//Given that the user is logged in
//Given the project ID.
//Then the project documents will be split in sections.

test('Split Document Sections', { tag: '@smoke' }, async ({ request }) => {

        const response = await documents.splitDocumentSections(request, token, organizationId, projectId);

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.length).toBeGreaterThan(0);
        expect(respBody[0].sectionValue).toContain('least squares');

    });

//Scenario: Get document sections for a project.
//Given that the user is logged in
//Given the project ID.
//Then the document sections for that project will be returned.

test('Get Project Document Sections', async ({ request }) => {

        const response = await documentsProject.getProjectDocumentSections(request, token, projectId);

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.length).toBeGreaterThan(0);

    });

//Scenario: Delete a document.
//Given that the user is logged in
//Given a document of the project.
//Then the document is deleted and the project has no documents.

test('Delete Document', async ({ request }) => {

        const before = await documents.getProjectDocuments(request, token, organizationId, projectId);
        const documentId = (await before.json()).content[0].id;

        const response = await documents.deleteDocumentInstance(request, token, organizationId, projectId, documentId);

        expect(response.ok()).toBeTruthy();

        const after = await documents.getProjectDocuments(request, token, organizationId, projectId);
        expect((await after.json()).content.length).toBe(0);

    });

//Scenario: Create a document instance without a file.
//Given that the user is logged in
//Given the organization of the project.
//Then the document instance is created.

test('Create Document Instance', async ({ request }) => {

        const response = await documents.createDocumentInstance(request, token, projectId, {
            organizationId: organizationId
        });

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.id).toBeDefined();
        expect(respBody.organizationId).toBe(organizationId);

    });

});
