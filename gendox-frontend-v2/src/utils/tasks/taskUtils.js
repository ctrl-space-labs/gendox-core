export const TASK_TYPE_MAP = {
  DEEP_RESEARCH: { label: 'Deep Research', color: 'primary' },
  DOCUMENT_INSIGHTS: { label: 'Document Insights', color: 'success' },
  DOCUMENT_DIGITIZATION: { label: 'Document Digitization', color: 'warning' },
  EARTH_OBSERVATION: { label: 'Earth Observation', color: 'info' }
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

/**
 * Read every page of a paginated endpoint. `fetchPage(page, size)` must resolve to a
 * Spring Page ({ content, totalPages }). `maxPages` is a safety valve.
 */
export const fetchAllPages = async (fetchPage, { size = 100, maxPages = 50 } = {}) => {
  const items = []
  let page = 0
  let totalPages = 1

  while (page < totalPages && page < maxPages) {
    const data = await fetchPage(page, size)
    totalPages = data?.totalPages || 0
    items.push(...(data?.content || []))
    page += 1
  }

  return items
}

/**
 * Run `handler` over `items`, `concurrency` at a time, draining a shared queue.
 * `onProgress(done, total)` fires after each item; `weight` lets one item count
 * for more than one unit of progress (e.g. a batch of 10 documents).
 */
export const runWithConcurrency = async (items, concurrency, handler, { onProgress, weight = () => 1 } = {}) => {
  const queue = [...items]
  const total = items.reduce((sum, item) => sum + weight(item), 0)
  let done = 0

  const worker = async () => {
    while (queue.length) {
      const item = queue.shift()
      await handler(item)
      done += weight(item)
      onProgress?.(done, total)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))
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
