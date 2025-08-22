import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Modal } from '@mui/material'
import Paper from '@mui/material/Paper'
import { toast } from 'react-hot-toast'
import { useJobStatusPoller } from 'src/utils/tasks/useJobStatusPoller'
import { fetchTaskNodesByCriteria, fetchDocumentPages } from 'src/store/activeTask/activeTask'
import { fetchDocumentsByCriteria } from 'src/store/activeDocument/activeDocument'
import DocumentDigitizationGrid from './table-components/DocumentDigitizationGrid'
import HeaderSection from './table-components/DocumentDigitizationHeaderSection'
import DialogManager from './table-components/DocumentDigitizationDialogs'
import useDocumentDigitizationGeneration from 'src/views/pages/tasks/document-digitization/table-hooks/useDocumentDigitizationGeneration'
import useExportFile from 'src/views/pages/tasks/document-digitization/table-hooks/useDocumentDigitizationExportFile'

const MAX_PAGE_SIZE = 2147483647

const DocumentDigitizationTable = ({ selectedTask }) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const token = window.localStorage.getItem('accessToken')
  const { organizationId, taskId, projectId } = router.query
  const { taskNodesDocumentList, isLoading } = useSelector(
    state => state.activeTask
  )
  const isBlurring = useSelector(state => state.activeDocument.isBlurring)

  const [documents, setDocuments] = useState([])
  const [documentPages, setDocumentPages] = useState([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const totalDocuments = useMemo(() => taskNodesDocumentList?.totalElements || 0, [taskNodesDocumentList])
  const [selectedDocuments, setSelectedDocuments] = useState([])
  const [dialogs, setDialogs] = useState({ newDoc: false, delete: false, docDetail: false, answerDetail: false, pagePreview: false })
  const [activeNode, setActiveNode] = useState(null)
  const [editMode, setEditMode] = useState(false)

  const { pollJobStatus } = useJobStatusPoller({ organizationId, projectId, token })



  const fetchDocuments = useCallback(() => {
    return dispatch(
      fetchTaskNodesByCriteria({
        organizationId,
        projectId,
        taskId,
        criteria: { taskId, nodeTypeNames: ['DOCUMENT'] },
        token,
        page,
        size: pageSize
      })
    )
  }, [organizationId, projectId, taskId, token, page, pageSize, dispatch])

  const loadDocumentPages = useCallback(() => {
    return dispatch(
      fetchDocumentPages({
        organizationId,
        projectId,
        taskId,
        token,
        page: 0,
        size: MAX_PAGE_SIZE
      })
    )
  }, [organizationId, projectId, taskId, token, dispatch])

  // 1️⃣ **Reset all local state when switching tasks/orgs/projects**
  useEffect(() => {
    setDocuments([])
    setDocumentPages([])
    setSelectedDocuments([])
    setPage(0)
  }, [taskId, organizationId, projectId])

  // ✅ **Always reset selected documents on component mount (page refresh)**
  useEffect(() => {
    setSelectedDocuments([])
  }, [])

  // 2️⃣ **Fetch task nodes documents **
  useEffect(() => {
    if (!(organizationId && projectId && taskId && token)) return
    fetchDocuments()
      .unwrap()
      .catch(() => toast.error('Failed to load documents'))
  }, [fetchDocuments])

  // 3️⃣ **Fetch document pages when taskId changes**
  useEffect(() => {
    if (!(organizationId && projectId && taskId && token)) return
    loadDocumentPages()
      .unwrap()
      .then(pages => setDocumentPages(pages || []))
      .catch(() => toast.error('Failed to load document pages'))
  }, [loadDocumentPages])



  // 4️⃣ **Fetch project documents and Sync with taskNodesDocumentList**
  useEffect(() => {
    let isCancelled = false

    const nodes = taskNodesDocumentList?.content || []
    const documentIds = nodes.map(n => n.documentId).filter(Boolean)
    if (!documentIds.length) {
      setDocuments([])
      return
    }

    dispatch(fetchDocumentsByCriteria({ organizationId, projectId, documentIds, token }))
      .unwrap()
      .then(fullDocuments => {
        if (isCancelled) return
        setDocuments(
          nodes.map(node => {
            const fullDoc = (fullDocuments || []).find(d => d.id === node.documentId)
            return {
              id: node.id,
              documentId: node.documentId,
              name: fullDoc?.title || 'Unknown Document',
              url: fullDoc?.remoteUrl || '',
              prompt: node.nodeValue?.documentMetadata?.prompt || '',
              structure: node.nodeValue?.documentMetadata?.structure || '',
              pageFrom: node.nodeValue?.documentMetadata?.pageFrom || null,
              pageTo: node.nodeValue?.documentMetadata?.pageTo || null,
              createdAt: node.createdAt || new Date().toISOString()
            }
          })
        )
      })
      .catch(() => {
        if (!isCancelled) {
          setDocuments([])
          toast.error('Failed to load full document details')
        }
      })
    return () => {
      isCancelled = true
    }
  }, [taskNodesDocumentList, organizationId, projectId, token, dispatch])

  // 6️⃣ **Update URL query params when page or pageSize changes**
  useEffect(() => {
    router.replace(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          page: String(page),
          size: String(pageSize)
        }
      },
      undefined,
      { shallow: true }
    )
    setSelectedDocuments([])
  }, [page, pageSize])

  // DIALOG HANDLERS
  const openDialog = (dialogType, node = null, forceEditMode = false) => {
    setDialogs(prev => ({ ...prev, [dialogType]: true }))
    setActiveNode(node)
    if (dialogType === 'docDetail' && typeof setEditMode === 'function') {
      setEditMode(forceEditMode)
    }
  }
  const closeDialog = dialogType => {
    setDialogs(prev => ({ ...prev, [dialogType]: false }))
    setActiveNode(null)
  }

  const handleSelectDocument = (docId, checked) => {
    if (docId === 'all') {
      setSelectedDocuments(checked) // checked will be the array of document IDs
    } else if (docId === 'none') {
      setSelectedDocuments([])
    } else {
      setSelectedDocuments(prev => (checked ? [...prev, docId] : prev.filter(id => id !== docId)))
    }
  }

  // Handle Generate Documents
  const { 
    generateNew, 
    generateAll, 
    generateSelected, 
    generateSingleDocument,
    generatingAll, 
    generatingNew, 
    generatingSelected: generatingSelectedState,
    generatingDocuments,
    hasGeneratedContent,
    isDocumentGenerating
  } = useDocumentDigitizationGeneration({
      organizationId,
      projectId,
      taskId,
      documents,
      setSelectedDocuments,
      pollJobStatus,
      token,
      documentPages,
      onGenerationComplete: async () => {
        // Refresh both documents and document pages data
        console.log('🔄 Refreshing data after generation completion...')
        try {
          await fetchDocuments()
          const pages = await loadDocumentPages().unwrap()
          console.log('📄 Updated document pages:', pages)
          setDocumentPages(pages || [])
          toast.success('Data refreshed successfully!')
        } catch (error) {
          console.error('Failed to refresh data after generation:', error)
          toast.error('Failed to refresh data after generation')
        }
      }
    })

  const { exportCsv, exportDocumentDigitizationCsv, isExportingCsv } = useExportFile({
    organizationId,
    projectId,
    taskId,
    token,
    selectedTask,
    documents
  })

  return (
    <>
      <Paper sx={{ p: 3, overflowX: 'auto', backgroundColor: 'action.hover', mb: 3 }}>
        <HeaderSection
          title={selectedTask?.title}
          description={selectedTask?.description}
          openAddDocument={() => openDialog('newDoc')}
          onGenerateNew={generateNew}
          onGenerateAll={generateAll}
          onGenerateSelected={() => generateSelected(selectedDocuments)}
          disableGenerate={documents.length === 0}
          isLoading={isLoading}
          isExportingCsv={isExportingCsv}
          onExportCsv={exportCsv}
          selectedDocuments={selectedDocuments}          
          generatingAll={generatingAll}
          generatingNew={generatingNew}
          generatingSelected={generatingSelectedState}
          documents={documents}
          hasGeneratedContent={hasGeneratedContent}
        />

        <Box
          sx={{
            minWidth: 800,
            filter: isLoading || isBlurring ? 'blur(6px)' : 'none'
          }}
        >
          <DocumentDigitizationGrid
            openDialog={openDialog}
            documents={documents}
            documentPages={documentPages}
            isLoading={isLoading}
            isBlurring={isBlurring}
            page={page}
            pageSize={pageSize}
            setPage={setPage}
            setPageSize={setPageSize}
            totalDocuments={totalDocuments}
            selectedDocuments={selectedDocuments}
            onSelectDocument={handleSelectDocument}
            generatingAll={generatingAll}
            generatingNew={generatingNew}
            generatingSelected={generatingSelectedState}
            generatingDocuments={generatingDocuments}
            hasGeneratedContent={hasGeneratedContent}
            isDocumentGenerating={isDocumentGenerating}
          />
        </Box>
      </Paper>

      <DialogManager
        dialogs={dialogs}
        activeNode={activeNode}
        onClose={closeDialog}
        onOpen={openDialog}
        refreshDocuments={fetchDocuments}
        taskId={taskId}
        organizationId={organizationId}
        projectId={projectId}
        token={token}
        existingDocuments={documents}
        editMode={editMode}
        setEditMode={setEditMode}
        documentPages={documentPages}
        generateSingleDocument={generateSingleDocument}
        onExportCsv={exportDocumentDigitizationCsv}
        isExportingCsv={isExportingCsv}
      />
    </>
  )
}

export default DocumentDigitizationTable
