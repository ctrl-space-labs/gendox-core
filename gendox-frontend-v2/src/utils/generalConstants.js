
let generalConstants = {
    NO_AUTH_TOKEN: 'NO_AUTH_TOKEN',
    LOCAL_STORAGE_THREAD_IDS_NAME: 'localThreadIds',
}

let localStorageConstants = {
  accessTokenKey: 'accessToken',
  refreshTokenKey: 'refreshToken', // logout | refreshToken
  selectedOrganizationId: 'activeOrganizationId',
  selectedProjectId: 'activeProjectId',
  userDataKey: 'userData',
  sidebarCollapsed: 'sidebarCollapsed', // 'true' when the user hid the sidebar on a wide screen

}

export {
  generalConstants,
  localStorageConstants
};
