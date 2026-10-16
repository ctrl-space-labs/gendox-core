import AppLayout from 'src/layouts/AppLayout'
import DocumentInsightsView from 'src/views/DocumentInsightsView'

const DocumentInsightsPage = () => <DocumentInsightsView />

DocumentInsightsPage.getLayout = page => (
  <AppLayout page='tasks' title='Document insights' crumb='Tasks'>
    {page}
  </AppLayout>
)

DocumentInsightsPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default DocumentInsightsPage
