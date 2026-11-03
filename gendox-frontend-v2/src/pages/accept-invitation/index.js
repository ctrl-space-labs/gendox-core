import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { ArrowRight, Check, ClockAlert } from 'lucide-react'
import invitationService from 'src/gendox-sdk/invitationService'
import { routeTypes } from 'src/authentication/components/RouteHandler'
import { ROLES, roleTitle } from 'src/components/agent/roles'

const REDIRECT_SECONDS = 3

const article = word => (/^[aeiou]/i.test(word) ? 'an' : 'a')

/**
 * The link in an invitation email (accept-url-template in application.yml): /accept-invitation/?email&token.
 * GET invitations/acceptance works signed in or out; then the app opens.
 */
const AcceptInvitationPage = () => {
  const router = useRouter()
  const [state, setState] = useState('joining')
  const [invitation, setInvitation] = useState(null)
  const [error, setError] = useState(null)
  const [counter, setCounter] = useState(REDIRECT_SECONDS)

  useEffect(() => {
    const { email, token } = router.query
    if (!email || !token) return
    invitationService
      .acceptInvitation(email, token)
      .then(response => {
        setInvitation(response.data)
        setState('joined')
      })
      .catch(e => {
        setError(e.response?.data ?? {})
        setState('failed')
      })
  }, [router.query])

  // the app opens by itself once the invitation is accepted
  useEffect(() => {
    if (state !== 'joined') return
    const timer = setInterval(() => setCounter(c => c - 1), 1000)

    return () => clearInterval(timer)
  }, [state])

  // the agent they were invited to, in the organization that invited them
  const destination = invitation?.organizationId
    ? `/gendox/agent-home/?organizationId=${invitation.organizationId}${
        invitation.projectId ? `&projectId=${invitation.projectId}` : ''
      }`
    : '/'
  const role = invitation?.userRoleType?.name

  useEffect(() => {
    if (state === 'joined' && counter <= 0) router.replace(destination)
  }, [state, counter, router, destination])

  return (
    <main className='center'>
      <div className='card card-b box' style={{ padding: 32 }}>
        {state === 'joining' && (
          <>
            <span className='mark' style={{ width: 44, height: 44 }} />
            <h2>Joining…</h2>
            <p className='muted'>Accepting your invitation.</p>
            <div className='progress' style={{ width: '60%', height: 4 }}>
              <i style={{ width: '60%' }} />
            </div>
          </>
        )}
        {state === 'joined' && (
          <>
            <span className='avatar l' style={{ '--h': 165 }}>
              <Check className='lucide' />
            </span>
            <h2>You’re in</h2>
            <p className='muted' style={{ lineHeight: 1.6 }}>
              You joined the team that invited you
              {ROLES[role] && (
                <>
                  {' '}
                  as {article(roleTitle(role))} <b>{roleTitle(role)}</b>
                </>
              )}
              {invitation?.projectId ? ', with access to the agent they shared' : ''}. Gendox opens in{' '}
              {Math.max(counter, 0)} seconds.
            </p>
            <button className='btn primary' style={{ marginTop: 8 }} onClick={() => router.replace(destination)}>
              {invitation?.projectId ? 'Open the agent' : 'Open Gendox'}
              <ArrowRight className='lucide' />
            </button>
          </>
        )}
        {state === 'failed' && (
          <>
            <span className='avatar l' style={{ '--h': 35 }}>
              <ClockAlert className='lucide' />
            </span>
            <h2>This invitation can’t be used</h2>
            <p className='muted' style={{ lineHeight: 1.6 }}>
              {error?.errorMessage ||
                'It may have expired or been used already. Ask the person who invited you to send a new one.'}
            </p>
            <button className='btn' style={{ marginTop: 8 }} onClick={() => router.replace('/')}>
              Go to Gendox
            </button>
            {error?.errorCode && <span className='faint sm mono'>{error.errorCode}</span>}
          </>
        )}
      </div>
    </main>
  )
}

AcceptInvitationPage.getLayout = page => page

// both signed-in and signed-out people open this link
AcceptInvitationPage.pageConfig = {
  routeType: routeTypes.sharedRoute
}

export default AcceptInvitationPage
