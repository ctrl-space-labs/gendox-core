import { useAuth } from 'src/hooks/useAuth'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useDispatch } from 'react-redux'
import { activeProjectActions } from 'src/store/apps/activeProject/activeProject'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Config
import authConfig from 'src/configs/auth'

const Navigation = () => {
  const auth = useAuth()
  const [navigationItems, setNavigationItems] = useState([])

  const routerFromUrl = useRouter()
  const { query } = routerFromUrl
  const { organizationId } = query

  const dispatch = useDispatch()

  useEffect(() => {
    if (auth.user && auth.user.organizations) {
      const activeOrganization = auth.user.organizations.find(org => org.id === organizationId)
      const storedActiveProjectId = window.localStorage.getItem(authConfig.selectedProjectId)

      if (activeOrganization && activeOrganization.projects) {
        const projects = activeOrganization.projects.map(project => {
          return {
            title: project.name,
            path: `/gendox/home?organizationId=${activeOrganization.id}&projectId=${project.id}`

            // children: [
            //   {
            //     icon: 'mdi:cog-outline',
            //     path: `/gendox/project-settings?organizationId=${activeOrganization.id}&projectId=${project.id}`
            //   }
            // ]
          }
        })

        setNavigationItems([
          {
            sectionTitle: 'Projects'
          },
          ...projects,
          {
            icon: 'mdi:cog-outline',
            path: `/gendox/project-settings?organizationId=${activeOrganization.id}&projectId=${storedActiveProjectId}`
          },
          {
            icon: 'mdi:chat',
            path: `/gendox/chat?organizationId=${activeOrganization.id}&projectId=${storedActiveProjectId}`
          }
        ])
      }
    }
  }, [auth, organizationId, dispatch])

  return navigationItems
}

export default Navigation
