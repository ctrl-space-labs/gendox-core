import AppLayout from 'src/layouts/AppLayout'
import DocumentView from 'src/views/DocumentView'

const DocumentPage = () => <DocumentView />

DocumentPage.getLayout = page => (
  <AppLayout page='knowledge' title='Document' crumb='Knowledge'>
    {page}
  </AppLayout>
)

DocumentPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default DocumentPage
