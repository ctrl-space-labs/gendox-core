import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from 'src/authentication/useAuth'
import { localStorageConstants } from 'src/utils/generalConstants'

// The widget plugin reads its settings from the script tag with this id
const SCRIPT_ID = 'gendox-chat-script'

// Not the plugin's default ids: the Earth Observation workspace mounts its own widget with those
const CONTAINER_ID = 'gendox-assistant-container'
const IFRAME_ID = 'gendox-assistant-iframe'

const PAGE_CONTEXT_TYPE = 'GENDOX_PAGE'

// Pages with a chat of their own
const EXCLUDED_ROUTES = ['/gendox/chat', '/gendox/embed', '/gendox/tasks/earth-observation']

const stripSlash = path => (path.length > 1 ? path.replace(/\/+$/, '') : path)

const readStorage = key => {
  try {
    return window.localStorage.getItem(key)
  } catch (e) {
    return null
  }
}

const removeWidget = () => {
  try {
    window.gendox?.widget?.removeLocalContextRequestCallback?.(PAGE_CONTEXT_TYPE)
  } catch (e) {
    // not registered: nothing to remove
  }
  document.getElementById(SCRIPT_ID)?.remove()
  document.getElementById(CONTAINER_ID)?.remove()
}

/**
 * The Gendox assistant: the chat widget of the project the user is visiting, on every page of
 * the app. Each message carries the route the user is on (a GENDOX_PAGE local context with
 * source "gendox-app"), which is what the gendox-assistant skill keys on.
 *
 * Loads once per project and stays open across page changes; switching project reloads it with
 * that project's agent.
 */
const GendoxAssistant = () => {
  const router = useRouter()
  const { user } = useAuth()

  const organizationId = router.query.organizationId || readStorage(localStorageConstants.selectedOrganizationId)
  const projectId = router.query.projectId || readStorage(localStorageConstants.selectedProjectId)
  const pathname = stripSlash(router.pathname || '')
  const excluded = EXCLUDED_ROUTES.some(route => pathname.startsWith(route))

  // read on every message, so the context is always the page the user is on now
  const pageRef = useRef({})
  useEffect(() => {
    pageRef.current = { asPath: router.asPath, query: router.query }
  }, [router.asPath, router.query])

  const enabled = router.isReady && Boolean(user) && !excluded && Boolean(organizationId) && Boolean(projectId)

  useEffect(() => {
    if (!enabled) return undefined

    removeWidget()

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.setAttribute('data-gendox-src', window.location.origin)
    script.setAttribute('data-organization-id', organizationId)
    script.setAttribute('data-project-id', projectId)
    script.setAttribute('data-gendox-container-id', CONTAINER_ID)
    script.setAttribute('data-gendox-iframe-id', IFRAME_ID)
    script.setAttribute('data-gendox-chat-initial-state', 'closed')
    script.setAttribute('data-gendox-local-context-max-responses', '4')
    script.setAttribute('data-gendox-local-context-max-wait-ms', '1000')
    script.src = `${window.location.origin}/gendox-sdk/gendox-widget-plugin.js`
    script.onload = () => {
      window.gendox?.widget?.addLocalContextRequestCallback?.(PAGE_CONTEXT_TYPE, () => {
        const { asPath, query } = pageRef.current
        const context = {
          source: 'gendox-app',
          route: asPath,
          pageTitle: document.title,
          organizationId: query.organizationId || organizationId,
          projectId: query.projectId || projectId,
          taskId: query.taskId,
          documentId: query.documentId
        }
        Object.keys(context).forEach(key => context[key] === undefined && delete context[key])

        return { contextType: PAGE_CONTEXT_TYPE, value: JSON.stringify(context) }
      })
    }
    document.head.appendChild(script)

    return removeWidget
  }, [enabled, organizationId, projectId])

  return null
}

export default GendoxAssistant
