const {test, expect} = require('@playwright/test');
const projects = require('../../page-objects/apis/projects');
const projectUsers = require('../../page-objects/apis/projectUsers');
const keycloak = require('../../page-objects/apis/keycloak');

const exp = require("constants");

test.describe('Projects CRUD API', () => {

    let token;

    test.beforeAll(async ({ request }) => {

        //x-www-form-urlencoded
        const response = await keycloak.simpleUserLogin(request);

        let body = await response.json();
        token = body.access_token;
        expect(response.ok()).toBeTruthy();
    });


    let newProjectId;

    const updatedProjectData = {
        id: 'dda1148a-2251-4082-b838-6834251f59a0',
        name: 'Test Project 1.1',
        description: 'Test Project 1 for Organization 1',
        projectAgent: {
            id: "7d43bc6c-5365-4051-b7ff-f068b4f5b182",
            semanticSearchModel: {
                id: "e44d361e-7e40-47e5-a89c-36c0674a7e97",
            },
            completionModel: {
                id: "5e83bfa2-1331-4d9f-aa41-fb804a16796c",
            },
            agentName: "test-project-1_1 Agent"
        }
    };

   const projectId = 'dda1148a-2251-4082-b838-6834251f59a0'


//Feature: Get Project by ID

//  Scenario: Get Project by ID.
//  Given that the user is logged in.
//  Given the project ID.
//  Then from the selected project is returned.

    test('Get Project by id', async ({ page, request }) => {



        const response = await projects.getProjectById(request, token, projectId)

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.id).toBe('dda1148a-2251-4082-b838-6834251f59a0');
        expect(respBody.name).toBe('Test Project 1.1');
        await page.pause();

    });

//Feature: Get All Projects

//  Scenario: Get All Projects by Organization ID.
//  Given that the user is logged in.
//  When the criteria given is the organization ID.
//  Then all the Projects from the selected organization are returned.

    test('Get Projects By Organization', async ({ page, request }) => {

        const response = await projects.getProjectByCriteria(request, token, {
            organizationId: '41ce6db7-70fd-411d-b3d8-f2d5775ed501'
        })

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.totalElements).toBe(2);

        let project1 = respBody.content.find(project => project.name === 'Test Project 1.1');

        respBody.content.forEach(project => {
            expect(project.organizationId).toBe('41ce6db7-70fd-411d-b3d8-f2d5775ed501');
        });

        expect(project1.projectAgent.agentName).toBe("test-project-1_1 Agent");
        expect(project1.projectAgent.semanticSearchModel.model).toBe("embed-multilingual-v3.0");

    });

//  Scenario: Get All without Organization ID as a criterion.
//  Given that the user is logged in.
//  When different criteria is given without the organization ID.
//  Then a bad request response is returned.

    test('Error in missing mandatory criteria', async ({ page, request }) => {

        const response = await projects.getProjectByCriteria(request, token, {});

        expect(response.ok()).toBeFalsy();
        expect(response.status()).toBe(400);
        let respBody = await response.json();
        expect(respBody.metadata[0].field).toBe('projectCriteria');

    });

//Feature: Get Project Members

//  Scenario: Get Project Members by id.
//  Given that the user is logged in.
//  When the project ID is provided.
//  Then all the project members from the selected project are returned.

    test('Get Project Members by id', async ({ page, request }) => {

            const response = await projectUsers.getProjectMembers(request, token, '19319b2a-6230-4b13-9bb6-a0f02eac183a')
            expect(response.ok()).toBeTruthy();
            let respBody = await response.json();
             if (respBody.length === 0 && response.ok()) {
                    console.log('The project has no members');
                } else {
            console.log('Response Body:', respBody);
            expect(respBody[0]).toHaveProperty('project');
            expect(respBody[0].project).toHaveProperty('id', '19319b2a-6230-4b13-9bb6-a0f02eac183a');
            }
            await page.pause();

        });

//Feature: Add Project Members

//  Scenario: Add project members with admin rights.
//  Given that the user is logged in.
//  When the project ID is provided.
//  When the user ID is provided.
//  When the user has admin rights.
//  Then the member is added to the project.

   test('Admin Add Project Members by id', async ({ page, request }) => {

            const response = await projectUsers.addProjectMember(request, token, projectId,
                                                                                  '2fb9e526-f39f-4959-a51c-8148965bf03f')
            expect(response.ok()).toBeTruthy();

            await page.pause();

        });

//Feature: Add Project Members

