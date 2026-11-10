const { test, expect, sharedWorkspace, ensureAccess, tokenFor } = require('../../support/workspace');
const projects = require('../../page-objects/apis/projects');
const projectUsers = require('../../page-objects/apis/projectUsers');
const seed = require('../../page-objects/apis/seed');

test.describe('Projects CRUD API', () => {

    let adminToken;
    let editorToken;
    let readerToken;
    let outsiderToken;

    // Changes go to an organization and project of this file. Reading uses the seeded ones.
    // testUser3 is in the organization but not in the project, to be added and removed.
    const workspace = sharedWorkspace('projects', {
        members: { testUser2: 'ROLE_EDITOR', testUser3: 'ROLE_EDITOR', testUser4: 'ROLE_READER' },
        projectMembers: ['testUser2', 'testUser4'],
    });

    test.beforeAll(async ({ request }) => {
        adminToken = await tokenFor(request, 'testUser1');
        editorToken = await tokenFor(request, 'testUser2');
        readerToken = await tokenFor(request, 'testUser4');
        outsiderToken = await tokenFor(request, 'outsider');
    });

    const projectUpdate = async (request, description) => {
        const response = await projects.getProjectById(request, adminToken, workspace.organizationId, workspace.projectId);
        expect(response.ok()).toBeTruthy();
        return { ...(await response.json()), description };
    };


//Feature: Get Project by ID

//  Scenario: Get Project by ID.
//  Given that the user is logged in.
//  Given the project ID.
//  Then from the selected project is returned.

    test('Get Project by id', { tag: '@smoke' }, async ({ request }) => {

        const response = await projects.getProjectById(request, adminToken, seed.organization1, seed.project1_1);

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.id).toBe(seed.project1_1);
        expect(respBody.name).toBe('Test Project 1.1');

    });

//Feature: Get All Projects

//  Scenario: Get the Projects of an Organization.
//  Given that the user is logged in.
//  When the organization ID is provided.
//  Then the Projects of the organization are returned.

    test('Get Projects By Organization', async ({ request }) => {

        const response = await projects.getProjectsByOrganization(request, adminToken, seed.organization1);

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        let project1 = respBody.content.find(project => project.name === 'Test Project 1.1');
        expect(project1.organizationId).toBe(seed.organization1);
        expect(project1.projectAgent.agentName).toBe('test-project-1_1 Agent');

    });

//  Scenario: Get the Projects of an Organization the user does not belong to.
//  Given that the user is logged in.
//  When the user is not a member of the organization.
//  Then no project is revealed.

    test('Outsider Gets Projects By Organization', { tag: '@smoke' }, async ({ request }) => {

        const response = await projects.getProjectsByOrganization(request, outsiderToken, seed.organization1);

        // Access denied is answered as not found, so it does not reveal what exists.
        expect(response.status()).toBe(404);

    });

//Feature: Get Project Members

//  Scenario: Get Project Members by id.
//  Given that the user is logged in.
//  When the project ID is provided.
//  Then all the project members from the selected project are returned.

    test('Get Project Members by id', async ({ request }) => {

        const response = await projectUsers.getProjectMembers(request, adminToken, seed.organization1, seed.project1_1);

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        const emails = respBody.map(member => member.user.email);
        expect(emails).toContain('testuser1@test.com');

    });

//Feature: Add and Delete Project Members

//  Scenario: Add and delete project members with admin rights.
//  Given that the user is logged in.
//  When the project ID is provided.
//  When the user ID is provided.
//  When the user has admin rights.
//  Then the member is added to the project.
//  Then the member is removed from the project.

    test('Admin Add and Delete Project Members by id', async ({ request }) => {

        const added = await projectUsers.addProjectMember(request, adminToken, workspace.organizationId, workspace.projectId, seed.testUser3);
        expect(added.ok()).toBeTruthy();

        const deleted = await projectUsers.deleteProjectMember(request, adminToken, workspace.organizationId, workspace.projectId, seed.testUser3);
        expect(deleted.ok()).toBeTruthy();

    });

//  Scenario: Add project members without the permission.
//  Given that the user is logged in.
//  When the user has only reading rights.
//  Then an access denied error occurs.

    test('Reader Add Project Members by id', async ({ request }) => {

        const response = await projectUsers.addProjectMember(request, readerToken, workspace.organizationId, workspace.projectId, seed.testUser3);

        expect(response.status()).toBe(404);

    });

//  Scenario: Delete project members without the permission.
//  Given that the user is logged in.
//  When the user has editing rights, which do not include removing members.
//  Then an access denied error occurs.

    test('Editor Delete Project Members by id', async ({ request }) => {

        const response = await projectUsers.deleteProjectMember(request, editorToken, workspace.organizationId, workspace.projectId, seed.testUser1);

        expect(response.status()).toBe(404);

    });

//Feature: Create and Deactivate Project

//  Scenario: Create a project.
//  Given that the user is logged in.
//  Given the newProjectData.
//  Then the project is created.
//  Then the project will be deactivated by its id.

    test('Create and Deactivate Project', async ({ request }) => {
        const newProjectData = {
            organizationId: workspace.organizationId,
            name: 'An example Testing Project',
            description: 'Delete Project',
        };

        const response = await projects.createProject(request, adminToken, newProjectData);

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.id).toBeDefined();
        expect(respBody.name).toBe('An example Testing Project');
        expect(respBody.description).toBe('Delete Project');

        await ensureAccess(request, adminToken, workspace.organizationId, respBody.id);
        const deactivated = await projects.deactivateProject(request, adminToken, workspace.organizationId, respBody.id);

        expect(deactivated.ok()).toBeTruthy();

    });


    //Feature: Update Project

    //Scenario: Update a project where the logged in user is an admin of the corresponding organization.
    //Given that the user is logged in
    //When the existing project data is updated
    //Then the project will be updated.

    test('Organization Admin Update Project', async ({ request }) => {

        const update = await projectUpdate(request, 'Updated by an admin');

        const response = await projects.updateProject(request, adminToken, update);

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.id).toBe(workspace.projectId);
        expect(respBody.description).toBe('Updated by an admin');

    });

    //Scenario: Update a project where the logged in user has editing rights the corresponding organization.
    //Given that the user is logged in
    //When the existing project data is updated
    //Then the project will be updated.

    test('Organization Editor Update Project', async ({ request }) => {

        const update = await projectUpdate(request, 'Updated by an editor');

        const response = await projects.updateProject(request, editorToken, update);

        expect(response.ok()).toBeTruthy();
        let respBody = await response.json();
        expect(respBody.description).toBe('Updated by an editor');

    });

    //Scenario: Update a project where the logged in user has reading rights the corresponding organization.
    //Given that the user is logged in
    //When the existing project data is updated
    //Then the project will not be updated. An access denied error is returned.

    test('Organization Reader Update Project', async ({ request }) => {

        const update = await projectUpdate(request, 'Updated by a reader');

        const response = await projects.updateProject(request, readerToken, update);

        expect(response.status()).toBe(404);

    });

});
