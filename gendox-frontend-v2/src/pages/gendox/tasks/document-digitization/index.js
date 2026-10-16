import AppLayout from 'src/layouts/AppLayout'
import DigitizationView from 'src/views/DigitizationView'

const DocumentDigitizationPage = () => <DigitizationView />

DocumentDigitizationPage.getLayout = page => (
  <AppLayout page='tasks' title='Digitization' crumb='Tasks'>
    {page}
  </AppLayout>
)

DocumentDigitizationPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default DocumentDigitizationPage
