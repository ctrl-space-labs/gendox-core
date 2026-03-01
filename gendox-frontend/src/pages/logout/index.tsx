import React, { useEffect } from 'react'
import userManager from 'src/services/authService'

const LogoutPage = () => {
  useEffect(() => {
    userManager
      .signoutRedirectCallback()
      .then(() => {
        console.log('User signed out successfully')
        userManager.removeUser()
        window.location.href = '/'
      })
      .catch((error: any) => {
        console.error('Error during logout:', error)
        window.location.href = '/error'
      })
  }, [])

  return <div>Logging out...</div>
}

export default LogoutPage
