import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { threadHidden, threadShown } from 'src/store/clientDevice/clientDevice'

/**
 * Records whether a chat thread is on screen, so its answers and approvals need no notification.
 * @param threadId the thread shown by the element
 * @param elementRef a ref to the element that shows it
 */
const useVisibleThread = (threadId, elementRef) => {
  const dispatch = useDispatch()

  useEffect(() => {
    if (!threadId || !elementRef.current) return
    let shown = false
    const observer = new IntersectionObserver(entries => {
      const visible = entries[0].isIntersecting
      if (visible === shown) return
      shown = visible
      dispatch(visible ? threadShown(threadId) : threadHidden(threadId))
    })
    observer.observe(elementRef.current)

    return () => {
      observer.disconnect()
      if (shown) dispatch(threadHidden(threadId))
    }
  }, [threadId, elementRef, dispatch])
}

export default useVisibleThread
