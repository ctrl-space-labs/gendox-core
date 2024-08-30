// is used in the paged that are visible to both guests and authenticated users
// mainly for the embedded chat
import {useAuth} from "../hooks/useAuth";

const DefaultGuard = props => {
    const { children, fallback } = props
    const auth = useAuth()
    if (auth.loading) {
        return fallback
    }

    return <>{children}</>
}


export default DefaultGuard