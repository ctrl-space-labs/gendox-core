// @ts-check
const { test, expect } = require('@playwright/test');
const keycloak = require('../../page-objects/apis/keycloak');
const organizations = require('../../page-objects/apis/organizations');
const organizationUsers = require('../../page-objects/apis/organizationUsers');


// Tests the Organizations CRUD API, by performign API calls to the API server.
// Before all tests, an authentication JWT token is obtained from the API server.
test.describe('Organizations CRUD API', () => {
    let token;

    test.beforeAll(async ({ request }) => {

        //x-www-form-urlencoded
        const response = await keycloak.simpleUserLogin(request);

        let body = await response.json();
        token = body.access_token;
        expect(response.ok()).toBeTruthy();
    });

    test('Get Organization by id', async ({ page, request }) => {


        const response = await organizations.getOrganizationById(request, token, 'b76b59a3-eea4-476f-9d4b-f178ecf7eb86');

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.id).toBe('b76b59a3-eea4-476f-9d4b-f178ecf7eb86');
        expect(respBody.name).toBe('Testing-Organization');


        await page.pause();


    });

    test('has at least 1 Admin user', async ({ page, request }) => {


        await page.pause();
        const response = await organizationUsers.getOrganizationUsersByOrgId(request, token, 'b76b59a3-eea4-476f-9d4b-f178ecf7eb86')

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        console.log('respBody: ', respBody);
        expect(respBody.length).toBeGreaterThan(0);
        //iterate all users and get the one that has property role.name === 'ROLE_ADMIN'
        let adminUser = respBody.find(user => user.role.name === 'ROLE_ADMIN');
        expect(adminUser.user.email).toBe('csekas@test.com');


    });

    test('Get All Organization', async ({ page, request }) => {

        // https://gendox.ctrlspace.dev/gendox/api/v1/organizations/b76b59a3-eea4-476f-9d4b-f178ecf7eb86/users
        const response = await organizations.getOrganizationByCriteria(request, token, {});

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.length).toBeGreaterThan(0);

    });

});

