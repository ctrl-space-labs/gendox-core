import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { Box } from '@mui/material'
import Paper from '@mui/material/Paper'
import { loadTaskInsightsData } from 'src/store/activeTaskNode/activeTaskNode'
import useDocumentInsightsGeneration from 'src/views/pages/tasks/document-insights/table-hooks/useDocumentInsightsGeneration'
import useExportFile from 'src/views/pages/tasks/helping-components/TaskExportFiles'
import DocumentInsightsGrid from 'src/views/pages/tasks/document-insights/table-components/DocumentInsightsGrid'
import HeaderSection from './table-components/DocumentInsightsHeaderSection'
import DialogManager from 'src/views/pages/tasks/document-insights/table-components/DocumentInsightsDialogs'
import { useJobMonitor } from '../generation/useJobMonitor'

const DocumentInsightsTable = ({ selectedTask }) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const token = window.localStorage.getItem('accessToken')
  const { organizationId, taskId, projectId } = router.query
  const { taskNodesDocumentList, taskNodesQuestionList, taskNodesAnswerList, isLoading, isLoadingAnswers } =
    useSelector(state => state.activeTaskNode)

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [dialogs, setDialogs] = useState({
    newDoc: false,
    delete: false,
    answerDetail: false,
    summaryDetail: false,
    questionDetail: false,
    pagePreview: false
  })
  const [activeNode, setActiveNode] = useState(null)
  const [addQuestionMode, setAddQuestionMode] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState([])
  const [isPageReloading, setIsPageReloading] = useState(false)

  const totalDocuments = useMemo(() => taskNodesDocumentList?.totalElements || 0, [taskNodesDocumentList])

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
      insightsSummary: node.nodeValue?.documentMetadata?.insightsSummary || '',
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
    setSelectedDocuments([])
    try {
      await dispatch(
        loadTaskInsightsData({
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

  const { resumeStartedJobs } = useJobMonitor({
    organizationId,
    projectId,
    token,
    reloadAll
  })

  useEffect(() => {
    if (!organizationId || !projectId || !taskId) return
    resumeStartedJobs({ taskId })
  }, [organizationId, projectId, taskId, resumeStartedJobs])

  const handleSelectDocument = (docId, checked) => {
    if (docId === 'all') {
      setSelectedDocuments(checked) // checked will be the array of document IDs
    } else if (docId === 'none') {
      setSelectedDocuments([])
    } else {
      setSelectedDocuments(prev => (checked ? [...prev, docId] : prev.filter(id => id !== docId)))
    }
  }

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
  const { handleGenerate, isInsightsGeneratingAll, isInsightsGeneratingNew, isInsightsGeneratingCells } =
    useDocumentInsightsGeneration({
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

  const isGenerating =
    isInsightsGeneratingAll ||
    isInsightsGeneratingNew ||
    Object.values(isInsightsGeneratingCells || {}).some(v => v === true)

  return (
    <>
      <Paper sx={{ p: 3, overflowX: 'auto', backgroundColor: 'action.hover', mb: 3 }}>
        <HeaderSection
          title={selectedTask?.title}
          description={selectedTask?.description}
          onAddQuestion={() => openDialog('questionDetail', null, true)}
          openAddDocument={() => openDialog('newDoc')}
          handleGenerate={handleGenerate}
          isPageLoading={isPageLoading}
          isExportingCsv={isExportingCsv}
          onExportCsv={exportDocumentInsightCsv}
          selectedDocuments={selectedDocuments}
          isGenerating={isGenerating}
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
            isPageLoading={isPageLoading}
            isLoadingAnswers={isLoadingAnswers}
            page={page}
            pageSize={pageSize}
            setPage={setPage}
            setPageSize={setPageSize}
            totalDocuments={totalDocuments}
            selectedDocuments={selectedDocuments}
            setSelectedDocuments={setSelectedDocuments}
            onSelectDocument={handleSelectDocument}
            handleGenerate={handleGenerate}
            isGeneratingAll={isInsightsGeneratingAll}
            isGeneratingNew={isInsightsGeneratingNew}
            isGeneratingCells={isInsightsGeneratingCells}
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
        handleGenerate={handleGenerate}
      />
    </>
  )
}

export default DocumentInsightsTable
