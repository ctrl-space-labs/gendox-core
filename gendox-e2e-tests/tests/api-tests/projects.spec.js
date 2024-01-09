const {test, expect} = require('@playwright/test');
const projects = require('../../page-objects/apis/projects');
const projectUsers = require('../../page-objects/apis/projectUsers');
const keycloak = require('../../page-objects/apis/keycloak');

const exp = require("constants");

test.describe('Projects CRUD API', () => {

    let token;

    test.beforeAll(async ({ request }) => {

        //x-www-form-urlencoded
        const response = await keycloak.simpleUserLogin(request);

        let body = await response.json();
        token = body.access_token;
        expect(response.ok()).toBeTruthy();
    });

    test('Get Project by id', async ({ page, request }) => {



        const response = await projects.getProjectById(request, token, 'dda1148a-2251-4082-b838-6834251f59a0')

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.id).toBe('dda1148a-2251-4082-b838-6834251f59a0');
        expect(respBody.name).toBe('Test Project 1.1');
        await page.pause();

    });


    test('Get Projects By Organization', async ({ page, request }) => {

        const response = await projects.getProjectByCriteria(request, token, {
            organizationId: '41ce6db7-70fd-411d-b3d8-f2d5775ed501'
        })

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.totalElements).toBe(2);

        let Project1 = respBody.content.find(project => project.name === 'Test Project 1.1');

        respBody.content.forEach(project => {
            expect(project.organizationId).toBe('41ce6db7-70fd-411d-b3d8-f2d5775ed501');
        });

        expect(gendoxWikiProject.autoTraining).toBeTruthy();
        expect(gendoxWikiProject.projectAgent.semanticSearchModel.model).toBe("text-embedding-ada-002");

    });


    test('Error in missing mandatory criteria', async ({ page, request }) => {

        const response = await projects.getProjectByCriteria(request, token, {});

        expect(response.ok()).toBeFalsy();
        expect(response.status()).toBe(400);
        let respBody = await response.json();
        expect(respBody.metadata[0].field).toBe('projectCriteria');

    });


    test('Get Project Members by id', async ({ page, request }) => {

            const response = await projectUsers.getProjectMembers(request, token, '19319b2a-6230-4b13-9bb6-a0f02eac183a')
            expect(response.ok()).toBeTruthy();
            let respBody = await response.json();
             if (respBody.length === 0 && response.ok()) {
                    console.log('The project has no members');
                } else {
            console.log('Response Body:', respBody);
            expect(respBody[0]).toHaveProperty('project');
            expect(respBody[0].project).toHaveProperty('id', '19319b2a-6230-4b13-9bb6-a0f02eac183a');
            }
            await page.pause();

        });


});
