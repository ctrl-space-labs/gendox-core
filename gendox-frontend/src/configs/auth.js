export default {
  getProfile: 'https://dev.gendox.ctrlspace.dev/gendox/api/v1/profile',
  loginEndpoint: 'https://dev.gendox.ctrlspace.dev/idp/realms/gendox-idp-dev/protocol/openid-connect/token',
  registerEndpoint: '/jwt/register',
  storageTokenKeyName: 'accessToken',
  onTokenExpiration: 'refreshToken', // logout | refreshToken
  selectedOrganizationId: 'activeOrganizationId',
  selectedProjectId: 'activeProjectId',
  user: 'userData'
}