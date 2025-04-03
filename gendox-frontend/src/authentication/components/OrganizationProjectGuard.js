import React from 'react'
import useOrganizationProjectGuard from 'src/hooks/guards/useOrganizationProjectGuard'

const OrganizationProjectGuard = ({ authProviderOption, pageConfig, children }) => {

  useOrganizationProjectGuard(authProviderOption, pageConfig)

  return <>{children}</>
}

export default OrganizationProjectGuard
