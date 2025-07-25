import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Modal } from '@mui/material'
import Paper from '@mui/material/Paper'
import { toast } from 'react-hot-toast'
import { useJobStatusPoller } from 'src/utils/tasks/useJobStatusPoller'
import {
  fetchTaskNodesByTaskId,
  executeTaskByType,
  fetchTaskNodesByCriteria,
  fetchAnswerTaskNodes
} from 'src/store/activeTask/activeTask'
import { fetchDocumentsByCriteria } from 'src/store/activeDocument/activeDocument'
import DocumentDigitizationGrid from './table-components/DocumentDigitizationGrid'
import HeaderSection from './table-components/HeaderSection'
import taskService from 'src/gendox-sdk/taskService'
import { downloadBlobForCSV } from 'src/utils/tasks/downloadBlobForCSV'
import DialogManager from './table-components/DocumentDigitizationDialogs'

const MAX_PAGE_SIZE = 2147483647

const DocumentDigitizationTable = ({ selectedTask }) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const token = window.localStorage.getItem('accessToken')
  const { organizationId, taskId, projectId } = router.query
  const { taskNodesDocumentList, taskNodesAnswerList, isLoading, isLoadingAnswers } = useSelector(
    state => state.activeTask
  )
  const isBlurring = useSelector(state => state.activeDocument.isBlurring)

  const [documents, setDocuments] = useState([])
  const [answers, setAnswers] = useState([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const totalDocuments = useMemo(() => taskNodesDocumentList?.totalElements || 0, [taskNodesDocumentList])
  const [selectedDocuments, setSelectedDocuments] = useState([])
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)
  const [isGeneratingCells, setIsGeneratingCells] = useState({})
  const [dialogs, setDialogs] = useState({ newDoc: false, delete: false, docDetail: false, answerDetail: false })
  const [activeNode, setActiveNode] = useState(null)
  const [isExportingCsv, setIsExportingCsv] = useState(false)

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

  const fetchAnswers = useCallback(() => {
   return dispatch(
      fetchTaskNodesByCriteria({
        organizationId,
        projectId,
        taskId,
        criteria: { taskId, nodeTypeNames: ['ANSWER'] },
        token,
        page: 0,
        size: MAX_PAGE_SIZE
      })
    )
  }, [organizationId, projectId, taskId, token, dispatch])

  // 1️⃣ **Reset all local state when switching tasks/orgs/projects**
  useEffect(() => {
    setDocuments([])
    setAnswers([])
    setSelectedDocuments([])
    setPage(0)
  }, [taskId, organizationId, projectId])

  // 2️⃣ **Fetch task nodes documents **
  useEffect(() => {
    if (!(organizationId && projectId && taskId && token)) return
    fetchDocuments()
      .unwrap()
      .catch(() => toast.error('Failed to load documents'))
  }, [fetchDocuments])

  // 3️⃣ **Fetch answers when taskId changes**
  useEffect(() => {
    if (!(organizationId && projectId && taskId && token)) return
    fetchAnswers()
      .unwrap()
      .catch(() => toast.error('Failed to load answers'))
  }, [fetchAnswers])

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
              prompt: node.nodeValue?.documentMetadata?.prompt || '',
              structure: node.nodeValue?.documentMetadata?.structure || ''
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

  // 5️⃣ **Sync answers with taskNodesAnswerList**
  useEffect(() => {
    setAnswers(
      (taskNodesAnswerList?.content || []).map(node => ({
        id: node.id,
        documentNodeId: node.nodeValue?.documentNodeId || '',
        message: node.nodeValue?.message || '',
        answerValue: node.nodeValue?.answerValue || '',
        answerFlagEnum: node.nodeValue?.answerFlagEnum || '',
        pageNumber: node.pageNumber || 0,
        documentId: node.documentId || ''
      }))
    )
  }, [taskNodesAnswerList])

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
  const openDialog = (dialogType, node = null) => {
    setDialogs(prev => ({ ...prev, [dialogType]: true }))
    setActiveNode(node)
  }
  const closeDialog = dialogType => {
    setDialogs(prev => ({ ...prev, [dialogType]: false }))
    setActiveNode(null)
  }

  const handleSelectDocument = (docId, checked) => {
    setSelectedDocuments(prev => (checked ? [...prev, docId] : prev.filter(id => id !== docId)))
  }

  const handleGenerateSelected = async () => {
    console.log('handleGenerateSelected called with selectedDocuments:', selectedDocuments)
    // const selectedDocs = documents.filter(doc => selectedDocuments.includes(doc.id))
    // if (selectedDocs.length === 0) {
    //   toast.error('No documents selected!')
    //   return
    // }
    // const newCells = {}
    // selectedDocs.forEach(doc => {
    //   questions.forEach(q => {
    //     newCells[`${doc.id}_${q.id}`] = true
    //   })
    // })
    // setIsGeneratingCells(cells => ({ ...cells, ...newCells }))

    // try {
    //   await handleGenerate({ docs: selectedDocs, reGenerateExistingAnswers: true })
    // } finally {
    //   // Clean up just those cells
    //   setIsGeneratingCells(cells => {
    //     const copy = { ...cells }
    //     selectedDocs.forEach(doc => {
    //       questions.forEach(q => {
    //         delete copy[`${doc.id}_${q.id}`]
    //       })
    //     })
    //     return copy
    //   })
    // }
  }

  const handleGenerateSingleAnswer = async (doc, docPage) => {
    if (!doc || !docPage) {
      toast.error('Documents page is required to generate an answer.')
      return
    }
    const key = `${doc.id}_${docPage.id}`
    setIsGeneratingCells(cells => ({ ...cells, [key]: true }))
    try {
      await handleGenerate({ docs: doc, pageToGenerate: docPage, reGenerateExistingAnswers: true })
    } finally {
      setIsGeneratingCells(cells => {
        const { [key]: _, ...rest } = cells
        return rest
      })
    }
  }

  const handleGenerate = async ({ docs, pageToGenerate, reGenerateExistingAnswers, isAll = false }) => {
    if (isAll) setIsGeneratingAll(true)

    try {
      const docIds = Array.isArray(docs) ? docs.map(d => d.id) : [docs.id]

      const criteria = {
        taskId,
        documentNodeIds: docIds,
        reGenerateExistingAnswers
      }

      const jobExecutionId = await dispatch(
        executeTaskByType({ organizationId, projectId, taskId, criteria, token })
      ).unwrap()

      toast.success(`Started generation for ${docIds.length} document(s)`)

      await pollJobStatus(jobExecutionId)

      const answerTaskNodePayload = {
        documentNodeIds: documents.map(d => d.id)
      }

      dispatch(
        fetchAnswerTaskNodes({
          organizationId,
          projectId,
          taskId,
          answerTaskNodePayload,
          token,
          page: 0,
          size: MAX_PAGE_SIZE
        })
      )

      toast.success(`Generation completed for ${docIds.length} document(s)`)
      setSelectedDocuments([])
    } catch (error) {
      console.error('Failed to start generation:', error)
      toast.error('Failed to start generation')
    } finally {
      if (isAll) setIsGeneratingAll(false)
    }
  }

  const handleExportCsv = async () => {
    if (documents.length === 0) {
      toast.error('No documents to export')
      return
    }
    setIsExportingCsv(true)
    try {
      const csvBlob = await taskService.exportTaskCsv(organizationId, projectId, taskId, token)
      downloadBlobForCSV(csvBlob, `${selectedTask?.title?.replace(/\s+/g, '_') || 'document_insights'}.csv`)
      toast.success('CSV exported successfully!')
    } catch (error) {
      console.error('Failed to export CSV:', error)
      toast.error('Failed to export CSV')
    } finally {
      setIsExportingCsv(false)
    }
  }  

  return (
    <>
      <Paper sx={{ p: 3, overflowX: 'auto', backgroundColor: 'action.hover', mb: 3 }}>
        <HeaderSection
          title={selectedTask?.title}
          description={selectedTask?.description}
          //   openUploader={openUploader}
          openUploader={() => openDialog('newDoc')}
          onGenerate={reGenerateExistingAnswers =>
            handleGenerate({ docs: documents, reGenerateExistingAnswers: reGenerateExistingAnswers, isAll: true })
          }
          disableGenerateAll={documents.length === 0}
          isLoading={isLoading}
          isExportingCsv={isExportingCsv}
          onExportCsv={handleExportCsv}
          onGenerateSelected={handleGenerateSelected}
          selectedDocuments={selectedDocuments}
          isGeneratingAll={isGeneratingAll}
        />

        <Box
          sx={{
            minWidth: 800,
            filter: isLoading || isBlurring ? 'blur(6px)' : 'none'
          }}
        >
          <DocumentDigitizationGrid
            openDialog={openDialog}
            organizationId={organizationId}
            projectId={projectId}
            token={token}
            taskId={taskId}
            documents={documents}
            answers={answers}
            onGenerate={docs => handleGenerate({ docs: docs, reGenerateExistingAnswers: true })}
            onDeleteDocumentNode={nodeId => openDialog('delete', nodeId)}
            isLoadingAnswers={isLoadingAnswers}
            isLoading={isLoading}
            isBlurring={isBlurring}
            page={page}
            pageSize={pageSize}
            setPage={setPage}
            setPageSize={setPageSize}
            totalDocuments={totalDocuments}
            selectedDocuments={selectedDocuments}
            onSelectDocument={handleSelectDocument}
            onGenerateSingleAnswer={handleGenerateSingleAnswer}
            isGeneratingAll={isGeneratingAll}
            isGeneratingCells={isGeneratingCells}
          />
        </Box>
      </Paper>

      <DialogManager
        dialogs={dialogs}
        activeNode={activeNode}
        onClose={closeDialog}
        refreshDocuments={fetchDocuments}
        refreshAnswers={fetchAnswers}
        taskId={taskId}
        organizationId={organizationId}
        projectId={projectId}
        token={token}
        existingDocuments={documents}
      />
    </>
  )
}

export default DocumentDigitizationTable
