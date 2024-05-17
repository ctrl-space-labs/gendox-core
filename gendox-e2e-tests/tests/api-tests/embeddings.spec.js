// @ts-check
const { test, expect } = require('@playwright/test');
const keycloak = require('../../page-objects/apis/keycloak');
const embeddings = require('../../page-objects/apis/embeddings');
const embeddingsProject = require('../../page-objects/apis/embeddingsProject');

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

   const message = {
                          messages: "What are the drawbacks of Least Squares method?"

                      };

   const criteria =   {
                          size: '5',
                          projectId:'dda1148a-2251-4082-b838-6834251f59a0'
                      };

   const botRequest = {
                          messages: ["hi"]

                      };

   const completionMessage = {
                          value: "Least Squares Method"

                      };
//Scenario: Get embeddings for a botRequest.
//Given that the user is logged in
//Given the botRequest as an array of strings of messages.
//When the the AI model is specified .
//Then the embeddings for the array of messages will be produced.

test('Get Embeddings', async ({ page, request }) => {


        const response = await embeddings.getEmbeddings(request, token, botRequest,{
                                                        aiModel: 'embed-multilingual-v3.0'});


        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody).toHaveProperty('usage');
        expect(respBody.data[0]).toHaveProperty('embedding');
        expect(respBody).toHaveProperty('model');
        expect(respBody).toHaveProperty('usage');

        await page.pause();

    });

//Scenario: Get embeddings for a project.
//Given that the user is logged in
//Given the project ID.
//Then the embeddings for the given project will be produced.

test('Get Project Embeddings', async ({ page, request }) => {


        const response = await embeddingsProject.getProjectEmbeddings(request, token,
                                                'dda1148a-2251-4082-b838-6834251f59a0');

        expect(response.ok()).toBeTruthy();
        console.log(response);


        await page.pause();

    });

//Feature: Semantic Search


//Scenario: Perform Semantic Search.
//Given that the user is logged in
//Given a query(message).
//Given the project ID and pagebale size.
//When document sections for the project documents are created.
//When the project embeddings are created.
//When the project agent uses embed-multilingual-v3.0 for semantic search model.
//Then the query will be answered with possible answers based on the existing document sections.

test('Cohere Semantic Search', async ({ page, request }) => {


        const response = await embeddings.semanticSearch(request, token, message,criteria);


        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        respBody.forEach(item => {
            expect(item).toHaveProperty('documentSectionMetadata');
            expect(item).toHaveProperty('sectionValue');
        });

        await page.pause();

    });


//Scenario: Perform Semantic Search.
//Given that the user is logged in
//Given a query(value).
//Given the project ID and pagebale size.
//When document sections for the project documents are created.
//When the project embeddings are created.
//When the project agent uses text-embedding-ada-002 for semantic search model.
//Then the query will be answered with possible answers based on the existing document sections.

test('OpenAI Semantic Search', async ({ page, request }) => {


        const response = await embeddings.semanticSearch(request, token, message,criteria);


        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        respBody.forEach(item => {
            expect(item).toHaveProperty('documentSectionMetadata');
            expect(item).toHaveProperty('sectionValue');
        });

        await page.pause();

    });


//Feature: Semantic Completion


//Scenario: Perform Semantic Completion.
//Given that the user is logged in
//Given a message.
//Given the project ID and pagebale size.
//When document sections for the project documents are created.
//When the project embeddings are created.
//When the project agent uses command model for semantic completion.
//Then semantic completion based on the message and the existing document sections will be performed.

test('Cohere Semantic Completion', async ({ page, request }) => {


        const response = await embeddings.semanticCompletion(request, token, completionMessage,criteria);


        expect(response.ok()).toBeTruthy();


        await page.pause();

    });

//Scenario: Perform Semantic Completion.
//Given that the user is logged in
//Given a message.
//Given the project ID and pagebale size.
//When document sections for the project documents are created.
//When the project embeddings are created.
//When the project agent uses gpt models for semantic completion.
//Then semantic completion based on the message and the existing document sections will be performed.

test('OpenAI Semantic Completion', async ({ page, request }) => {


        const response = await embeddings.semanticCompletion(request, token, completionMessage,criteria);


        expect(response.ok()).toBeTruthy();


        await page.pause();

    });

});