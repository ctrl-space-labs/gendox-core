Write Playwright e2e tests for the specified feature or API endpoint.

Target: $ARGUMENTS

Follow the existing Gendox e2e test patterns:

1. **Page Object (POM)** — Create or update in `gendox-e2e-tests/page-objects/apis/`
   ```javascript
   const config = require('../../tests.config');

   const getResource = async (request, token, id) => {
       const response = await request.get(
           `${config.gendox.contextPath}/your-endpoint/${id}`,
           {
               headers: {
                   'Authorization': 'Bearer ' + token,
                   'Content-Type': 'application/json'
               }
           }
       );
       return response;
   }

   module.exports = { getResource }
   ```

2. **Test spec** — Create in `gendox-e2e-tests/tests/api-tests/`
   ```javascript
   const { test, expect } = require('@playwright/test');
   const keycloak = require('../../page-objects/apis/keycloak');

   test.describe('Feature API', () => {
       let token;
       test.beforeAll(async ({ request }) => {
           const response = await keycloak.simpleUserLogin(request);
           let body = await response.json();
           token = body.access_token;
           expect(response.ok()).toBeTruthy();
       });

       test('should ...', async ({ request }) => {
           // test implementation
       });
   });
   ```

3. **Test coverage** — Include tests for:
   - CRUD operations (GET, POST, PUT, DELETE)
   - Pagination responses (`totalElements`, `content`)
   - Authorization (admin vs non-admin)
   - Validation errors (missing required fields → 400)
   - Not found cases → 404
   - Nested object assertions

4. **Run tests** to verify: `cd gendox-e2e-tests && npx playwright test tests/api-tests/<your-spec>.spec.js --project=chromium`

Reference existing tests in `gendox-e2e-tests/tests/api-tests/` for patterns.
