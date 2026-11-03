import { useEffect, useState } from 'react'

/** The app's colour mode as shown now ('light' | 'dark', data-theme on <html>), following every change */
const useAppTheme = () => {
  const [theme, setTheme] = useState(null)

  useEffect(() => {
    const root = document.documentElement
    const read = () => setTheme(root.dataset.theme === 'light' ? 'light' : 'dark')
    read()
    const observer = new MutationObserver(read)
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })

    return () => observer.disconnect()
  }, [])

  return theme
}

export default useAppTheme
