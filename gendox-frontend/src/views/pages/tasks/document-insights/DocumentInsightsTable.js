import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { Box } from '@mui/material'
import Paper from '@mui/material/Paper'
import { toast } from 'react-hot-toast'
import { useJobStatusPoller } from 'src/utils/tasks/useJobStatusPoller'
import { loadTaskData } from 'src/store/activeTaskNode/activeTaskNode'
import useGeneration from 'src/views/pages/tasks/document-insights/table-hooks/useDocumentInsightsGeneration'
import useExportFile from 'src/views/pages/tasks/helping-components/TaskExportFiles'
import taskService from 'src/gendox-sdk/taskService'
import { useGeneration as useGenerationContext } from '../generation/GenerationContext'
import DocumentInsightsGrid from 'src/views/pages/tasks/document-insights/table-components/DocumentInsightsGrid'
import HeaderSection from './table-components/DocumentInsightsHeaderSection'
import DialogManager from 'src/views/pages/tasks/document-insights/table-components/DocumentInsightsDialogs'

const DocumentInsightsTable = ({ selectedTask }) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const token = window.localStorage.getItem('accessToken')
  const { organizationId, taskId, projectId } = router.query
  const { taskNodesDocumentList, taskNodesQuestionList, taskNodesAnswerList, isLoading, isLoadingAnswers } =
    useSelector(state => state.activeTaskNode)

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const totalDocuments = useMemo(() => taskNodesDocumentList?.totalElements || 0, [taskNodesDocumentList])
  const [dialogs, setDialogs] = useState({
    newDoc: false,
    delete: false,
    answerDetail: false,
    questionDetail: false,
    pagePreview: false
  })
  const [activeNode, setActiveNode] = useState(null)
  const [addQuestionMode, setAddQuestionMode] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState([])
  const [isPageReloading, setIsPageReloading] = useState(false)

  const { pollJobStatus } = useJobStatusPoller({ organizationId, projectId, token })
  const { startGeneration, completeGeneration } = useGenerationContext()
  const [pollCleanup, setPollCleanup] = useState(null)


  // loaders
  const isDocumentsLoading = useMemo(
    () => isLoading && taskNodesDocumentList?.content === undefined,
    [isLoading, taskNodesDocumentList]
  )

  const isQuestionsLoading = useMemo(
    () => isLoading && taskNodesQuestionList?.content === undefined,
    [isLoading, taskNodesQuestionList]
  )

  const isAnswersLoading = isLoadingAnswers

  const isPageLoading = isDocumentsLoading || isQuestionsLoading || isAnswersLoading || isPageReloading

  // --- Extract normalized lists from Redux ---
  const documents = useMemo(() => {
    const nodes = taskNodesDocumentList?.content || []
    return nodes.map(node => ({
      id: node.id,
      documentId: node.documentId,
      name: node.nodeValue?.documentMetadata?.title || 'Unknown Document',
      url: node.nodeValue?.documentMetadata?.remoteUrl || '',
      prompt: node.nodeValue?.documentMetadata?.prompt || '',
      supportingDocumentIds: node.nodeValue?.documentMetadata?.supportingDocumentIds || [],
      createdAt: node.createdAt,
      updatedAt: node.updatedAt
    }))
  }, [taskNodesDocumentList])

  const questions = useMemo(() => {
    const nodes = taskNodesQuestionList?.content || []
    return nodes.map(node => ({
      id: node.id,
      text: node.nodeValue?.message || '',
      order: node.nodeValue?.order || 0,
      supportingDocumentIds: node.nodeValue?.documentMetadata?.supportingDocumentIds || [],
      title: node.nodeValue?.questionTitle || ''
    }))
  }, [taskNodesQuestionList])

  const answers = useMemo(() => {
    const nodes = taskNodesAnswerList?.content || []
    return nodes.map(node => ({
      id: node.id,
      documentNodeId: node.nodeValue?.nodeDocumentId,
      questionNodeId: node.nodeValue?.nodeQuestionId,
      message: node.nodeValue?.message || '',
      answerValue: node.nodeValue?.answerValue || '',
      answerFlagEnum: node.nodeValue?.answerFlagEnum || ''
    }))
  }, [taskNodesAnswerList])

  const reloadAll = useCallback(async () => {
    if (!organizationId || !projectId || !taskId) return
    setIsPageReloading(true)
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
    } finally {
      setIsPageReloading(false)
    }
  }, [organizationId, projectId, taskId, token, page, pageSize, dispatch])

  // Initial load
  useEffect(() => {
    if (organizationId && projectId && taskId) {
      reloadAll()
    }
  }, [organizationId, projectId, taskId])

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
          reloadAll()
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
  }, [organizationId, projectId, taskId, token, completeGeneration])

  useEffect(() => {
    if (!pageSize) return

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
  }, [page, pageSize])

  useEffect(() => {
    if (!organizationId || !projectId || !taskId) return
    reloadAll()
  }, [page, pageSize])

  // **Check for running jobs when task loads**
  useEffect(() => {
    if (!(organizationId && projectId && taskId && token)) return
    checkRunningJobs()
  }, [organizationId, projectId, taskId, token])

  // **Cleanup polling on unmount**
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
      pollJobStatus,
      selectedDocuments,
      setSelectedDocuments,
      reloadAll,
      token
    })

  const { exportDocumentInsightCsv, exportSingleDocumentInsightCsv, isExportingCsv } = useExportFile({
    organizationId,
    projectId,
    taskId,
    documentNodeId: activeNode?.id,
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
          isPageLoading={isPageLoading}
          isExportingCsv={isExportingCsv}
          onExportCsv={exportDocumentInsightCsv}
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
            filter: isLoading ? 'blur(6px)' : 'none'
          }}
        >
          <DocumentInsightsGrid
            openDialog={openDialog}
            documents={documents}
            questions={questions}
            answers={answers}
            onGenerate={docs => handleGenerate({ docs: docs, reGenerateExistingAnswers: true })}
            isPageLoading={isPageLoading}
            isLoadingAnswers={isLoadingAnswers}
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
        reloadAll={reloadAll}
        taskId={taskId}
        organizationId={organizationId}
        projectId={projectId}
        token={token}
        documents={documents}
        questions={questions}
        addQuestionMode={addQuestionMode}
        isExportingCsv={isExportingCsv}
        onExportCsv={exportSingleDocumentInsightCsv}
      />
    </>
  )
}

export default DocumentInsightsTable
