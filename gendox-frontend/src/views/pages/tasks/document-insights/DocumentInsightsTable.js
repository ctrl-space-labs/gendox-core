import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { Box } from '@mui/material'
import Paper from '@mui/material/Paper'
import { toast } from 'react-hot-toast'
import { useJobStatusPoller } from 'src/utils/tasks/useJobStatusPoller'
import {
  fetchTaskNodesByCriteria,
  fetchAnswerTaskNodes,
  fetchDocumentPages
} from 'src/store/activeTaskNode/activeTaskNode'
import { fetchDocumentsByCriteria } from 'src/store/activeDocument/activeDocument'
import useGeneration from 'src/views/pages/tasks/document-insights/table-hooks/useDocumentInsightsGeneration'
import useExportFile from 'src/views/pages/tasks/document-insights/table-hooks/useDocumentInsightsExportFile'
import taskService from 'src/gendox-sdk/taskService'
import { useGeneration as useGenerationContext } from '../generation/GenerationContext'
import DocumentInsightsGrid from 'src/views/pages/tasks/document-insights/table-components/DocumentInsightsGrid'
import HeaderSection from './table-components/DocumentInsightsHeaderSection'
import DialogManager from 'src/views/pages/tasks/document-insights/table-components/DocumentInsightsDialogs'

const MAX_PAGE_SIZE = 2147483647

