const { test, expect } = require('@playwright/test');
const keycloak = require('../../page-objects/apis/keycloak');
const users = require('../../page-objects/apis/users');

test.describe('Users CRUD API', () => {

    let token;

    test.beforeAll(async ({request}) => {

        const response = await keycloak.simpleUserLogin(request);

        let body = await response.json();
        token = body.access_token;
        expect(response.ok()).toBeTruthy();
    });

//Feature: Get User by ID

//  Scenario: Delete created organization.
//  Given that the user is logged in.
//  Given a user ID.
//  Then the user information is returned.

    test('Get User by id', async ({ page, request }) => {


        const response = await users.getUserById(request, token, '19b6aa4a-48f4-4073-8b95-41039f090344');

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.id).toBe('19b6aa4a-48f4-4073-8b95-41039f090344');
        expect(respBody.name).toBe('Test User1');


        await page.pause();


    });

//Feature: Get User Profile

//  Scenario: Delete created organization.
//  Given that the user is logged in.
//  Given a user ID.
//  Then the user profile is returned.

    test('Get User Profile by ID', async ({ page, request }) => {
        const userId = '19b6aa4a-48f4-4073-8b95-41039f090344';
        const response = await users.getUserProfileById(request, token, userId);

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.userId).toBe('19b6aa4a-48f4-4073-8b95-41039f090344');

        await page.pause();
    });

//Feature: Get All Users

//  Scenario: Get All Users by Organization ID.
//  Given that the user is logged in.
//  When the criteria given is the organization ID.
//  Then all the users from the selected organization are returned.

    test('Get Users By Organization ID', async ({ page, request }) => {

            const response = await users.getUsersbyCriteria(request, token, {
                organizationId: 'feedcb3e-708a-4a8f-b39b-630b06f048b6'
            })

            expect(response.ok()).toBeTruthy();
            let respBody = await response.json();
            expect(respBody.totalElements).toBe(4);

            let DefaultUser = respBody.content.find(user => user.name === 'Test User1');

            expect(DefaultUser.userType.name).toBe('ROLE_USER');


            await page.pause();

        });

//  Scenario: Get All Users by Project ID.
//  Given that the user is logged in.
//  When the criteria given is the project ID.
//  Then all the users from the selected project are returned.

    test('Get Users By Project ID', async ({ page, request }) => {

            const response = await users.getUsersbyCriteria(request, token, {
                projectId: 'dda1148a-2251-4082-b838-6834251f59a0'
            })

            expect(response.ok()).toBeTruthy();
            let respBody = await response.json();
            expect(respBody.totalElements).toBe(2);

            let DefaultUser = respBody.content.find(user => user.name === 'Test User1');


            expect(DefaultUser.userType.name).toBe('ROLE_USER');

        });

//  Scenario: Get All Users by criteria that is not Project ID or Project ID.
//  Given that the user is logged in.
//  When the criteria is given.
//  Then a bad request error is returned.

    test('Error in missing mandatory criteria', async ({ page, request }) => {

        const response = await users.getUsersbyCriteria(request, token, {});

        expect(response.ok()).toBeFalsy();
        expect(response.status()).toBe(400);
        let respBody = await response.json();
        expect(respBody.metadata[0].field).toBe('userCriteria');

        });

//Feature: Create User

//  Scenario: Create a user.
//  Given that the user is logged in.
//  Given the newUserData.
//  When the name and email are provided
//  Then the user is created.

    //test.skip to skip this test
    test('Create User', async ({ page, request }) => {
        const newUserData = {
                             name: 'Another Test User',
                             email: 'atestuserdelete@test.com'
                         };

        const response = await users.createUser(request, token, newUserData);

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.id).toBeDefined();
        expect(respBody.name).toBe('Another Test User');
        expect(respBody.email).toBe('atestuserdelete@test.com');

        await page.pause();

        });

//Feature: Update Organization

//  Scenario: Update user when the logged in user ID and the updated user ID match.
//  Given that the user is logged in.
//  Given the updatedUserData.
//  When the provided ID matches the ID of the logged in user.
//  Then the user will be updated.

    test('Update User', async ({ page, request }) => {
        const updatedUserData = {
                            id: '2fb9e526-f39f-4959-a51c-8148965bf03f',
                            name: 'Test User3',
                            email: 'testuser3@test.com'
                         };

        const response = await users.updateUser(request, token, updatedUserData, '2fb9e526-f39f-4959-a51c-8148965bf03f');

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.id).toBe('2fb9e526-f39f-4959-a51c-8148965bf03f');
        expect(respBody.name).toBe('Test User3');
        expect(respBody.email).toBe('testuser3@test.com');

        await page.pause();


        });

//  Scenario: Update user when the logged in user ID and the updated user ID do not match.
//  Given that the user is logged in.
//  Given the updatedUserData.
//  When the provided ID does not match the ID of the logged in user.
//  An unauthorized error occurs.

    test('Unauthorized Update User', async ({ page, request }) => {
        const updatedUserData2 = {
                            id: '2fb9e526-f39f-4959-a51c-8148965bf03f',
                            name: 'Test User3',
                            email: 'testuser3@test.com'
                         };

        const response = await users.updateUser(request, token, updatedUserData2, '2fb9e526-f39f-4959-a51c-8148965bf03f');

        expect(response.ok()).not.toBeTruthy();


        await page.pause();


        });


    });
