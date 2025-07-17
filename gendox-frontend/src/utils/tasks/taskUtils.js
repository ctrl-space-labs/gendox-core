export const getQuestionMessageById = (questions, questionId) => {
  const found = questions.find(q => q.id === questionId)
  // fallback to empty string if not found, or use found.text if message doesn't exist
  return found?.message || found?.text || ''
}
