const { test, expect } = require('@playwright/test');
const keycloak = require('../../page-objects/apis/keycloak');
const users = require('../../page-objects/apis/users');
const seed = require('../../page-objects/apis/seed');

test.describe('Users CRUD API', () => {

    let token;
    let testUser3Token;

    test.beforeAll(async ({request}) => {
        token = await keycloak.tokenFor(request, 'testUser1');
        testUser3Token = await keycloak.tokenFor(request, 'testUser3');
    });

//Feature: Get User by ID

//  Scenario: Get the logged in user.
//  Given that the user is logged in.
//  Given a user ID.
//  Then the user information is returned.

    test('Get User by id', async ({ request }) => {


        const response = await users.getUserById(request, token, '19b6aa4a-48f4-4073-8b95-41039f090344');

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.id).toBe('19b6aa4a-48f4-4073-8b95-41039f090344');
        expect(respBody.name).toBe('Test User1');


    });

//Feature: Get User Profile

//  Scenario: Get the profile of the logged in user.
//  Given that the user is logged in.
//  Then the user profile is returned.

    test('Get User Profile', async ({ request }) => {
        const response = await users.getUserProfile(request, token);

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.id).toBe(seed.testUser1);
        expect(respBody.email).toBe('testuser1@test.com');
    });

//Feature: Get All Users

//  Scenario: Get All Users by Organization ID.
//  Given that the user is logged in.
//  When the criteria given is the organization ID.
//  Then all the users from the selected organization are returned.

    test('Get Users By Organization ID', async ({ request }) => {

            const response = await users.getUsersbyCriteria(request, token, {
                organizationId: 'feedcb3e-708a-4a8f-b39b-630b06f048b6'
            })

            expect(response.ok()).toBeTruthy();
            let respBody = await response.json();
            expect(respBody.totalElements).toBe(4);

            let DefaultUser = respBody.content.find(user => user.name === 'Test User1');

            expect(DefaultUser.userType.name).toBe('ROLE_USER');

        });

//  Scenario: Get All Users by Project ID.
//  Given that the user is logged in.
//  When the criteria given is the project ID.
//  Then all the users from the selected project are returned.

    test('Get Users By Project ID', async ({ request }) => {

            const response = await users.getUsersbyCriteria(request, token, {
                projectId: 'dda1148a-2251-4082-b838-6834251f59a0'
            })

            expect(response.ok()).toBeTruthy();
            let respBody = await response.json();
            expect(respBody.totalElements).toBe(3);

            let DefaultUser = respBody.content.find(user => user.name === 'Test User1');


            expect(DefaultUser.userType.name).toBe('ROLE_USER');

        });

//  Scenario: Get All Users by criteria that is not Project ID or Project ID.
//  Given that the user is logged in.
//  When the criteria is given.
//  Then an access denied error is returned, as the search would cover every user.

    test('Error in missing mandatory criteria', async ({ request }) => {

        const response = await users.getUsersbyCriteria(request, token, {});

        expect(response.status()).toBe(404);

        });

//Feature: Create User

//  Scenario: Create a user without being a super admin.
//  Given that the user is logged in.
//  Given the newUserData.
//  When the user is not a super admin, which no seeded user is.
//  Then an access denied error is returned.

    test('Non Super Admin Create User', async ({ request }) => {
        const newUserData = {
                             name: 'Another Test User',
                             email: 'atestuserdelete@test.com'
                         };

        const response = await users.createUser(request, token, newUserData);

        expect(response.status()).toBe(404);

        });

//Feature: Update Organization

//  Scenario: Update user when the logged in user ID and the updated user ID match.
//  Given that the user is logged in.
//  Given the updatedUserData.
//  When the provided ID matches the ID of the logged in user.
//  Then the user will be updated.

    test('Update User', async ({ request }) => {
        const updatedUserData = {
                            id: '2fb9e526-f39f-4959-a51c-8148965bf03f',
                            name: 'Test User3',
                            email: 'testuser3@test.com'
                         };

        const response = await users.updateUser(request, testUser3Token, updatedUserData, seed.testUser3);

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.id).toBe('2fb9e526-f39f-4959-a51c-8148965bf03f');
        expect(respBody.name).toBe('Test User3');
        expect(respBody.email).toBe('testuser3@test.com');


        });

//  Scenario: Update user when the logged in user ID and the updated user ID do not match.
//  Given that the user is logged in.
//  Given the updatedUserData.
//  When the provided ID does not match the ID of the logged in user.
//  An access denied error occurs.

    test('Unauthorized Update User', async ({ request }) => {
        const updatedUserData2 = {
                            id: '2fb9e526-f39f-4959-a51c-8148965bf03f',
                            name: 'Test User3',
                            email: 'testuser3@test.com'
                         };

        const response = await users.updateUser(request, token, updatedUserData2, seed.testUser3);

        expect(response.status()).toBe(404);


        });


    });
