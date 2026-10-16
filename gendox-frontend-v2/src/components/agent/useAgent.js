import { useCallback, useEffect } from 'react'
import axios from 'axios'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from 'src/authentication/useAuth'
import useActiveScope from 'src/hooks/useActiveScope'
import { fetchProject } from 'src/store/activeProject/activeProject'
import projectService from 'src/gendox-sdk/projectService'
import userService from 'src/gendox-sdk/userService'
import apiRequests from 'src/configs/apiRequest'
import { userDataActions } from 'src/store/userData/userData'
import { localStorageConstants } from 'src/utils/generalConstants'
import { isValidOrganizationAndProject } from 'src/utils/validators'

export const getToken = () => window.localStorage.getItem(localStorageConstants.accessTokenKey)

/**
 * Reloads the signed-in user's profile (organizations, agents and their names) after one of them changed.
 * The API keeps the profile in a cache, so it is cleared first. The user is updated in place: going through the
 * auth provider's loadUserProfileFromAuthState would show its full-page loader and remount the page.
 */
export const useRefreshProfile = () => {
  const { setUser } = useAuth()
  const dispatch = useDispatch()

  return useCallback(async () => {
    const token = getToken()
    try {
      await userService.deleteProfileCaches(token)
    } catch {
      // a stale profile only delays the new name in the sidebar
    }
    try {
      const response = await axios.get(apiRequests.getProfile, { headers: { Authorization: 'Bearer ' + token } })
      setUser(response.data)
      window.localStorage.setItem(localStorageConstants.userDataKey, JSON.stringify(response.data))
      dispatch(userDataActions.getUserData(response.data))
    } catch {
      // the next sign-in loads it
    }
  }, [setUser, dispatch])
}

/**
 * The agent (project) in the URL, loaded in full, and a way to save changes to it.
 *
 * save({ project, agent }) sends PUT …/projects/{p} with the whole project, `project` merged into it
 * and `agent` merged into its projectAgent, then reloads it.
 */
const useAgent = () => {
  const dispatch = useDispatch()
  const { user } = useAuth()
  const scope = useActiveScope()
  const { organizationId, projectId } = scope
  const { projectDetails, projectMembers } = useSelector(state => state.activeProject)

  const isValid = isValidOrganizationAndProject(organizationId, projectId, user)
  const project = projectDetails?.id === projectId ? projectDetails : null

  const reload = useCallback(() => {
    if (isValid) return dispatch(fetchProject({ organizationId, projectId, token: getToken() }))
  }, [dispatch, isValid, organizationId, projectId])

  useEffect(() => {
    reload()
  }, [reload])

  const save = useCallback(
    async ({ project: projectChanges = {}, agent: agentChanges = {} }) => {
      const payload = {
        ...project,
        ...projectChanges,
        projectAgent: { ...project.projectAgent, ...agentChanges }
      }
      const response = await projectService.updateProject(organizationId, projectId, payload, getToken())
      await reload()

      return response.data
    },
    [project, organizationId, projectId, reload]
  )

  return { ...scope, project, members: project ? projectMembers : [], save, reload }
}

export default useAgent
