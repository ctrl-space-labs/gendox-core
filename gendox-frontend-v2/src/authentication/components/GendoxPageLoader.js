import Spinner from 'src/components/ui/Spinner'

const GendoxPageLoader = ({ text }) => {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '32px 16px' }}>
      <div className='stack' style={{ alignItems: 'center', gap: 14, textAlign: 'center' }}>
        <span className='mark' style={{ width: 44, height: 44 }} />
        <Spinner />
        {text && <p className='muted'>{text}</p>}
      </div>
    </main>
  )
}

export default GendoxPageLoader
