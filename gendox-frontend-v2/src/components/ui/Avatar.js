import { getHue, getInitials } from 'src/utils/avatarUtils'

/**
 * The tinted square (or round) with initials used for agents, organizations and people.
 * @param name - shown as initials and as the tooltip
 * @param seed - what the colour is derived from (an id); defaults to the name
 * @param size - 's' | 'l' | undefined
 */
const Avatar = ({ name, seed, size = '', round = false, children }) => {
  return (
    <span
      className={`avatar ${size} ${round ? 'round' : ''}`}
      style={{ '--h': getHue(seed ?? name ?? '') }}
      title={name}
    >
      {children ?? getInitials(name)}
    </span>
  )
}

export default Avatar
