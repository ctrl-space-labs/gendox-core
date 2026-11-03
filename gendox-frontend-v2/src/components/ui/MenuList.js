import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

/**
 * A list in a menu or a card that shows the first few items and the rest on request, so a long list of
 * organizations or agents doesn't fill the menu; "Show fewer" folds it again. The current item always comes first.
 * The menu renders its content only while open, so each time it opens the list is short again.
 *
 * @param items - [{ id, … }]
 * @param currentId - the item shown first
 * @param limit - how many show before "Show all"
 * @param noun - e.g. 'organizations', for "Show all 24 organizations"
 * @param children - (item) => the menu item
 * @param toggleClassName - the "Show all" button's class: 'mi' in a menu, 'item' in a card
 */
const MenuList = ({ items, currentId, limit = 5, noun, children, toggleClassName = 'mi' }) => {
  const [all, setAll] = useState(false)

  const current = items.filter(item => item.id === currentId)
  const ordered = [...current, ...items.filter(item => item.id !== currentId)]
  // a list only just over the limit is shown whole: a button for one or two more saves nothing
  const long = ordered.length > limit + 2
  const short = long && !all
  const shown = short ? ordered.slice(0, limit) : ordered

  return (
    <>
      {shown.map(children)}
      {long && (
        <button className={toggleClassName} style={{ color: 'var(--text-2)' }} onClick={() => setAll(!all)}>
          {all ? <ChevronUp className='lucide' /> : <ChevronDown className='lucide' />}
          {all ? 'Show fewer' : `Show all ${ordered.length} ${noun}`}
        </button>
      )}
    </>
  )
}

export default MenuList
