// @ts-check
const { test, expect } = require('@playwright/test');
const keycloak = require('../../page-objects/apis/keycloak');
const documents = require('../../page-objects/apis/documents');
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

     });