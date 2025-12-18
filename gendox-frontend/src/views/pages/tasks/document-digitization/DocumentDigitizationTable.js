import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { Box } from '@mui/material'
import Paper from '@mui/material/Paper'
import { toast } from 'react-hot-toast'
import { useJobStatusPoller } from 'src/utils/tasks/useJobStatusPoller'
import { loadTaskData, fetchDocumentPages } from 'src/store/activeTaskNode/activeTaskNode'
import DocumentDigitizationGrid from './table-components/DocumentDigitizationGrid'
import HeaderSection from './table-components/DocumentDigitizationHeaderSection'
import DialogManager from './table-components/DocumentDigitizationDialogs'
import useDocumentDigitizationGeneration from 'src/views/pages/tasks/document-digitization/table-hooks/useDocumentDigitizationGeneration'
import useExportFile from 'src/views/pages/tasks/helping-components/TaskExportFiles'
import { useGeneration } from '../generation/GenerationContext'
import { checkAndResumeRunningJob } from '../generation/runningJobsDetectionUtils'
import GlobalGenerationStatus from '../generation/GlobalGenerationStatus'
import useGenerateNewPagesGuard from 'src/views/pages/tasks/document-digitization/table-hooks/useGenerateNewPagesGuard'

const MAX_PAGE_SIZE = 2147483647

