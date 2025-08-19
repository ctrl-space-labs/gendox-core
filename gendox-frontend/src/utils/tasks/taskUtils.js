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

// Function to check if file type supports page generation
export const isFileTypeSupported = (fileName) => {
  if (!fileName) return true // If no filename, assume supported
  
  const extension = fileName.toLowerCase().split('.').pop()
  
  // Supported formats that can have pages (PDF, Word docs, PowerPoint, etc.)
  const supportedFormats = [
    'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx',
    'odt', 'odp', 'ods', 'rtf', 'pages', 'key', 'numbers'
  ]
  
  // Unsupported formats (text files, markdown, etc.)
  const unsupportedFormats = [
    'txt', 'md', 'csv', 'json', 'xml', 'yaml', 'yml',
    'html', 'htm', 'css', 'js', 'ts', 'py', 'java',
    'c', 'cpp', 'h', 'hpp', 'php', 'rb', 'go', 'rs',
    'sh', 'bat', 'ps1', 'sql', 'log'
  ]
  
  if (unsupportedFormats.includes(extension)) {
    return false
  }
  
  if (supportedFormats.includes(extension)) {
    return true
  }
  
  // For unknown extensions, assume supported (let the backend handle it)
  return true
}
