import React from 'react'
import useOrganizationProjectGuard from 'src/hooks/guards/useOrganizationProjectGuard'

const OrganizationProjectGuard = ({ authProviderOption, children }) => {
  // Skip the guard if the auth provider is IFrameAuthProvider
  if (authProviderOption !== 'IFrameAuthProvider') {
    useOrganizationProjectGuard()
  }
  return <>{children}</>
}

export default OrganizationProjectGuard
