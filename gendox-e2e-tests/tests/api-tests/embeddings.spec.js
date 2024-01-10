// @ts-check
const { test, expect } = require('@playwright/test');
const keycloak = require('../../page-objects/apis/keycloak');
const organizations = require('../../page-objects/apis/embeddings');


// Tests the Embeddings CRUD API, by performign API calls to the API server.
// Before all tests, an authentication JWT token is obtained from the API server.
test.describe('Embeddings CRUD API', () => {
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

test('Get Embeddings', async ({ page, request }) => {
        const botRequest = {
                               messages: ["dress", "hi", "γεια"]

                           };

        const response = await embeddings.getEmbeddings(request, token, botRequest,{
                                                        aiModel: 'embed-multilingual-v3.0'});


        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody).toHaveProperty('usage');
        expect(respBody).toHaveProperty('embedding');
        expect(respBody).toHaveProperty('model');
        expect(respBody.usage).toHaveProperty('usage');

        await page.pause();

    });