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


        const response = await organizations.getOrganizationById(request, token, '41ce6db7-70fd-411d-b3d8-f2d5775ed501');

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.id).toBe('41ce6db7-70fd-411d-b3d8-f2d5775ed501');
        expect(respBody.name).toBe('test organization1');


        await page.pause();


    });

    test('has at least 1 Admin user', async ({ page, request }) => {


        await page.pause();
        const response = await organizationUsers.getOrganizationUsersByOrgId(request, token, '41ce6db7-70fd-411d-b3d8-f2d5775ed501')

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        console.log('respBody: ', respBody);
        expect(respBody.length).toBeGreaterThan(0);
        //iterate all users and get the one that has property role.name === 'ROLE_ADMIN'
        let adminUser = respBody.find(user => user.role.name === 'ROLE_ADMIN');
        expect(adminUser.user.email).toBe('testuser1@test.com');


    });

    test('Get All Organizations', async ({ page, request }) => {

        // https://gendox.ctrlspace.dev/gendox/api/v1/organizations/b76b59a3-eea4-476f-9d4b-f178ecf7eb86/users
        const response = await organizations.getOrganizationByCriteria(request, token, {});

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.length).toBeGreaterThan(0);

    });


     test('Create Organization', async ({ page, request }) => {
        const newOrganizationData = {
                             name: 'A Testing Organization',
                             displayName: 'Delete Organization',
                             address: 'Middle Of Nowhere'
                         };

        const response = await organizations.createOrganization(request, token, newOrganizationData);

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.id).toBeDefined();
        expect(respBody.name).toBe('A Testing Organization');
        expect(respBody.displayName).toBe('Delete Organization');
//        store the organization ID
        newOrganizationId = respBody.id;


        await page.pause();

    });

//Feature: Update Organization

//Scenario: Update an organization where the logged in user is an admin.
//Given that the user is logged in
//Given the updatedOrganizationData
//When the existing organization data is updated with the updatedOrganizationData
//Then the organization will be updated.

test('Admin Update Organization', async ({ page, request }) => {
        const updatedOrganizationData = {
                            id: '41ce6db7-70fd-411d-b3d8-f2d5775ed501',
                            name: 'test organization1',
                            displayName: 'Testing Organization1'
                         };

        const response = await organizations.updateOrganization(request, token, updatedOrganizationData, '41ce6db7-70fd-411d-b3d8-f2d5775ed501');

                expect(response.ok()).toBeTruthy();
                let respBody = await response.json();
                expect(respBody.id).toBe('41ce6db7-70fd-411d-b3d8-f2d5775ed501');
                expect(respBody.name).toBe('test organization1');
                expect(respBody.displayName).toBe('Testing Organization1');

        await page.pause();


       });

//Scenario: Update an organization where the logged in user is not an admin.
//Given that the user is logged in
//Given the updatedOrganizationData
//When the existing organization data is updated with the updatedOrganizationData
//Then the organization will not be updated. An unauthorized error is returned.

test('Unauthorized Update Organization', async ({ page, request }) => {

        const unauthorizedUpdatedOrganizationData = {
                            id: 'feedcb3e-708a-4a8f-b39b-630b06f048b6',
                            name: 'test organization2',
                            displayName: 'Testing Organization2'
                         };


        const response = await organizations.updateOrganization(request, token, unauthorizedUpdatedOrganizationData, 'feedcb3e-708a-4a8f-b39b-630b06f048b6');

        expect(response.ok()).not.toBeTruthy();

        await page.pause();

        });



    test('Delete Organization by id', async ({ page, request }) => {
        const response1 = await organizations.deleteOrganization(request, token, '41ce6db7-70fd-411d-b3d8-f2d5775ed501');

        expect(response1.ok()).toBeTruthy();


        const response2 = await organizations.deleteOrganization(request, token, 'feedcb3e-708a-4a8f-b39b-630b06f048b6');

        expect(response2.ok()).toBeTruthy();

        await page.pause();


        });


});

