import React from 'react'
import useOrganizationProjectGuard from 'src/hooks/guards/useOrganizationProjectGuard'

const OrganizationProjectGuard = ({ children }) => {
  useOrganizationProjectGuard()
  return <>{children}</>
}

export default OrganizationProjectGuard
