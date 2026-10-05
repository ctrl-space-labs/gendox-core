// Wording shared by the website row and the panel it opens. The schedule is
// stated once, in the row's tooltip, rather than spelled out again inside the
// panel where it pushed the actual controls down the page.

// `every 1440 min` is the number the database holds, not the thing a person means
export const everyText = minutes => {
  if (!minutes) return 'only when you ask'

  if (minutes % 10080 === 0) {
    const weeks = minutes / 10080

    return weeks === 1 ? 'once a week' : `every ${weeks} weeks`
  }

  if (minutes % 1440 === 0) {
    const days = minutes / 1440

    return days === 1 ? 'once a day' : `every ${days} days`
  }

  if (minutes % 60 === 0) {
    const hours = minutes / 60

    return hours === 1 ? 'once an hour' : `every ${hours} hours`
  }

  return `every ${minutes} minutes`
}

export const titleCase = name =>
  (name ?? '').toLowerCase().replace(/(^|[\s_-])(\w)/g, (_, gap, letter) => gap + letter.toUpperCase())

export const configOf = integration => {
  try {
    return JSON.parse(integration?.config || '{}')
  } catch {
    return {}
  }
}

export const arrangementOf = integration => {
  const config = configOf(integration)
  const provider = titleCase(config.provider ?? 'FIRECRAWL')

  return `${provider} reads this site ${everyText(integration?.runIntervalMinutes)}.`
}