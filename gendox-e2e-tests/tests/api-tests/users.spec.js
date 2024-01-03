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


    test('Get User by id', async ({ page, request }) => {


        const response = await users.getUserById(request, token, '19b6aa4a-48f4-4073-8b95-41039f090344');

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.id).toBe('19b6aa4a-48f4-4073-8b95-41039f090344');
        expect(respBody.name).toBe('Test User1');


        await page.pause();


    });


    test('Get User Profile by ID', async ({ page, request }) => {
        const userId = '19b6aa4a-48f4-4073-8b95-41039f090344';
        const response = await users.getUserProfileById(request, token, userId);

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.userId).toBe('19b6aa4a-48f4-4073-8b95-41039f090344');

        await page.pause();
    });


    test('Get Users By Organization ID', async ({ page, request }) => {

            const response = await users.getUsersbyCriteria(request, token, {
                organizationId: '41ce6db7-70fd-411d-b3d8-f2d5775ed501'
            })

            expect(response.ok()).toBeTruthy();
            let respBody = await response.json();
            expect(respBody.totalElements).toBe(4);

            let DefaultUser = respBody.content.find(user => user.name === 'Test User1');

//            respBody.content.forEach(user => {
//                expect(user.organizationId).toBe('9228b56c-1058-4b92-a2e2-5526bdc834af');
//            });

            expect(DefaultUser.userType.name).toBe('ROLE_USER');

        });


    test('Get Users By Project ID', async ({ page, request }) => {

            const response = await users.getUsersbyCriteria(request, token, {
                projectId: 'dda1148a-2251-4082-b838-6834251f59a0'
            })

            expect(response.ok()).toBeTruthy();
            let respBody = await response.json();
            expect(respBody.totalElements).toBe(2);

            let DefaultUser = respBody.content.find(user => user.name === 'Test User1');

//            respBody.content.forEach(user => {
//                expect(user.organizationId).toBe('9228b56c-1058-4b92-a2e2-5526bdc834af');
//            });

            expect(DefaultUser.userType.name).toBe('ROLE_USER');

        });


    test('Error in missing mandatory criteria', async ({ page, request }) => {

        const response = await users.getUsersbyCriteria(request, token, {});

        expect(response.ok()).toBeFalsy();
        expect(response.status()).toBe(400);
        let respBody = await response.json();
        expect(respBody.metadata[0].field).toBe('userCriteria');

        });


    //test.skip to skip this test
    test('Create User', async ({ page, request }) => {
        const newUserData = {
                             name: 'Test User',
                             email: 'testuserdeelete@test.com'
                         };

        const response = await users.createUser(request, token, newUserData);

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.id).toBeDefined();
        expect(respBody.name).toBe('Test User');
        expect(respBody.email).toBe('testuserdeelete@test.com');

        await page.pause();

        });


    test('Update User', async ({ page, request }) => {
        const updatedUserData = {
                            id: 'a1d827bf-2973-442f-9b5a-27133ad408d2',
                            name: 'Test User',
                            email: 'testuserdelete@test.com'
                         };

        const response = await users.updateUser(request, token, updatedUserData, 'a1d827bf-2973-442f-9b5a-27133ad408d2');

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.id).toBe('a1d827bf-2973-442f-9b5a-27133ad408d2');
        expect(respBody.name).toBe('Test User');
        expect(respBody.email).toBe('testuserdelete@test.com');

        await page.pause();


        });

    });
