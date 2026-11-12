/**
 * Features that are available only on some subscription plans.
 *
 * Controls that are not available on the organization's plan are shown disabled, with a note
 * about the plan that is required, so that the feature stays discoverable.
 *
 * This drives the UI only. The backend is the control, plan limits are enforced there.
 */

export const planFeatures = {
  INVITE_USERS: 'INVITE_USERS',
  WEB_SCRAPE: 'WEB_SCRAPE'
}

/**
 * Plans that do NOT have a given feature. Every other plan, including plans that are not listed
 * here yet, is treated as having it, so that a newly added plan never silently disables a control.
 */
const excludedSkusByFeature = {
  [planFeatures.INVITE_USERS]: ['gd-free-001']
}

export const planFeatureMessages = {
  [planFeatures.INVITE_USERS]: 'Inviting members requires at least a Basic subscription.',
  [planFeatures.WEB_SCRAPE]: 'Reading websites isn’t included in this plan.'
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

/**
 * Web scraping is defined by a number, not by name: the plan's monthly page limit. It is read from
 * GET …/web-scrape/budget, which already applies the seats and whether limits are enforced at all.
 * @param budget the budget, or null while it loads
 * @returns {boolean} false only when the plan allows no pages (maxPages 0). A missing maxPages means limits
 *   are not enforced, which is not the same as a limit of zero, and a budget still loading allows it too.
 */
export const hasWebScrape = budget => budget?.maxPages !== 0

export default planFeatures
