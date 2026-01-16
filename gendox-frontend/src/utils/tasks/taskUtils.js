export const TASK_TYPE_MAP = {
  DEEP_RESEARCH: { label: 'Deep Research', color: 'primary' },
  DOCUMENT_INSIGHTS: { label: 'Document Insights', color: 'success' },
  DOCUMENT_DIGITIZATION: { label: 'Document Digitization', color: 'warning' }
}

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

// Import centralized file format configuration for document digitization
import { isDocumentDigitizationFileTypeSupported, isDocumentInsightsFileTypeSupported } from './fileFormats'

// Re-export for backward compatibility
export const isFileTypeSupported = isDocumentDigitizationFileTypeSupported

export const getFileTypeValidator = taskType => {
  if (taskType === 'document-insights') {
    return isDocumentInsightsFileTypeSupported
  }
  // Default to document digitization
  return isDocumentDigitizationFileTypeSupported
}
