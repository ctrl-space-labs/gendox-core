const {test, expect} = require('@playwright/test');
const projects = require('../../page-objects/apis/projects');
const exp = require("constants");

test.describe('Projects CRUD API', () => {

    let token;

    test.beforeAll(async ({ request }) => {
        //x-www-form-urlencoded
        const response = await request.post('https://dev.gendox.ctrlspace.dev/idp/realms/gendox-idp-dev/protocol/openid-connect/token', {
            headers:{
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: {
                grant_type: 'password',
                client_id: 'gendox-public-client',
                username: 'csekas@test.com',
                password: '123456789',
                scope: 'openid email'
            }
        });
        let body = await response.json();
        token = body.access_token;
        expect(response.ok()).toBeTruthy();
    });


    test('Get Project by id', async ({ page, request }) => {



        const response = await projects.getProjectById(request, token, '99f0a3dc-d64e-4acd-8cda-c57d8aa94a79')

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.id).toBe('99f0a3dc-d64e-4acd-8cda-c57d8aa94a79');
        expect(respBody.name).toBe('demo_java_tutorial');
        await page.pause();

    });

    test('Get Projects By Organization', async ({ page, request }) => {

        const response = await projects.getProjectByCriteria(request, token, {
            organizationId: '9228b56c-1058-4b92-a2e2-5526bdc834af'
        })

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.totalElements).toBe(6);

        let gendoxWikiProject = respBody.content.find(project => project.name === 'gendox-wiki');

        respBody.content.forEach(project => {
            expect(project.organizationId).toBe('9228b56c-1058-4b92-a2e2-5526bdc834af');
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


});
