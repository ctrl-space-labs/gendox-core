/**
 * IDs from the test-data migrations (database/.../migrations/test-data). Roles per organization:
 *
 *              organization 1   organization 2   member of projects
 *   testuser1  ROLE_ADMIN       ROLE_EDITOR      1.1, 2.1
 *   testuser2  ROLE_EDITOR      ROLE_ADMIN       1.1, 2.2
 *   testuser3  ROLE_EDITOR      ROLE_READER      1.2, 2.1
 *   testuser4  ROLE_READER      ROLE_READER      1.1, 1.2
 */
module.exports = {
    organization1: '41ce6db7-70fd-411d-b3d8-f2d5775ed501',
    organization2: 'feedcb3e-708a-4a8f-b39b-630b06f048b6',
    project1_1: 'dda1148a-2251-4082-b838-6834251f59a0',
    project2_1: 'f6da74bb-2de4-4591-bb04-39b98894477e',
    testUser1: '19b6aa4a-48f4-4073-8b95-41039f090344',
    testUser2: '84817595-6c8e-4427-9b44-56671cbf4569',
    testUser3: '2fb9e526-f39f-4959-a51c-8148965bf03f',
    testUser4: '0644d778-b2fe-44d4-b8a9-ce9a63b15466',
};
