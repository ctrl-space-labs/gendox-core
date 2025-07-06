// src/utils/taskUtils.js
import { toast } from 'react-hot-toast'
import { createTaskNode, updateTaskNode, fetchTaskNodesByTaskId, fetchTaskEdgesByCriteria } from 'src/store/activeTask/activeTask'

export const saveQuestion = async ({
  dispatch,
  organizationId,
  projectId,
  taskId,
  token,
  questionText,
  editingQuestion,
  closeDialog
}) => {
  if (!questionText.trim()) return

  try {
    const nodeValuePayload = { message: questionText.trim() }
    if (editingQuestion) {
      const updatedPayload = {
        id: editingQuestion.id,
        taskId,
        nodeType: 'QUESTION',
        nodeValue: nodeValuePayload
      }
      await dispatch(updateTaskNode({ organizationId, projectId, taskNodePayload: updatedPayload, token })).unwrap()
    } else {
      const newPayload = {
        taskId,
        nodeType: 'QUESTION',
        nodeValue: nodeValuePayload
      }
      await dispatch(createTaskNode({ organizationId, projectId, taskNodePayload: newPayload, token })).unwrap()
    }
    await dispatch(fetchTaskNodesByTaskId({ organizationId, projectId, taskId, token }))
    closeDialog()
  } catch (error) {
    console.error('Failed to add/edit question node:', error)
    toast.error('Failed to save question')
  }
}

export const refreshAnswers = async ({
  dispatch,
  organizationId,
  projectId,
  documents,
  questions,
  token
}) => {
  const toNodeIds = [...documents.map(d => d.id), ...questions.map(q => q.id)]
  if (toNodeIds.length > 0) {
    await dispatch(
      fetchTaskEdgesByCriteria({
        organizationId,
        projectId,
        criteria: { relationType: 'ANSWERS', toNodeIds },
        token
      })
    )
  }
}
