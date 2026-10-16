import ErrorPage from 'src/components/ErrorPage'

const Error500 = () => {
  return (
    <ErrorPage
      code='500'
      title='Something went wrong on our side'
      text='Try again in a moment. If it keeps happening, contact support and mention the code below.'
      errorCode='INTERNAL_SERVER_ERROR'
      action={
        <button className='btn' onClick={() => window.location.reload()}>
          Try again
        </button>
      }
    />
  )
}

export default Error500
