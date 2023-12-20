const {test, expect} = require('@playwright/test');
const projects = require('../../page-objects/apis/projects');

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


        // https://gendox.ctrlspace.dev/gendox/api/v1/organizations/b76b59a3-eea4-476f-9d4b-f178ecf7eb86/users
        const response = await projects.getProjectById(request, token, '99f0a3dc-d64e-4acd-8cda-c57d8aa94a79')

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.id).toBe('99f0a3dc-d64e-4acd-8cda-c57d8aa94a79');
        expect(respBody.name).toBe('demo_java_tutorial');


        await page.pause();


    });


});
