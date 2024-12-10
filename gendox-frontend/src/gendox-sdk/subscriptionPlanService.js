import axios from "axios";
import apiRequests from "src/configs/apiRequest.js";

/**
 * Get organization Plans
 * @param organizationId
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<OrganizationPlan>>}
 */
const getOrganizationPlans = async (organizationId, storedToken) => {
  return axios.get(apiRequests.organizationPlans(organizationId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${storedToken}`
    }
  });
}

/**
 * Get active Subscription Plans
 * @param organizationId
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<SubscriptionPlan>>}
 */
const getActiveSubscriptionPlans = async (organizationId, storedToken) => {
  return axios.get(apiRequests.subscriptionPlans(organizationId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${storedToken}`
    }
  });
}

/**
 * Cancel subscription plan
 * @param organizationPlanId
 * @param organizationId
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<SubscriptionPlan>>} * 
 */
const cancelSubscriptionPlan = async (organizationPlanId, organizationId, storedToken) => {
    console.log("TOKEN", storedToken);
  return axios.put(apiRequests.cancelSubscriptionPlan(organizationPlanId, organizationId,), {},
  {
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`
      }
  });
}






export default {  
  getOrganizationPlans,
  getActiveSubscriptionPlans,
  cancelSubscriptionPlan
}