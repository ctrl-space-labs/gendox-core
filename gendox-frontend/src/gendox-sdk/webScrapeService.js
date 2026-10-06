import axios from 'axios'
import apiRequest from 'src/configs/apiRequest'

/**
 * Get the pages discovered for a web scrape integration
 * Sent with no sort, so the server orders by url: without an order Postgres
 * moves a row as soon as it is updated, and paging can repeat or skip rows
 * @param organizationId
 * @param integrationId
 * @param page
 * @param size
 * @param status
 * @param isSelected
 * @param hasContent
 * @param search
 * @param token
 * @returns {Promise<axios.AxiosResponse<WebScrapePage[]>}
 */
const getPages = async (organizationId, integrationId, page, size, status, isSelected, hasContent, search, token) => {
  return axios.get(
    apiRequest.webScrapePages(organizationId, integrationId, page, size, status, isSelected, hasContent, search),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      }
    }
  )
}

/**
 * Pick or unpick pages for the next run
 * Payload is { pageIds, selected } or { selectAll: true, selected }. The flag is
 * never omitted: the server rejects a body without it rather than defaulting it
 * @param organizationId
 * @param integrationId
 * @param payload
 * @param token
 * @returns {Promise<axios.AxiosResponse<void>}
 */
const updateSelection = async (organizationId, integrationId, payload, token) => {
  return axios.put(apiRequest.webScrapePageSelection(organizationId, integrationId), payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Take one page's content out of the project
 * The page stays on the list and can be read again; its document is deleted
 * @param organizationId
 * @param integrationId
 * @param pageId
 * @param token
 * @returns {Promise<axios.AxiosResponse<void>}
 */
const removePageContent = async (organizationId, integrationId, pageId, token) => {
  return axios.delete(apiRequest.webScrapePageContent(organizationId, integrationId, pageId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * List the pages the site exposes. Free, and answers 202
 * @param organizationId
 * @param integrationId
 * @param token
 * @returns {Promise<axios.AxiosResponse<void>}
 */
const crawl = async (organizationId, integrationId, token) => {
  return axios.post(
    apiRequest.webScrapeCrawl(organizationId, integrationId),
    {},
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      }
    }
  )
}

/**
 * Follow links to find what the first pass missed
 * Billed per page visited, and answers 202
 * @param organizationId
 * @param integrationId
 * @param token
 * @returns {Promise<axios.AxiosResponse<void>}
 */
const deepCrawl = async (organizationId, integrationId, token) => {
  return axios.post(
    apiRequest.webScrapeDeepCrawl(organizationId, integrationId),
    {},
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      }
    }
  )
}

/**
 * Read the picked pages and keep each one as a document. Answers 202
 * @param organizationId
 * @param integrationId
 * @param token
 * @returns {Promise<axios.AxiosResponse<void>}
 */
const scrape = async (organizationId, integrationId, token) => {
  return axios.post(
    apiRequest.webScrapeScrape(organizationId, integrationId),
    {},
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      }
    }
  )
}

/**
 * Update the schedule of a web scrape integration
 * Payload is { runIntervalMinutes, provider, crawlPageLimit }.
 * A missing field keeps what the integration has. Use the integration's
 * active switch to stop it running on its own.
 * @param organizationId
 * @param integrationId
 * @param payload
 * @param token
 * @returns {Promise<axios.AxiosResponse<void>}
 */
const updateSchedule = async (organizationId, integrationId, payload, token) => {
  return axios.put(apiRequest.webScrapeSchedule(organizationId, integrationId), payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Get the organization's monthly page allowance
 * Returns { maxPages, usedPages, remainingPages, period }. A null limit means
 * the budget is not enforced, which is not the same as a limit of zero
 * @param organizationId
 * @param token
 * @returns {Promise<axios.AxiosResponse<WebScrapeBudget>}
 */
const getBudget = async (organizationId, token) => {
  return axios.get(apiRequest.webScrapeBudget(organizationId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

export default {
  getPages,
  updateSelection,
  removePageContent,
  crawl,
  deepCrawl,
  scrape,
  updateSchedule,
  getBudget
}
