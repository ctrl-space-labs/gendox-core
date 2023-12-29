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
                                 name: 'Jane Doe',
                                 email: 'janedoe@test.com',


                             };


            const response = await users.createUser(request, token, userData);

            expect(response.ok()).toBeTruthy();
            let respBody = await response.json();
            expect(respBody.id).toBeDefined();
            expect(respBody.name).toBe('Jane Doe');
            expect(respBody.email).toBe('janedoe@test.com');


            await page.pause();


        });



    });
