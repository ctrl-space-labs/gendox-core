// Centralized file format configuration for document digitization
// This file defines which file formats are supported for digitization tasks

// Supported file extensions for document digitization
export const DOCUMENT_DIGITIZATION_SUPPORTED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx',
  'odt', 'odp', 'ods', 'rtf', 'pages', 'key', 'numbers'
]

export const DOCUMENT_INSIGHTS_SUPPORTED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx',
  'odt', 'odp', 'ods', 'rtf', 'pages', 'key', 'numbers',
  'txt', 'md', 'csv', 'json', 'xml', 'yaml', 'yml',
  'html', 'htm'
]

// Explicitly unsupported file extensions (text files, code, etc.)
export const DOCUMENT_DIGITIZATION_UNSUPPORTED_EXTENSIONS = [
  'txt', 'md', 'csv', 'json', 'xml', 'yaml', 'yml',
  'html', 'htm', 'css', 'js', 'ts', 'py', 'java',
  'c', 'cpp', 'h', 'hpp', 'php', 'rb', 'go', 'rs',
  'sh', 'bat', 'ps1', 'sql', 'log'
]

export const DOCUMENT_INSIGHTS_UNSUPPORTED_EXTENSIONS = [
  'css', 'js', 'ts', 'py', 'java',
  'c', 'cpp', 'h', 'hpp', 'php', 'rb', 'go', 'rs',
  'sh', 'bat', 'ps1'
]

// MIME type mappings for react-dropzone accept configuration
export const DOCUMENT_DIGITIZATION_SUPPORTED_MIME_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.oasis.opendocument.text': ['.odt'],
  'application/vnd.oasis.opendocument.presentation': ['.odp'],
  'application/vnd.oasis.opendocument.spreadsheet': ['.ods'],
  'application/rtf': ['.rtf']
}

export const DOCUMENT_INSIGHTS_SUPPORTED_MIME_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.oasis.opendocument.text': ['.odt'],
  'application/vnd.oasis.opendocument.presentation': ['.odp'],
  'application/vnd.oasis.opendocument.spreadsheet': ['.ods'],
  'application/rtf': ['.rtf'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'text/csv': ['.csv'],
  'application/json': ['.json'],
  'application/xml': ['.xml'],
  'application/x-yaml': ['.yaml', '.yml'],
  'text/html': ['.html', '.htm']
}

// Human-readable format names for user messages
export const DOCUMENT_DIGITIZATION_SUPPORTED_FORMAT_NAMES = [
  'PDF', 'DOC', 'DOCX', 'PPT', 'PPTX', 'XLS', 'XLSX', 'ODT', 'ODP', 'ODS', 'RTF'
]

export const DOCUMENT_INSIGHTS_SUPPORTED_FORMAT_NAMES = [
  'PDF', 'DOC', 'DOCX', 'PPT', 'PPTX', 'XLS', 'XLSX',
  'ODT', 'ODP', 'ODS', 'RTF', 'TXT', 'MD', 'CSV', 'JSON',
  'XML', 'YAML', 'YML', 'HTML'
]

// Function to check if file type supports document digitization
export const isDocumentDigitizationFileTypeSupported = (fileName) => {
  if (!fileName) return true // If no filename, assume supported
  
  const extension = fileName.toLowerCase().split('.').pop()
  
  if (DOCUMENT_DIGITIZATION_UNSUPPORTED_EXTENSIONS.includes(extension)) {
    return false
  }
  
  if (DOCUMENT_DIGITIZATION_SUPPORTED_EXTENSIONS.includes(extension)) {
    return true
  }
  
  // For unknown extensions, assume supported (let the backend handle it)
  return true
}

export const isDocumentInsightsFileTypeSupported = (fileName) => {
  if (!fileName) return true // If no filename, assume supported
  
  const extension = fileName.toLowerCase().split('.').pop()
  
  if (DOCUMENT_INSIGHTS_UNSUPPORTED_EXTENSIONS.includes(extension)) {
    return false
  }
  
  if (DOCUMENT_INSIGHTS_SUPPORTED_EXTENSIONS.includes(extension)) {
    return true
  }
  
  // For unknown extensions, assume supported (let the backend handle it)
  return true
}


// 1. Configuration Map: Links taskTypes to their specific configs
const TASK_CONFIGS = {
  'document-insights': {
    supported: DOCUMENT_INSIGHTS_SUPPORTED_EXTENSIONS,
    unsupported: DOCUMENT_INSIGHTS_UNSUPPORTED_EXTENSIONS,
    mimeTypes: DOCUMENT_INSIGHTS_SUPPORTED_MIME_TYPES,
    formatNames: DOCUMENT_INSIGHTS_SUPPORTED_FORMAT_NAMES
  },
  // Default fallback
  'document-digitization': {
    supported: DOCUMENT_DIGITIZATION_SUPPORTED_EXTENSIONS,
    unsupported: DOCUMENT_DIGITIZATION_UNSUPPORTED_EXTENSIONS,
    mimeTypes: DOCUMENT_DIGITIZATION_SUPPORTED_MIME_TYPES,
    formatNames: DOCUMENT_DIGITIZATION_SUPPORTED_FORMAT_NAMES
  }
}

// Helper to get the config safely
const getConfig = (taskType) => {
  return TASK_CONFIGS[taskType] || TASK_CONFIGS['document-digitization']
}

// 2. Generic Function to check if file type is supported
export const isFileTypeSupported = (fileName, taskType) => {
  if (!fileName) return true 
  
  const config = getConfig(taskType)
  const extension = fileName.toLowerCase().split('.').pop()
  
  if (config.unsupported.includes(extension)) {
    return false
  }
  
  if (config.supported.includes(extension)) {
    return true
  }
  
  return true
}

// 3. Generic Function to get MIME types for Dropzone
export const getSupportedMimeTypes = (taskType) => {
  const config = getConfig(taskType)
  return config.mimeTypes
}

// 4. Generic Function for error messages
export const getUnsupportedFormatMessage = (unsupportedFiles, taskType) => {
  const config = getConfig(taskType)
  const fileNames = unsupportedFiles.map(f => f.name).join(', ')
  const formatList = config.formatNames.join(', ')
  
  return `Unsupported file format(s): ${fileNames}. Please upload ${formatList} or similar document formats.`
}