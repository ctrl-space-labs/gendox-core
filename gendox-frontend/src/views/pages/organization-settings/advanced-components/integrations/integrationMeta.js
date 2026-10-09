// The integration types the backend knows, named exactly as `IntegrationTypesConstants`
// names them, with the words the user reads for each one.
//
// The order of the list is the order of the rows: the kinds with something to do
// come first, and a type nobody has registered yet sorts last instead of vanishing.

export const WEB_SCRAPE_INTEGRATION = 'WEB_SCRAPE_INTEGRATION'
export const API_INTEGRATION = 'API_INTEGRATION'
export const AWS_S3_INTEGRATION = 'AWS_S3_INTEGRATION'
export const GIT_INTEGRATION = 'GIT_INTEGRATION'
export const GOOGLE_DRIVE_INTEGRATION = 'GOOGLE_DRIVE_INTEGRATION'
export const DROPBOX_INTEGRATION = 'DROPBOX_INTEGRATION'

export const INTEGRATION_TYPES = [
  { name: WEB_SCRAPE_INTEGRATION, label: 'Read by Gendox' },
  { name: API_INTEGRATION, label: 'Sends content in' },
  { name: AWS_S3_INTEGRATION, label: 'S3 queue' },
  { name: GIT_INTEGRATION, label: 'Git repository' },
  { name: GOOGLE_DRIVE_INTEGRATION, label: 'Google Drive' },
  { name: DROPBOX_INTEGRATION, label: 'Dropbox' }
]

export const labelOf = name => INTEGRATION_TYPES.find(type => type.name === name)?.label ?? name

export const rankOf = name => {
  const index = INTEGRATION_TYPES.findIndex(type => type.name === name)

  return index === -1 ? INTEGRATION_TYPES.length : index
}