const DocumentDigitizationTable = ({ selectedTask }) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const token = window.localStorage.getItem('accessToken')
  const { organizationId, taskId, projectId } = router.query

  const { taskNodesDocumentList, taskDocumentPages, isLoading } = useSelector(state => state.activeTaskNode)

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const totalDocuments = useMemo(() => taskNodesDocumentList?.totalElements || 0, [taskNodesDocumentList])
  const [dialogs, setDialogs] = useState({
    newDoc: false,
    delete: false,
    docDetail: false,
    answerDetail: false,
    pagePreview: false
  })
  const [activeNode, setActiveNode] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [pollCleanup, setPollCleanup] = useState(null)
  const [selectedDocuments, setSelectedDocuments] = useState([])
  const { pollJobStatus, showTimeoutDialog } = useJobStatusPoller({ organizationId, projectId, token })
  const { startGeneration, completeGeneration } = useGeneration()  

  // --- Documents derived from Redux (like DocumentInsightsTable) ---
  const documents = useMemo(() => {
    const nodes = taskNodesDocumentList?.content || []
    return nodes.map(node => {
      const meta = node.nodeValue?.documentMetadata || {}

      return {
        id: node.id,
        documentId: node.documentId,
        name: meta.title || 'Unknown Document',
        url: meta.remoteUrl || '',
        prompt: meta.prompt || '',
        structure: meta.structure || '',
        pageFrom: meta.pageFrom ?? null,
        pageTo: meta.pageTo ?? null,
        allPages: meta.allPages ?? false,
        createdAt: node.createdAt || new Date().toISOString()
      }
    })
  }, [taskNodesDocumentList])

  // --- Document pages from Redux ---
  const documentPages = useMemo(() => {
    if (!taskDocumentPages) return []
    // if the backend returns a Page object
    if (Array.isArray(taskDocumentPages.content)) {
      return taskDocumentPages.content
    }
    // if it's a direct array
    if (Array.isArray(taskDocumentPages)) {
      return taskDocumentPages
    }
    return []
  }, [taskDocumentPages])

  const reloadAll = useCallback(async () => {
    if (!organizationId || !projectId || !taskId) return

    try {
      await dispatch(
        loadTaskData({
          organizationId,
          projectId,
          taskId,
          token,
          docsPage: page,
          docsPageSize: pageSize
        })
      ).unwrap()

      await dispatch(
        fetchDocumentPages({
          organizationId,
          projectId,
          taskId,
          token,
          page: 0,
          size: MAX_PAGE_SIZE
        })
      ).unwrap()
    } catch (error) {
      console.error('Failed to reload digitization data:', error)
      toast.error('Failed to load documents')
    }
  }, [organizationId, projectId, taskId, token, page, pageSize, dispatch])

  const handleGenerationComplete = useCallback(() => {
    completeGeneration(taskId, null)
    // Refresh data (same as you already do)
    reloadAll()
  }, [completeGeneration, taskId, reloadAll])

  useEffect(() => {
    if (!(organizationId && projectId && taskId && token)) return

    let stopPollingFn = null
    let cancelled = false

    async function resumeIfNeeded() {
      try {
        console.log('Attempting to resume running job if any...')
        const { stopPolling } = await checkAndResumeRunningJob({
          organizationId,
          projectId,
          taskId,
          token,
          onResume: () => {
            startGeneration(taskId, null, 'resumed', {
              documentNames: 'Background processing...',
              totalDocuments: 0
            })
          },
          onComplete: handleGenerationComplete,
          onError: e => console.error('Polling error:', e),
          intervalMs: 3000
        })

        if (cancelled) {
          stopPolling?.()
          return
        }
        stopPollingFn = stopPolling
        setPollCleanup(() => stopPolling)
      } catch (err) {
        console.error('Failed to resume running job:', err)
      }
    }

    resumeIfNeeded()

    return () => {
      cancelled = true
      stopPollingFn?.()
      setPollCleanup(null)
    }
  }, [organizationId, projectId, taskId, token, startGeneration, handleGenerationComplete])

  useEffect(() => {
    // Clean up any existing polling
    if (pollCleanup) {
      pollCleanup()
      setPollCleanup(null)
    }
    setSelectedDocuments([])
    setPage(0)
  }, [taskId, organizationId, projectId])

  useEffect(() => {
  if (!organizationId || !projectId || !taskId) return
  reloadAll()
}, [organizationId, projectId, taskId, page, pageSize, reloadAll])


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

  useEffect(() => {
    return () => {
      if (pollCleanup) {
        pollCleanup()
      }
    }
  }, [pollCleanup])

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
    if (dialogType === 'docDetail') {
      setEditMode(false)
    }
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
    showTimeoutDialog,
    token,
    documentPages,
    onGenerationComplete: () => {
      reloadAll()
    }
  })

  const { exportDocumentDigitizationCsv, isExportingCsv } = useExportFile({
    organizationId,
    projectId,
    taskId,
    token,
    selectedTask,
    documents
  })

  // Handle Retry Generation from Global Status
  const handleRetryGeneration = useCallback(
    gen => {
      const t = gen.type ?? gen.generationType

      switch (t) {
        case 'all':
          return generateAll()
        case 'new':
          return generateNew()
        case 'selected': {
          const ids = gen.selectedIds ?? []
          if (!ids.length) {
            toast.error('No selected documents for regeneration.')
            return
          }
          return generateSelected(ids)
        }
        case 'single': {
          const doc = documents.find(d => d.id === gen.documentId)
          if (!doc) {
            toast.error('Document not found for regeneration.')
            return
          }
          const from = gen.pageFrom ?? doc.pageFrom ?? null
          const to = gen.pageTo ?? doc.pageTo ?? null
          return generateSingleDocument(doc, from, to)
        }
        default:
          console.warn('Unknown generation type on retry:', gen)
      }
    },
    [generateAll, generateNew, generateSelected, generateSingleDocument, documents]
  )
  const { disableGenerateFlag } = useGenerateNewPagesGuard({
    documents,
    selectedDocuments,
    documentPages
  })

  return (
    <>
      <GlobalGenerationStatus showTimeoutDialog={showTimeoutDialog} onRetryGeneration={handleRetryGeneration} />
      <Paper sx={{ p: 3, overflowX: 'auto', backgroundColor: 'action.hover', mb: 3 }}>
        <HeaderSection
          title={selectedTask?.title}
          description={selectedTask?.description}
          openAddDocument={() => openDialog('newDoc')}
          onGenerateNew={generateNew}
          onGenerateAll={generateAll}
          onGenerateSelected={() => generateSelected(selectedDocuments)}
          disableGenerateNew={disableGenerateFlag}
          disableGenerate={documents.length === 0}
          isLoading={isLoading}
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
            filter: isLoading ? 'blur(6px)' : 'none'
          }}
        >
          <DocumentDigitizationGrid
            openDialog={openDialog}
            documents={documents}
            documentPages={documentPages}
            isLoading={isLoading}
            page={page}
            pageSize={pageSize}
            setPage={setPage}
            setPageSize={setPageSize}
            totalDocuments={totalDocuments}
            selectedDocuments={selectedDocuments}
            onSelectDocument={handleSelectDocument}
            isDocumentGenerating={isDocumentGenerating}
          />
        </Box>
      </Paper>

      <DialogManager
        dialogs={dialogs}
        activeNode={activeNode}
        onClose={closeDialog}
        onOpen={openDialog}
        reloadAll={reloadAll}
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
        isDocumentGenerating={isDocumentGenerating}
        generatingAll={generatingAll}
        generatingNew={generatingNew}
        generatingSelected={generatingSelectedState}
      />
    </>
  )
}

export default DocumentDigitizationTable
