// A helper function to parse the hex value into r, g, and b
const parseHexToRgb = (hexCode) => {
  // Remove the '#' if present
  let hex = hexCode.replace(/^#/, '')

  // Expand shorthand (#abc => #aabbcc)
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }

  // Convert to integers (default to 0 for invalid substrings)
  const r = parseInt(hex.slice(0, 2), 16) || 0
  const g = parseInt(hex.slice(2, 4), 16) || 0
  const b = parseInt(hex.slice(4, 6), 16) || 0

  return { r, g, b }
}

/**
 * Convert a hex color to an rgba() string
 * @param {string} hexCode - The hex code (e.g. '#08B68D', '#fff', etc.)
 * @param {number} opacity - The opacity for the rgba() string (0 to 1 for CSS)
 * @returns {string} - Example: 'rgba(8, 182, 141, 0.5)'
 */
export const hexToRGBA = (hexCode, opacity = 1) => {
  const { r, g, b } = parseHexToRgb(hexCode)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * Convert a hex color to an RGBA array
 * @param {string} hexCode - The hex code (e.g. '#08B68D', '#fff', etc.)
 * @param {number} alpha - The alpha for the RGBA array (0 to 255)
 * @returns {number[]} - Example: [8, 182, 141, 128]
 */
export const hexToRGBAArray = (hexCode, alpha = 255) => {
  const { r, g, b } = parseHexToRgb(hexCode)
  return [r, g, b, alpha]
}
