/**
 * Features that are available only on some subscription plans.
 *
 * Controls that are not available on the organization's plan are shown disabled, with a note
 * about the plan that is required, so that the feature stays discoverable.
 *
 * This drives the UI only. The backend is the control, plan limits are enforced there.
 */

export const planFeatures = {
  INVITE_USERS: 'INVITE_USERS'
}

/**
 * Plans that do NOT have a given feature. Every other plan, including plans that are not listed
 * here yet, is treated as having it, so that a newly added plan never silently disables a control.
 */
const excludedSkusByFeature = {
  [planFeatures.INVITE_USERS]: ['gd-free-001']
}

export const planFeatureMessages = {
  [planFeatures.INVITE_USERS]: 'Inviting members requires at least a Basic subscription.'
}

/**
 * @param {string} sku the SKU of the organization's active subscription plan
 * @param {string} feature one of `planFeatures`
 * @returns {boolean} true when the plan has the feature
 */
export const hasPlanFeature = (sku, feature) => {
  if (!sku) return true

  const excludedSkus = excludedSkusByFeature[feature]
  if (!excludedSkus) return true

  return !excludedSkus.includes(sku)
}

export default planFeatures
