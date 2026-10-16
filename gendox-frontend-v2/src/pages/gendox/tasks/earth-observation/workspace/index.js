import dynamic from 'next/dynamic'
import AppLayout from 'src/layouts/AppLayout'

// Earth Engine, Leaflet and Monaco need the browser
const EarthObservationWorkspace = dynamic(() => import('src/components/earth-observation/EarthObservationWorkspace'), {
  ssr: false
})

const EarthObservationPage = () => <EarthObservationWorkspace />

EarthObservationPage.getLayout = page => (
  <AppLayout page='tasks' title='Earth observation' crumb='Tasks'>
    {page}
  </AppLayout>
)

EarthObservationPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default EarthObservationPage
