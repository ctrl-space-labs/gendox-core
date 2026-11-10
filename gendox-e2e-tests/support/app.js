const path = require('path');
const config = require('../tests.config');

/**
 * Small helpers the browser tests share. Screens are addressed by URL with the
 * organization and project in the query, which is how the application links to them.
 */
const inProject = (workspace, screen) =>
    `/gendox/${screen}/?organizationId=${workspace.organizationId}&projectId=${workspace.projectId}`;

// Resolves with the API's response to the next request of this method on this path.
const apiResponse = (page, method, pathPattern) => page.waitForResponse(response =>
    response.request().method() === method &&
    response.url().includes(config.gendox.contextPath) &&
    pathPattern.test(new URL(response.url()).pathname));

// Fails with what the API answered, which a bare status check would hide.
const expectOk = async (response) => {
    if (!response.ok()) {
        const request = response.request();
        throw new Error(`${request.method()} ${new URL(response.url()).pathname} answered ${response.status()}: ` +
            `${(await response.text()).slice(0, 500)}\nSent: ${(request.postData() || '').slice(0, 500)}`);
    }
};

// The settings screens render before the project has loaded, and their tabs fail when
// clicked that early. Wait until the form shows the loaded project.
const projectSettingsLoaded = (page) =>
    require('@playwright/test').expect(page.getByRole('textbox', { name: 'Project Name' })).toHaveValue(/.+/);

const textFile = path.resolve(__dirname, '../fixtures/least-squares.txt');

module.exports = { inProject, apiResponse, expectOk, projectSettingsLoaded, textFile };
