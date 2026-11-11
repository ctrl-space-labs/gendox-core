// @ts-check
const { test, expect, sharedWorkspace, tokenFor } = require('../../support/workspace');
const documents = require('../../page-objects/apis/documents');
const embeddings = require('../../page-objects/apis/embeddings');
const embeddingsProject = require('../../page-objects/apis/embeddingsProject');

const path = require('path');

const testFile = path.resolve(__dirname, '../../fixtures/least-squares.txt');

// Tests embeddings, search and completions on a project with one document. The project uses
// the mock models, so no provider key is needed.
test.describe('Embeddings CRUD API', () => {
    test.describe.configure({ mode: 'serial' });

    let token;
    let outsiderToken;
    let projectId;
    let sectionId;

    const workspace = sharedWorkspace('embeddings');

    test.beforeAll(async ({ request }) => {
        token = workspace.tokens.testUser1;
        outsiderToken = await tokenFor(request, 'outsider');
        projectId = workspace.projectId;

        const uploaded = await documents.uploadDocument(request, token, workspace.organizationId, projectId, testFile);
        expect(uploaded.ok()).toBeTruthy();
        const split = await documents.splitDocumentSections(request, token, workspace.organizationId, projectId);
        expect(split.ok()).toBeTruthy();
        sectionId = (await split.json())[0].id;
    });

   const message = {
                          value: "What are the drawbacks of Least Squares method?"

                      };

//Scenario: Get embeddings for a project.
//Given that the user is logged in
//Given the project ID.
//Then the embeddings for the given project will be produced.

test('Get Project Embeddings', async ({ request }) => {

        const response = await embeddingsProject.getProjectEmbeddings(request, token, projectId);

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.length).toBeGreaterThan(0);
        expect(respBody[0].embeddingVector.length).toBeGreaterThan(0);

    });

//Scenario: Get the embedding of a section.
//Given that the user is logged in
//Given a section of the project.
//Then the embedding of that section will be produced.

test('Get Section Embedding', async ({ request }) => {

        const response = await embeddingsProject.getSectionEmbedding(request, token, projectId, sectionId);

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.embeddingVector.length).toBeGreaterThan(0);

    });

//Feature: Semantic Search


//Scenario: Perform Semantic Search.
//Given that the user is logged in
//Given a query(message).
//Given the project ID and pageable size.
//When the project embeddings are created.
//Then the sections closest to the query are returned.

test('Semantic Search', async ({ request }) => {

        const response = await embeddings.semanticSearch(request, token, message, { projectId, size: '5' });

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.length).toBeGreaterThan(0);
        respBody.forEach(item => {
            expect(item).toHaveProperty('documentSectionMetadata');
            expect(item.sectionValue).toContain('least squares');
        });

    });

//Scenario: Perform Semantic Search in a project the user does not belong to.
//Given that the user is logged in
//When the user is not a member of the project.
//Then an access denied error is returned.

test('Outsider Semantic Search', async ({ request }) => {

        const response = await embeddings.semanticSearch(request, outsiderToken, message, { projectId, size: '5' });

        expect(response.status()).toBe(404);

    });


//Feature: Semantic Completion


//Scenario: Perform Semantic Completion.
//Given that the user is logged in
//Given a message.
//Given the project ID.
//When the project embeddings are created.
//Then the project agent answers the message.

test('Semantic Completion', async ({ request }) => {

        const response = await embeddings.semanticCompletion(request, token, message, { projectId });

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.messages[0].value).toContain('MOCK GEMINI RESPONSE');
        expect(respBody.threadId).toBeDefined();

    });

});
