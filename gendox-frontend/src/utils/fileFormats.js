// Centralized file format configuration for document digitization
// This file defines which file formats are supported for digitization tasks

// Supported file extensions for document digitization
export const DOCUMENT_DIGITIZATION_SUPPORTED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx',
  'odt', 'odp', 'ods', 'rtf', 'pages', 'key', 'numbers'
]

// Explicitly unsupported file extensions (text files, code, etc.)
export const DOCUMENT_DIGITIZATION_UNSUPPORTED_EXTENSIONS = [
  'txt', 'md', 'csv', 'json', 'xml', 'yaml', 'yml',
  'html', 'htm', 'css', 'js', 'ts', 'py', 'java',
  'c', 'cpp', 'h', 'hpp', 'php', 'rb', 'go', 'rs',
  'sh', 'bat', 'ps1', 'sql', 'log'
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

// Human-readable format names for user messages
export const DOCUMENT_DIGITIZATION_SUPPORTED_FORMAT_NAMES = [
  'PDF', 'DOC', 'DOCX', 'PPT', 'PPTX', 'XLS', 'XLSX', 'ODT', 'ODP', 'ODS', 'RTF'
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

// Get user-friendly error message for unsupported formats
export const getDocumentDigitizationUnsupportedFormatMessage = (unsupportedFiles) => {
  const fileNames = unsupportedFiles.map(f => f.name).join(', ')
  const formatList = DOCUMENT_DIGITIZATION_SUPPORTED_FORMAT_NAMES.join(', ')
  return `Unsupported file format(s): ${fileNames}. Please upload ${formatList} or similar document formats.`
}