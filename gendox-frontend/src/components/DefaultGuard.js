// is used in the paged that are visible to both guests and authenticated users
// mainly for the embedded chat
import {useAuth} from "../hooks/useAuth";
import {useRouter} from "next/router";
import {useEffect} from "react";

const DefaultGuard = props => {
    const { children, fallback } = props
    const auth = useAuth()
    const router = useRouter()

    if (!router.isReady) {
        return;
    }
    if (auth.loading) {
        return fallback
    }

    return <>{children}</>
}


export default DefaultGuard