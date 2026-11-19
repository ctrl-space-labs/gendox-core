import { useState } from 'react'

// from this many items on, the list gets a search box
const SEARCH_FROM = 8

/**
 * A list of organizations or agents in a menu or a card. The current item comes first, the list scrolls,
 * and a long list gets a search box that filters it by name.
 *
 * @param items - [{ id, name, … }]
 * @param currentId - the item shown first
 * @param noun - e.g. 'organizations', for "Search organizations"
 * @param children - (item) => the list item
 */
const MenuList = ({ items, currentId, noun, children }) => {
  const [query, setQuery] = useState('')

  const current = items.filter(item => item.id === currentId)
  const others = items.filter(item => item.id !== currentId)
  const needle = query.trim().toLowerCase()
  const matches = [...current, ...others].filter(item => item.name?.toLowerCase().includes(needle))

  return (
    <>
      {items.length >= SEARCH_FROM && (
        <input
          className='menu-search'
          type='search'
          aria-label={`Search ${noun}`}
          placeholder={`Search ${noun}`}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      )}
      <div className='menu-list'>
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
