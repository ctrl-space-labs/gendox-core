import axios from 'axios'
import apiRequests from 'src/configs/apiRequest.js'

/**
 * Get organization Plans
 * @param organizationId
 * @param token
 * @returns {Promise<axios.AxiosResponse<OrganizationPlan>>}
 */
const getOrganizationPlans = async (organizationId, token) => {
  return axios.get(apiRequests.organizationPlans(organizationId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })
}

/**
 * Get active Subscription Plans
 * @param organizationId
 * @param token
 * @returns {Promise<axios.AxiosResponse<SubscriptionPlan>>}
 */
const getActiveSubscriptionPlans = async (organizationId, token) => {
  return axios.get(apiRequests.subscriptionPlans(organizationId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })
}

/**
 * Cancel subscription plan
 * @param organizationPlanId
 * @param organizationId
 * @param token
 * @returns {Promise<axios.AxiosResponse<SubscriptionPlan>>} *
 */
const cancelSubscriptionPlan = async (organizationPlanId, organizationId, token) => {
  return axios.put(
    apiRequests.cancelSubscriptionPlan(organizationPlanId, organizationId),
    {},
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    }
  )
}

export default {
  getOrganizationPlans,
  getActiveSubscriptionPlans,
  cancelSubscriptionPlan
}
