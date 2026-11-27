import { useEffect, useRef, useState } from 'react'

// from this many items on, the list gets a search box
const SEARCH_FROM = 8

/**
 * A list of organizations or agents in a menu or a card. The current item comes first, the list scrolls,
 * and a long list gets a search box that filters it by name. In a menu the search box takes the focus, so
 * typing filters at once.
 *
 * @param items - [{ id, name, … }]
 * @param currentId - the item shown first
 * @param noun - e.g. 'organizations', for "Search organizations"
 * @param searchText - (item) => the text the search matches; the name by default
 * @param maxHeight - of the scrolling list, in px; the stylesheet's by default
 * @param children - (item) => the list item
 */
const MenuList = ({ items, currentId, noun, searchText = item => item.name, maxHeight, children }) => {
  const [query, setQuery] = useState('')
  const searchRef = useRef(null)

  useEffect(() => {
    if (searchRef.current?.closest('.pop')) searchRef.current.focus({ preventScroll: true })
  }, [])

  const current = items.filter(item => item.id === currentId)
  const others = items.filter(item => item.id !== currentId)
  const needle = query.trim().toLowerCase()
  const matches = [...current, ...others].filter(item => (searchText(item) || '').toLowerCase().includes(needle))

  return (
    <>
      {items.length >= SEARCH_FROM && (
        <input
          ref={searchRef}
          className='menu-search'
          type='search'
          aria-label={`Search ${noun}`}
          placeholder={`Search ${noun}`}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      )}
      <div className='menu-list' style={maxHeight ? { maxHeight } : undefined}>
        {matches.map(children)}
        {matches.length === 0 && (
          <div className='faint sm menu-empty'>
            No {noun} match “{query.trim()}”
          </div>
        )}
      </div>
    </>
  )
}

export default MenuList