//  Scenario: Add project members without admin rights.
//  Given that the user is logged in.
//  When the project ID is provided.
//  When the user ID is provided.
//  When the user does not have admin rights.
//  Then an unauthorized error occurs.

   test('Non-Admin Add Project Members by id', async ({ page, request }) => {

            const response = await projectUsers.addProjectMember(request, token, projectId,
                                                                                  '2fb9e526-f39f-4959-a51c-8148965bf03f')
            expect(response.ok()).not.toBeTruthy();

            await page.pause();

        });

//Feature: Delete Project Members

//  Scenario: Delete project members with admin rights.
//  Given that the user is logged in.
//  When the project ID is provided.
//  When the user ID is provided.
//  When the user has admin rights.
//  Then the member is removed to the project.

   test('Admin Delete Project Members by id', async ({ page, request }) => {

            const response = await projectUsers.deleteProjectMember(request, token, projectId,
                                                                                  '2fb9e526-f39f-4959-a51c-8148965bf03f')
            expect(response.ok()).toBeTruthy();

            await page.pause();

        });

//Feature: Delete Project Members

//  Scenario: Delete project members without admin rights.
//  Given that the user is logged in.
//  When the project ID is provided.
//  When the user ID is provided.
//  When the user does not have admin rights.
//  Then an unauthorized error occurs.

   test('Non-Admin Delete Project Members by id', async ({ page, request }) => {

            const response = await projectUsers.deleteProjectMember(request, token, projectId,
                                                                                  '2fb9e526-f39f-4959-a51c-8148965bf03f')
            expect(response.ok()).not.toBeTruthy();

            await page.pause();

        });

//Feature: Create and Delete Project

//  Scenario: Create a project.
//  Given that the user is logged in.
//  Given the newProjectData.
//  Then the organization is created.
//  Given a new project is created.
//  Then the project will be deleted by its id.

     test('Create and Delete Project', async ({ page, request }) => {
        const newProjectData = {
                             organizationId: '41ce6db7-70fd-411d-b3d8-f2d5775ed501',
                             name: 'An example Testing Project',
                             description: 'Delete Project',
                         };

        const response = await projects.createProject(request, token, newProjectData);

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.id).toBeDefined();
        expect(respBody.name).toBe('An example Testing Project');
        expect(respBody.description).toBe('Delete Project');
//        store the project ID
        newProjectId = respBody.id;
        console.log(newProjectId)


        const deleteResponse = await projects.deleteProject(request, token, newProjectId);

        await page.pause();

    });


    //Feature: Update Project

    //Scenario: Update a project where the logged in user is an admin of the corresponding organization.
    //Given that the user is logged in
    //Given the updatedProjectData
    //When the existing project data is updated with the updatedProjectData
    //Then the project will be updated.

    test('Organization Admin Update Project', async ({ page, request }) => {

            const response = await projects.updateProject(request, token, updatedProjectData, projectId);

                    expect(response.ok()).toBeTruthy();
                    let respBody = await response.json();
                    expect(respBody.id).toBe('dda1148a-2251-4082-b838-6834251f59a0');
                    expect(respBody.name).toBe('Test Project 1.1');
                    expect(respBody.description).toBe('Test Project 1 for Organization 1');

            await page.pause();


           });

    //Scenario: Update a project where the logged in user has editing rights the corresponding organization.
    //Given that the user is logged in
    //Given the updatedProjectData
    //When the existing project data is updated with the updatedProjectData
    //Then the project will be updated.

    test('Organization Editor Update Project', async ({ page, request }) => {

            const response = await projects.updateProject(request, token, updatedProjectData, projectId);

                    expect(response.ok()).toBeTruthy();
                    let respBody = await response.json();
                    expect(respBody.id).toBe('dda1148a-2251-4082-b838-6834251f59a0');
                    expect(respBody.name).toBe('Test Project 1.1');
                    expect(respBody.description).toBe('Test Project 1 for Organization 1');

            await page.pause();


           });

    //Scenario: Update a project where the logged in user has reading rights the corresponding organization.
    //Given that the user is logged in
    //Given the updatedProjectData
    //When the existing project data is updated with the updatedProjectData
    //Then the project will not be updated. An unauthorized error is returned.

    test('Organization Reader Update Project', async ({ page, request }) => {

            const response = await projects.updateProject(request, token, updatedProjectData, projectId);

                    expect(response.ok()).not.toBeTruthy();

            await page.pause();


           });

});
