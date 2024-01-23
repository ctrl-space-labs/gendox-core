// @ts-check
const { test, expect } = require('@playwright/test');
const keycloak = require('../../page-objects/apis/keycloak');
const documents = require('../../page-objects/apis/documents');
const documentsProject = require('../../page-objects/apis/documentsProject');

const path = require('path');

// Tests the Embeddings CRUD API, by performing API calls to the API server.
// Before all tests, an authentication JWT token is obtained from the API server.
test.describe('Documents CRUD API', () => {
    let token;

    test.beforeAll(async ({ request }) => {

        //x-www-form-urlencoded
        const response = await keycloak.simpleUserLogin(request);

        let body = await response.json();
        token = body.access_token;
        expect(response.ok()).toBeTruthy();
    });

//Scenario: Get embeddings for a botRequest.
//Given that the user is logged in
//Given the botRequest as an array of strings of messages.
//When the the AI model is specified .
//Then the embeddings for the array of messages will be produced.

test('Upload Document', async ({ page, request }) => {

        const uploadParams = {
                               projectId: 'dda1148a-2251-4082-b838-6834251f59a0',
                               organizationId: '41ce6db7-70fd-411d-b3d8-f2d5775ed501',
//                               file: path.resolve("C:\Users\myrto\OneDrive\Documents\ml.txt")
                               file: "C:\\Users\\myrto\\OneDrive\\Documents\\ml.txt"

                           };

        const response = await documents.uploadDocuments(request, token, uploadParams);

        console.log(token)
        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.message).toBe("Files uploaded successfully");

        await page.pause();

    });

//Scenario: Get document sections for a project.
//Given that the user is logged in
//Given the project ID.
//Then the document sections for that project will be returned.

test('Get Project Document Sections', async ({ page, request }) => {


        const response = await documentsProject.getProjectDocumentSections(request, token,
                                                'dda1148a-2251-4082-b838-6834251f59a0');

        expect(response.ok()).toBeTruthy();
        console.log(response);


        await page.pause();

    });

//Scenario: Split document sections for a project.
//Given that the user is logged in
//Given the project ID.
//Then the project documents will be split in sections.
test('Split Document Sections', async ({ page, request }) => {

        const response = await documents.splitDocumentSections(request, token,
                                               {
                                                           projectId: 'f6da74bb-2de4-4591-bb04-39b98894477e'
                                                       });

        expect(response.ok()).toBeTruthy();

        await page.pause();

    });


     let newDocumentId; // Declare the variable at the top of your test file or in a shared scope
     test('Create and Delete Document Instancw', async ({ page, request }) => {
        const newDocumentInstanceData = {
                            organizationId: "feedcb3e-708a-4a8f-b39b-630b06f048b6",
                            documentTemplateId: null,
                            remoteUrl: "file:C:\\ProgramData\\gendox\\documents/41ce6db7-70fd-411d-b3d8-f2d5775ed501/dda1148a-2251-4082-b838-6834251f59a0/03.-Setup-and-Building.md"
                         };

        const response = await documents.createDocumentInstance(request, token, newDocumentInstanceData);

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.id).toBeDefined();
        expect(respBody.organizationId).toBe('feedcb3e-708a-4a8f-b39b-630b06f048b6');
        expect(respBody.remoteUrl).toBe('file:C:\\ProgramData\\gendox\\documents/41ce6db7-70fd-411d-b3d8-f2d5775ed501/dda1148a-2251-4082-b838-6834251f59a0/03.-Setup-and-Building.md');
//        store the organization ID
        newDocumentId = respBody.id;
        console.log(newDocumentId)

/// Scenario: Delete created organization.
//  Given that the user is logged in
//  When a new organization is created
//  Then the organization will be deleted by its id.

        const deleteResponse = await documents.deleteDocumentInstance(request, token, newDocumentId);

        await page.pause();

    });



     });