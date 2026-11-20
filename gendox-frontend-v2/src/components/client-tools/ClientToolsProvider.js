import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { initializeClientDevice } from 'src/store/clientDevice/clientDevice'
import NotificationsProvider from 'src/components/client-tools/NotificationsProvider'
import ToolApprovalsProvider from 'src/components/client-tools/ToolApprovalsProvider'
import DesktopCommandRunner from 'src/components/client-tools/DesktopCommandRunner'
import ConversationLinks from 'src/components/client-tools/ConversationLinks'

/**
 * Everything about this device that the whole app needs: notifications, tool approvals and,
 * in the desktop app, local commands and gendox:// links.
 */
const ClientToolsProvider = ({ children }) => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(initializeClientDevice())
  }, [dispatch])

  return (
    <NotificationsProvider>
      <ToolApprovalsProvider>
        {children}
        <DesktopCommandRunner />
        <ConversationLinks />
      </ToolApprovalsProvider>
    </NotificationsProvider>
  )
}

export default ClientToolsProvider
