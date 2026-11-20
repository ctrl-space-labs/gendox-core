const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('../../../support/workspace');
const { sessionOf } = require('../../../support/login');
const { inProject } = require('../../../support/app');
const source = fs.readFileSync(path.resolve(__dirname, '../../../../gendox-desktop/src-tauri/src/client-tool-host.js'), 'utf8');

test.use({ storageState: sessionOf('testUser1') });

test('device notification preferences persist in the browser without desktop controls', async ({ page, workspace: w }) => {
  await page.addInitScript(() => {
    window.Notification = class { static permission = 'granted'; static requestPermission() { return Promise.resolve('granted') } };
  });
  await page.goto(inProject(w, 'user-profile'));
  await expect(page.getByRole('heading', { name: 'Notifications', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Desktop', exact: true })).toHaveCount(0);
  await page.getByRole('checkbox', { name: 'Enable notifications', exact: true }).check();
  await page.getByRole('checkbox', { name: 'An answer is ready in the background', exact: true }).uncheck();
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'Enable notifications', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'An answer is ready in the background', exact: true })).not.toBeChecked();
});

test('desktop settings select approval modes and folders through the frontend', async ({ page, workspace: w }) => {
  await page.addInitScript(source => {
    let folders = { folders: ['/workspace'], working_directory: '/workspace', enforcement_available: true };
    const install = (0, eval)(source + '; installClientToolHost');
    install({
      folders: async () => folders,
      chooseFolder: async () => { folders = { ...folders, folders: ['/workspace', '/additional'], chosen: true }; return folders; },
      setWorkingDirectory: async value => { folders = { ...folders, working_directory: value }; return folders; },
      notificationPermission: async () => 'granted', autostartEnabled: async () => false, deepLinks: async () => [], stop: async () => {}, activity: async () => {}, badge: async () => {}
    }, location.protocol + '//' + location.host);
  }, source);
  await page.goto(inProject(w, 'user-profile'));
  await expect(page.getByRole('heading', { name: 'Desktop', exact: true })).toBeVisible();
  await expect(page.getByLabel('Approval mode')).toHaveValue('ask');
  await page.getByLabel('Approval mode').selectOption('auto');
  await page.getByRole('button', { name: 'Allow another folder…', exact: true }).click();
  await expect(page.getByLabel('Working folder')).toHaveText(/additional/);
  await page.getByLabel('Working folder').selectOption('/additional');
  await expect(page.getByLabel('Working folder')).toHaveValue('/additional');
  await page.reload();
  await expect(page.getByLabel('Approval mode')).toHaveValue('auto');
  await page.getByLabel('Approval mode').selectOption('plan');
  await expect(page.getByLabel('Approval mode')).toHaveValue('plan');
  await expect(page.getByRole('checkbox', { name: 'Launch Gendox at login' })).not.toBeChecked();
});
