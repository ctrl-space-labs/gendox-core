export const getQuestionMessageById = (questions, questionId) => {
  const found = questions.find(q => q.id === questionId)
  // fallback to empty string if not found, or use found.text if message doesn't exist
  return found?.message || found?.text || ''
}

export function chunk(array, size) {
  const result = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}
