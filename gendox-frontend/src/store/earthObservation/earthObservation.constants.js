export const LAYOUT = {
  DEFAULT: 'DEFAULT',
  MAP_MAX: 'MAP_MAX',
  CHAT_MAX: 'CHAT_MAX',
  EDITOR_MAX: 'EDITOR_MAX',
  MAP_MIN: 'MAP_MIN'
}

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
