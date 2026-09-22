import { call } from './client'

const base = (orgId, integrationId) =>
  `/organizations/${orgId}/integrations/${integrationId}/web-scrape`

export const getProfile = () => call('/profile')

export const listWebsites = orgId => call(`/organizations/${orgId}/websites`)

export const listIntegrations = orgId =>
  call(`/integrations?organizationId=${orgId}&size=100`)

export function getPages(orgId, id, { page = 0, size = 20, status, isSelected } = {}) {
  const q = new URLSearchParams({ page, size })
  if (status) q.set('status', status)
  if (isSelected === true || isSelected === false) q.set('isSelected', isSelected)

  return call(`${base(orgId, id)}/pages?${q}`)
}

export const updateSelection = (orgId, id, body) =>
  call(`${base(orgId, id)}/pages/selection`, { method: 'PUT', body })

export const updateSchedule = (orgId, id, body) =>
  call(`${base(orgId, id)}/schedule`, { method: 'PUT', body })

export const crawl = (orgId, id) => call(`${base(orgId, id)}/crawl`, { method: 'POST' })

export const deepCrawl = (orgId, id) => call(`${base(orgId, id)}/deep-crawl`, { method: 'POST' })

export const scrape = (orgId, id) => call(`${base(orgId, id)}/scrape`, { method: 'POST' })