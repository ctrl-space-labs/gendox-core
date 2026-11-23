import axios from 'axios'
import apiRequests from 'src/configs/apiRequest'

/**
 * Get all ai Model Providers
 * @param organizationId
 * @param token
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>>}
 */
const getAllAiModelProviders = async (organizationId, token) => {
  return axios.get(apiRequests.getAiModelProviders(organizationId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Get model key by organization id
 * @param organizationId
 * @param token
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>>}
 */
const getModelKeysByOrganizationId = async (organizationId, token) => {
  return axios.get(apiRequests.aiModelKeys(organizationId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Create a new ai model key
 * @param organizationId
 * @param token
 * @param payload
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>>}
 */
const createAiModelKey = async (organizationId, token, payload) => {
  return axios.post(apiRequests.aiModelKeys(organizationId), payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Update ai model key
 * @param organizationId
 * @param modelProviderKeyId
 * @param token
 * @param payload
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>>}
 */
const updateAiModelKey = async (organizationId, modelProviderKeyId, token, payload) => {
  return axios.put(apiRequests.updateAiModelKey(organizationId, modelProviderKeyId), payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Delete ai model key
 * @param organizationId
 * @param modelProviderKeyId
 * @param token
 * @returns {Promise<axios.AxiosResponse<OrganizationUsers[]>>}
 */
const deleteAiModelKey = async (organizationId, modelProviderKeyId, token) => {
  return axios.delete(apiRequests.deleteAiModelKey(organizationId, modelProviderKeyId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

const authorized = token => ({ headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token } })

// @param provider - { id?, name, baseUrl } of one of the organization's own providers
const saveOrganizationAiModelProvider = async (organizationId, token, provider) =>
  provider.id
    ? axios.put(`${apiRequests.getAiModelProviders(organizationId)}/${provider.id}`, provider, authorized(token))
    : axios.post(apiRequests.getAiModelProviders(organizationId), provider, authorized(token))

const deleteOrganizationAiModelProvider = async (organizationId, providerId, token) =>
  axios.delete(`${apiRequests.getAiModelProviders(organizationId)}/${providerId}`, authorized(token))

// The organization's own models (active and inactive), on its own providers
const getOrganizationAiModels = async (organizationId, token) =>
  axios.get(apiRequests.organizationAiModels(organizationId), authorized(token))

// @param model - { id?, name, model, aiModelProvider: { id }, aiModelType: { name }, apiType: { name }, isActive }
const saveOrganizationAiModel = async (organizationId, token, model) =>
  model.id
    ? axios.put(apiRequests.organizationAiModels(organizationId, model.id), model, authorized(token))
    : axios.post(apiRequests.organizationAiModels(organizationId), model, authorized(token))

// Tests a model before it is saved: one small request to it; returns { ok, message, millis }
const testOrganizationAiModel = async (organizationId, token, model) =>
  axios.post(apiRequests.organizationAiModelTests(organizationId), model, authorized(token))

const deleteOrganizationAiModel = async (organizationId, modelId, token) =>
  axios.delete(apiRequests.organizationAiModels(organizationId, modelId), authorized(token))

export default {
  saveOrganizationAiModelProvider,
  deleteOrganizationAiModelProvider,
  getOrganizationAiModels,
  saveOrganizationAiModel,
  testOrganizationAiModel,
  deleteOrganizationAiModel,
  getAllAiModelProviders,
  getModelKeysByOrganizationId,
  createAiModelKey,
  updateAiModelKey,
  deleteAiModelKey
}
