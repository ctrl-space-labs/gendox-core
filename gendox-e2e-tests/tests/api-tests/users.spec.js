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


        const response = await users.getUserById(request, token, '5d80024f-ba4d-4ff8-988e-ae37b171d9e4');

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.id).toBe('5d80024f-ba4d-4ff8-988e-ae37b171d9e4');
        expect(respBody.name).toBe('Myrto Potamiti');


        await page.pause();


    });

    test('Create User', async ({ page, request }) => {
            const userData = {
                                 name: 'Test User',
                                 email: 'testuser@test.com',
                             };


            const response = await users.createUser(request, token, userData);



            expect(response.ok()).toBeTruthy();
            let respBody = await response.json();
            console.log(JSON.stringify(respBody))
            expect(respBody.id).toBeDefined();
            expect(respBody.name).toBe('Test User');
            expect(respBody.email).toBe('testuser@test.com');


            await page.pause();


        });

//    test('Update User', async ({ page, request }) => {
//            const userData = {
//                                    "id": "5d80024f-ba4d-4ff8-988e-ae37b171d9e4",
//                                    "name": "Myrto Potamity",
//                                    "firstName": "Mirto"
//                             };
//
//
//            const response = await users.updateUser(request, token, userData, '5d80024f-ba4d-4ff8-988e-ae37b171d9e4');
//
//            expect(response.ok()).toBeTruthy();
//            let respBody = await response.json();
//            console.log(JSON.stringify(respBody))
//            expect(respBody.id).toBe('5d80024f-ba4d-4ff8-988e-ae37b171d9e4');
//            expect(respBody.name).toBe('Myrto Potamity');
//            expect(respBody.firstName).toBe('Mirto');
//
//
//            await page.pause();
//
//
//        });

    });
