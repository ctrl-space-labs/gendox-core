import Link from 'next/link'

/**
 * A full-page error: what happened, what to do, and the backend's errorCode for support.
 */
const ErrorPage = ({ code, title, text, errorCode, action }) => {
  return (
    <main className='center'>
      <div className='box'>
        {code && <div className='code-big'>{code}</div>}
        <h1 style={{ fontSize: 24 }}>{title}</h1>
        <p className='muted' style={{ lineHeight: 1.6 }}>
          {text}
        </p>
        <div className='row' style={{ marginTop: 8 }}>
          {action}
          <Link className='btn primary' href='/'>
            Go home
          </Link>
        </div>
        {errorCode && <span className='faint sm mono'>{errorCode}</span>}
      </div>
    </main>
  )
}

export default ErrorPage