const DocumentInsightsTable = ({ selectedTask }) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const token = window.localStorage.getItem('accessToken')
  const { organizationId, taskId, projectId } = router.query
  const { taskNodesDocumentList, taskNodesQuestionList, taskNodesAnswerList, isLoading, isLoadingAnswers } =
    useSelector(state => state.activeTaskNode)
  const isBlurring = useSelector(state => state.activeDocument.isBlurring)

  const [documents, setDocuments] = useState([])
  const [documentPages, setDocumentPages] = useState([])
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const totalDocuments = useMemo(() => taskNodesDocumentList?.totalElements || 0, [taskNodesDocumentList])
  const [selectedDocuments, setSelectedDocuments] = useState([])
  const [dialogs, setDialogs] = useState({
    newDoc: false,
    delete: false,
    answerDetail: false,
    questionDetail: false,
    pagePreview: false
  })
  const [activeNode, setActiveNode] = useState(null)
  const [addQuestionMode, setAddQuestionMode] = useState(false)

  const { pollJobStatus } = useJobStatusPoller({ organizationId, projectId, token })
  const { startGeneration, completeGeneration } = useGenerationContext()
  const [pollCleanup, setPollCleanup] = useState(null)

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

  const fetchQuestions = useCallback(() => {
    return dispatch(
      fetchTaskNodesByCriteria({
        organizationId,
        projectId,
        taskId,
        criteria: { taskId, nodeTypeNames: ['QUESTION'] },
        token,
        page: 0,
        size: MAX_PAGE_SIZE
      })
    )
  }, [organizationId, projectId, taskId, token, dispatch, page, pageSize])

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
  }, [organizationId, projectId, taskId, token, dispatch, taskNodesDocumentList])

  const fetchAnswers = useCallback(() => {
    const answerTaskNodePayload = {
      documentNodeIds: documents.map(d => d.id),
      questionNodeIds: questions.map(q => q.id)
    }
    return dispatch(
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
  }, [documents, questions])

  // Check for running jobs when task loads (for UI state only, not to block operations)
  const checkRunningJobs = useCallback(async () => {
    if (!organizationId || !projectId || !taskId || !token) return

    try {
      const criteria = {
        status: 'STARTED',
        matchAllParams: [
          { paramName: 'projectId', paramValue: projectId },
          { paramName: 'taskId', paramValue: taskId }
        ]
      }

      const response = await taskService.getJobsByCriteria(organizationId, projectId, criteria, token)
      const isRunning = response.data?.content?.length > 0

      if (isRunning) {
        // Start generation tracking for running job (UI state only)
        startGeneration(taskId, null, 'resumed', { documentNames: 'Background processing...', totalDocuments: 0 })

        // Start polling to detect when the job completes
        const cleanup = startJobCompletionPolling()
        setPollCleanup(() => cleanup)
      }
    } catch (error) {
      console.error('Failed to check running jobs:', error)
    }
  }, [organizationId, projectId, taskId, token, startGeneration])

  // Poll for job completion when we detect an existing running job after page refresh
  const startJobCompletionPolling = useCallback(() => {
    const pollInterval = setInterval(async () => {
      try {
        const criteria = {
          status: 'STARTED',
          matchAllParams: [
            { paramName: 'projectId', paramValue: projectId },
            { paramName: 'taskId', paramValue: taskId }
          ]
        }

        const response = await taskService.getJobsByCriteria(organizationId, projectId, criteria, token)
        const isStillRunning = response.data?.content?.length > 0

        if (!isStillRunning) {
          // Job has completed, mark as completed in context
          completeGeneration(taskId, null)
          clearInterval(pollInterval)

          // Refresh data to show results
          fetchDocuments().unwrap()
          fetchQuestions().unwrap()
          fetchAnswers()
            .unwrap()
            .catch(error => console.error('Failed to refresh answers after polling:', error))

          toast.success('Generation completed successfully!')
        }
      } catch (error) {
        console.error('Error polling job completion:', error)
        // Stop polling on error
        clearInterval(pollInterval)
      }
    }, 3000) // Poll every 3 seconds

    // Clean up interval on unmount or task change
    return () => {
      clearInterval(pollInterval)
    }
  }, [organizationId, projectId, taskId, token, completeGeneration, fetchDocuments, fetchQuestions, fetchAnswers])

  // 1️⃣ **Reset all local state when switching tasks/orgs/projects**
  useEffect(() => {
    setDocuments([])
    setQuestions([])
    setAnswers([])
    setSelectedDocuments([])
    setPage(0)
  }, [taskId, organizationId, projectId])

  // 2️⃣ **Fetch task nodes (documents & questions) when dependencies change**
  useEffect(() => {
    if (!(organizationId && projectId && taskId && token)) return
    fetchDocuments()
      .unwrap()
      .catch(() => toast.error('Failed to load documents'))
  }, [fetchDocuments])

  useEffect(() => {
    if (!(organizationId && projectId && taskId && token)) return
    fetchQuestions()
      .unwrap()
      .catch(() => toast.error('Failed to load questions'))
  }, [fetchQuestions])

  // 3️⃣ **Fetch document pages when taskId changes**
  useEffect(() => {
    if (!(organizationId && projectId && taskId && token)) return
    loadDocumentPages()
      .unwrap()
      .then(pages => setDocumentPages(pages || []))
      .catch(() => toast.error('Failed to load document pages'))
  }, [loadDocumentPages])

  // 3️⃣ **Sync questions to local state (combine reset and fill)**
  useEffect(() => {
    setQuestions(
      (taskNodesQuestionList?.content || []).map(node => ({
        id: node.id,
        text: node.nodeValue?.message || '',
        order: node.nodeValue?.order || 0
      }))
    )
  }, [taskNodesQuestionList])

  // 4️⃣ **Documents: Fetch full details or clear immediately if none**
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
              createdAt: node.createdAt || new Date().toISOString(),
              _doc: fullDoc
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

  // 5️⃣ **Answers: Fetch when you have docs & questions**
  useEffect(() => {
    if (!(organizationId && projectId && taskId && token)) return

    fetchAnswers()
      .unwrap()
      .catch(() => toast.error('Failed to load answers'))
  }, [fetchAnswers])

  // 6️⃣ **Sync answers to local state**
  useEffect(() => {
    setAnswers(
      (taskNodesAnswerList?.content || []).map(node => ({
        id: node.id,
        documentNodeId: node.nodeValue?.nodeDocumentId || '',
        questionNodeId: node.nodeValue?.nodeQuestionId || '',
        message: node.nodeValue?.message || '',
        answerValue: node.nodeValue?.answerValue || '',
        answerFlagEnum: node.nodeValue?.answerFlagEnum || ''
      }))
    )
  }, [taskNodesAnswerList])

  // 7️⃣ **Update URL query params when page or pageSize changes**
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

  // 8️⃣ **Check for running jobs when task loads**
  useEffect(() => {
    if (!(organizationId && projectId && taskId && token)) return
    checkRunningJobs()
  }, [organizationId, projectId, taskId, token])

  // 9️⃣ **Cleanup polling on unmount**
  useEffect(() => {
    return () => {
      if (pollCleanup) {
        pollCleanup()
      }
    }
  }, [pollCleanup])

  const handleSelectDocument = (docId, checked) => {
    if (docId === 'all') {
      setSelectedDocuments(checked) // checked will be the array of document IDs
    } else if (docId === 'none') {
      setSelectedDocuments([])
    } else {
      setSelectedDocuments(prev => (checked ? [...prev, docId] : prev.filter(id => id !== docId)))
    }
  }

  // DIALOG HANDLERS
  const openDialog = (dialogType, node = null, forceEditMode = false) => {
    setDialogs(prev => ({ ...prev, [dialogType]: true }))
    setActiveNode(node)
    if (dialogType === 'questionDetail') setAddQuestionMode(forceEditMode)
  }
  const closeDialog = dialogType => {
    setDialogs(prev => ({ ...prev, [dialogType]: false }))
    setActiveNode(null)
    if (dialogType === 'questionDetail') setAddQuestionMode(false)
  }

  // Handle Generate Documents
  const { handleGenerateSelected, handleGenerateSingleAnswer, handleGenerate, isGeneratingAll, isGeneratingCells } =
    useGeneration({
      organizationId,
      projectId,
      taskId,
      documents,
      questions,
      selectedDocuments,
      setSelectedDocuments,
      pollJobStatus,
      token,
      fetchAnswers
    })

  const { exportCsv, isExportingCsv } = useExportFile({
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
          onAddQuestion={() => openDialog('questionDetail', null, true)}
          openAddDocument={() => openDialog('newDoc')}
          onGenerateNew={() =>
            handleGenerate({
              docs: documents.filter(doc => !answers.some(a => a.documentNodeId === doc.id)),
              reGenerateExistingAnswers: false,
              isAll: false
            })
          }
          onGenerateAll={() => handleGenerate({ docs: documents, reGenerateExistingAnswers: true, isAll: true })}
          onGenerateSelected={handleGenerateSelected}
          disableGenerate={documents.length === 0 || questions.length === 0}
          isLoading={isLoading}
          isExportingCsv={isExportingCsv}
          onExportCsv={exportCsv}
          selectedDocuments={selectedDocuments}
          generatingAll={isGeneratingAll}
          generatingNew={false}
          generatingSelected={false}
          documents={documents}
          questions={questions}
          hasGeneratedContent={(docId, questionId) => {
            if (questionId) {
              return answers.some(answer => answer.documentNodeId === docId && answer.questionNodeId === questionId)
            }
            return answers.some(answer => answer.documentNodeId === docId)
          }}
        />

        <Box
          sx={{
            minWidth: 800,
            filter: isLoading || isBlurring ? 'blur(6px)' : 'none'
          }}
        >
          <DocumentInsightsGrid
            openDialog={openDialog}
            documents={documents}
            documentPages={documentPages}
            questions={questions}
            answers={answers}
            onGenerate={docs => handleGenerate({ docs: docs, reGenerateExistingAnswers: true })}
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
        onOpen={openDialog}
        onClose={closeDialog}
        refreshDocuments={fetchDocuments}
        refreshQuestions={fetchQuestions}
        refreshAnswers={fetchAnswers}
        taskId={taskId}
        organizationId={organizationId}
        projectId={projectId}
        token={token}
        documents={documents}
        questions={questions}
        addQuestionMode={addQuestionMode}
      />
    </>
  )
}

export default DocumentInsightsTable
