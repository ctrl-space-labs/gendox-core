// @ts-check
const { test, expect, sharedWorkspace, ensureAccess, tokenFor } = require('../../support/workspace');
const organizations = require('../../page-objects/apis/organizations');
const organizationUsers = require('../../page-objects/apis/organizationUsers');
const seed = require('../../page-objects/apis/seed');

// Tests the Organizations CRUD API, by performign API calls to the API server.
// Before all tests, an authentication JWT token is obtained from the API server.
test.describe('Organizations CRUD API', () => {
    let token;
    let readerToken;

    // Changes go to an organization of this file. Reading uses the seeded ones.
    const workspace = sharedWorkspace('organizations', { members: { testUser4: 'ROLE_READER' }, project: false });

    test.beforeAll(async ({ request }) => {
        token = await tokenFor(request, 'testUser1');
        readerToken = await tokenFor(request, 'testUser4');
    });


        const newOrganizationData = {
                             name: 'An example Testing Organization',
                             displayName: 'Delete Organization',
                             address: 'Middle Of Nowhere'
                         };


        const organizationId1 = '41ce6db7-70fd-411d-b3d8-f2d5775ed501'
        const organizationId2 = 'feedcb3e-708a-4a8f-b39b-630b06f048b6'


//Feature: Get Organization by ID

//  Scenario: Get Organization by ID.
//  Given that the user is logged in.
//  Given the organization ID.
//  Then from the selected organization is returned.

    test('Get Organization by id', async ({ request }) => {


        const response = await organizations.getOrganizationById(request, token, organizationId1);

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.id).toBe('41ce6db7-70fd-411d-b3d8-f2d5775ed501');
        expect(respBody.name).toBe('test organization1');


    });

//Feature: Get Organization Users by ID

//  Scenario: Check that an organization has at least 1 admin.
//  Given that the user is logged in.
//  Given the organization ID.
//  When the list of users is returned and at least one must have the role ROLE_ADMIN.
//  Then the organization has at least 1 Admin user.

    test('has at least 1 Admin user', async ({ request }) => {
        const response = await organizationUsers.getOrganizationUsersByOrgId(request, token, organizationId1)

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.length).toBeGreaterThan(0);
        //iterate all users and get the one that has property role.name === 'ROLE_ADMIN'
        let adminUser = respBody.find(user => user.role.name === 'ROLE_ADMIN');
        expect(adminUser.user.email).toBe('testuser1@test.com');


    });

//Feature: Get All Organizations

//  Scenario: Get Organizations by ID.
//  Given that the user is logged in.
//  When the criteria given is an organization the user belongs to.
//  Then that Organization is returned.

    test('Get Organizations By Criteria', async ({ request }) => {

        const response = await organizations.getOrganizationByCriteria(request, token, {
            organizationId: seed.organization1
        });

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.content.map(organization => organization.id)).toEqual([seed.organization1]);

    });

//  Scenario: Get Organizations without criteria.
//  Given that the user is logged in.
//  When no criteria are given, which would cover every organization.
//  Then an access denied error is returned.

    test('Error in missing mandatory criteria', async ({ request }) => {

        const response = await organizations.getOrganizationByCriteria(request, token, {});

        expect(response.status()).toBe(404);

    });

//Feature: Create and Deactivate Organization

//  Scenario: Create an organization.
//  Given that the user is logged in.
//  Given the newOrganizationData.
//  When the name and email are provided.
//  Then the organization is created.
//  Given a new organization is created.
//  Then the organization will be deactivated by its id.

     let newOrganizationId;
     test('Create and Deactivate Organization', async ({ request }) => {


        const response = await organizations.createOrganization(request, token, newOrganizationData);

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.id).toBeDefined();
        expect(respBody.name).toBe('An example Testing Organization');
        expect(respBody.displayName).toBe('Delete Organization');
//        store the organization ID
        newOrganizationId = respBody.id;


        await ensureAccess(request, token, newOrganizationId);
        const deactivated = await organizations.deactivateOrganization(request, token, newOrganizationId);

        expect(deactivated.ok()).toBeTruthy();

    });

//Feature: Update Organization

//  Scenario: Update an organization where the logged in user is an admin.
//  Given that the user is logged in
//  Given the updatedOrganizationData
//  When the existing organization data is updated with the updatedOrganizationData
//  Then the organization will be updated.

    test('Admin Update Organization', async ({ request }) => {

        const response = await organizations.updateOrganization(request, token, {
            id: workspace.organizationId,
            name: workspace.name,
            displayName: 'Renamed by an admin'
        }, workspace.organizationId);

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.id).toBe(workspace.organizationId);
        expect(respBody.displayName).toBe('Renamed by an admin');


       });


//  Scenario: Update an organization where the logged in user can only read it.
//  Given that the user is logged in
//  Given the updatedOrganizationData
//  When the existing organization data is updated with the updatedOrganizationData
//  Then the organization will not be updated. An access denied error is returned.

    test('Unauthorized Update Organization', async ({ request }) => {



        const response = await organizations.updateOrganization(request, readerToken, {
            id: workspace.organizationId,
            name: workspace.name,
            displayName: 'Renamed by a reader'
        }, workspace.organizationId);

        expect(response.status()).toBe(404);

        });



});

