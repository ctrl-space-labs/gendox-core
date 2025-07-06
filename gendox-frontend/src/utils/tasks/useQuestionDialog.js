// src/hooks/useQuestionDialog.js
import { useState } from 'react'

export const useQuestionDialog = () => {
  const [showDialog, setShowDialog] = useState(false)
  const [questionText, setQuestionText] = useState('')
  const [editingQuestion, setEditingQuestion] = useState(null)

  const openAddDialog = () => {
    setEditingQuestion(null)
    setQuestionText('')
    setShowDialog(true)
  }

  const openEditDialog = question => {
    setEditingQuestion(question)
    setQuestionText(question.text)
    setShowDialog(true)
  }

  const closeDialog = () => {
    setShowDialog(false)
    setQuestionText('')
    setEditingQuestion(null)
  }

  return {
    showDialog,
    questionText,
    setQuestionText,
    editingQuestion,
    openAddDialog,
    openEditDialog,
    closeDialog
  }
}
