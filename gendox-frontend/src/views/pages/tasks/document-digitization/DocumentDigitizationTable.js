import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { Box } from '@mui/material'
import Paper from '@mui/material/Paper'
import { toast } from 'react-hot-toast'
import { loadTaskDigitizationData } from 'src/store/activeTaskNode/activeTaskNode'
import DocumentDigitizationGrid from './table-components/DocumentDigitizationGrid'
import HeaderSection from './table-components/DocumentDigitizationHeaderSection'
import DialogManager from './table-components/DocumentDigitizationDialogs'
import useDocumentDigitizationGeneration from 'src/views/pages/tasks/document-digitization/table-hooks/useDocumentDigitizationGeneration'
import useExportFile from 'src/views/pages/tasks/helping-components/TaskExportFiles'
import { useActiveJobMonitor } from '../generation/useActiveJobMonitor'


const DocumentDigitizationTable = ({ selectedTask }) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const token = window.localStorage.getItem('accessToken')
  const { organizationId, taskId, projectId } = router.query


  const {
    taskNodesDocumentList,
    taskDocumentPages,
    isLoading,
    isLoadingDocumentPages,
  } = useSelector(state => state.activeTaskNode)

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
  const [selectedDocuments, setSelectedDocuments] = useState([])
  const [isPageLoading, setIsPageLoading] = useState(false)

  const showLoader = isPageLoading || isLoading || isLoadingDocumentPages

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
    setIsPageLoading(true)
    try {
      await dispatch(
        loadTaskDigitizationData({
          organizationId,
          projectId,
          taskId,
          token,
          docsPage: page,
          docsPageSize: pageSize
        })
      ).unwrap()
    } catch (error) {
      console.error('Failed to reload digitization data:', error)
      toast.error('Failed to load documents')
    } finally {
      setIsPageLoading(false)
    }
  }, [organizationId, projectId, taskId, token, page, pageSize, dispatch])

  useEffect(() => {
    if (organizationId && projectId && taskId) {
      reloadAll()
    }
  }, [organizationId, projectId, taskId, reloadAll])

  useActiveJobMonitor({
    organizationId,
    projectId,
    taskId,
    token,
    reloadAll
  })

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
  const { handleGenerate, isDigitizationGenerating, isDocumentGenerating } =
    useDocumentDigitizationGeneration({
      reloadAll,
      token,
      setSelectedDocuments,
      documentPages
    })

  const { exportDocumentDigitizationCsv, isExportingCsv } = useExportFile({
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
          handleGenerate={handleGenerate}
          isLoading={showLoader}
          selectedDocuments={selectedDocuments}
          isDigitizationGenerating={isDigitizationGenerating}
          documents={documents}
        />

        <Box
          sx={{
            minWidth: 800,
            filter: showLoader ? 'blur(6px)' : 'none'
          }}
        >
          <DocumentDigitizationGrid
            openDialog={openDialog}
            documents={documents}
            documentPages={documentPages}
            isLoading={showLoader}
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
        handleGenerate={handleGenerate}
        onExportCsv={exportDocumentDigitizationCsv}
        isExportingCsv={isExportingCsv}
        isDocumentGenerating={isDocumentGenerating}
        isDigitizationGenerating={isDigitizationGenerating}
      />
    </>
  )
}

export default DocumentDigitizationTable
