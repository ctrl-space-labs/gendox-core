import ErrorPage from 'src/components/ErrorPage'

const Error401 = () => {
  return (
    <ErrorPage
      code='401'
      title='You don’t have access to this'
      text='Your role does not allow it. Ask an admin or the owner of the organization if you need it.'
      errorCode='FORBIDDEN'
    />
  )
}

export default Error401
