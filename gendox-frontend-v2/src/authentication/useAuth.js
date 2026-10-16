import { useContext } from 'react'
import { AuthContext } from 'src/authentication/context/AuthContext'

export const useAuth = () => useContext(AuthContext)
