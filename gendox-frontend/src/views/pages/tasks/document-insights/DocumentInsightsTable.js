import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { Box } from '@mui/material'
import Paper from '@mui/material/Paper'
import { toast } from 'react-hot-toast'
import { useJobStatusPoller } from 'src/utils/tasks/useJobStatusPoller'
import { fetchTaskNodesByCriteria, fetchAnswerTaskNodes } from 'src/store/activeTask/activeTask'
import { fetchDocumentsByCriteria } from 'src/store/activeDocument/activeDocument'
import useGeneration from 'src/views/pages/tasks/document-insights/table-hooks/useDocumentInsightsGeneration'
import useExportFile from 'src/views/pages/tasks/document-insights/table-hooks/useDocumentInsightsExportFile'
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
    useSelector(state => state.activeTask)
  const isBlurring = useSelector(state => state.activeDocument.isBlurring)

  const [documents, setDocuments] = useState([])
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const totalDocuments = useMemo(() => taskNodesDocumentList?.totalElements || 0, [taskNodesDocumentList])
  const [selectedDocuments, setSelectedDocuments] = useState([])

  const [isSelectingDocuments, setIsSelectingDocuments] = useState(false)
  const [dialogs, setDialogs] = useState({
    newDoc: false,
    delete: false,
    answerDetail: false,
    questionDetail: false
  })
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
              name: fullDoc?.title || 'Unknown Document'
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

  const handleSelectDocument = (docId, checked) => {
    setSelectedDocuments(prev => (checked ? [...prev, docId] : prev.filter(id => id !== docId)))
  }

  // DIALOG HANDLERS
  const openDialog = (dialogType, node = null, forceEditMode = false) => {
    setDialogs(prev => ({ ...prev, [dialogType]: true }))
    setActiveNode(node)
    if (dialogType === 'questionDetail') setEditMode(forceEditMode)
  }
  const closeDialog = dialogType => {
    setDialogs(prev => ({ ...prev, [dialogType]: false }))
    setActiveNode(null)
    if (dialogType === 'questionDetail') setEditMode(false)
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
          onGenerate={reGenerateExistingAnswers =>
            handleGenerate({ docs: documents, reGenerateExistingAnswers, isAll: true })
          }
          disableGenerateAll={documents.length === 0 || questions.length === 0}
          isLoading={isLoading}
          isExportingCsv={isExportingCsv}
          onExportCsv={exportCsv}
          onGenerateSelected={handleGenerateSelected}
          selectedDocuments={selectedDocuments}
          setSelectedDocuments={setSelectedDocuments}
          isGeneratingAll={isGeneratingAll}
          isSelectingDocuments={isSelectingDocuments}
          setIsSelectingDocuments={setIsSelectingDocuments}
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
            isSelectingDocuments={isSelectingDocuments}
          />
        </Box>
      </Paper>

      <DialogManager
        dialogs={dialogs}
        activeNode={activeNode}
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
        editMode={editMode}
      />
    </>
  )
}

export default DocumentInsightsTable
