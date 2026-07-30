import axios from 'axios'
import apiRequests from 'src/configs/apiRequest.js'

/**
 * Get all documents by criteria (POST body — for complex filters like id lists / date ranges)
 * @param organizationId
 * @param projectId
 * @param criteria
 * @param token
 * @param page
 * @param size
 * @returns {Promise<axios.AxiosResponse<DocumentInstances[]>>}
 */
const findDocumentsByCriteria = async (organizationId, projectId, criteria, token, page, size) => {
  return axios.post(apiRequests.findDocumentsByCriteria(organizationId, projectId, page, size), criteria, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Get all documents by criteria (GET query params — home page / simple filters)
 * @param organizationId
 * @param projectId
 * @param criteria
 * @param token
 * @param page
 * @param size
 * @returns {Promise<axios.AxiosResponse<DocumentInstances[]>>}
 */
const getDocuments = async (organizationId, projectId, criteria, token, page = 0, size = 20) => {
  return axios.get(apiRequests.documentInstances(organizationId, projectId), {
    params: {
      ...criteria,
      page,
      size,
      sort: 'createdAt,desc'
    },
    headers: {
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Get Document by id
 * @param documentId
 * @param token
 * @returns {Promise<axios.AxiosResponse<Document>>}
 */
const getDocumentById = async (documentId, token) => {
  return axios.get(apiRequests.getDocumentById(documentId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Get project sections
 * @param documentId
 * @param token
 * @returns {Promise<axios.AxiosResponse<DocumentInstanceSections[]>>}
 */
const getSectionsByDocumentId = async (documentId, token) => {
  return axios.get(apiRequests.documentSections(documentId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Diff two documents. Returns patchToDecodedText(patches) — the exact string consumed by diff tools.
 * @param {string} documentIdA
 * @param {string} documentIdB
 * @param {string} token
 */
const diffDocumentsPatchText = async (documentIdA, documentIdB, token) => {
  return axios.get(apiRequests.diffDocumentsPatchText(documentIdA, documentIdB), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * create empty document section
 * @param documentId
 * @param token
 * @returns {Promise<axios.AxiosResponse<DocumentInstanceSection>}
 */
const createDocumentSection = async (documentId, token) => {
  return axios.post(
    apiRequests.documentSections(documentId),
    {},
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      }
    }
  )
}

/**
 * update document section
 * @param documentId
 * @param sectionId
 * @param updatedSectionPayload
 * @param token
 * @returns {Promise<axios.AxiosResponse<DocumentInstanceSection>}
 */
const updateDocumentSection = async (documentId, sectionId, updatedSectionPayload, token) => {
  return axios.put(apiRequests.documentSection(documentId, sectionId), updatedSectionPayload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Upload document
 * @param organizationId
 * @param projectId
 * @param token
 * @param formData
 * @returns {Promise<axios.AxiosResponse<String>>}
 */
const uploadDocument = async (organizationId, projectId, formData, token) => {
  return axios.post(apiRequests.uploadDocument(organizationId, projectId), formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`
    }
  })
}

/**
 * Upload a single document file
 * @param {string} organizationId
 * @param {string} projectId
 * @param {File} file - The single file to upload
 * @param {boolean} messageAttachment - Flag indicating if the upload is a message attachment
 * @param {string} token - Authorization bearer token
 * @returns {Promise<AxiosResponse>}
 */
const uploadSingleDocument = async (organizationId, projectId, file, token, messageAttachment = false) => {
  const formData = new FormData()
  formData.append('file', file)

  return axios.post(apiRequests.uploadSingleDocument(organizationId, projectId), formData, {
    params: { messageAttachment },
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`
    }
  })
}

/**
 * Update Document Sections Order
 * @param documentId
 * @param token
 * @param updatedSectionPayload
 * @returns {Promise<axios.AxiosResponse<String>>}
 */
const updateSectionsOrder = async (documentId, updatedSectionPayload, token) => {
  return axios.put(apiRequests.updateSectionsOrder(documentId), updatedSectionPayload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Delete Document Instance
 * @param organizationId
 * @param projectId
 * @param documentId
 * @param token
 * @returns {Promise<axios.AxiosResponse<String>>}
 */
const deleteDocument = async (organizationId, projectId, documentId, token) => {
  return axios.delete(apiRequests.documentInstance(organizationId, projectId, documentId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Delete multiple Document Instances
 * @param organizationId
 * @param projectId
 * @param documentIds
 * @param token
 * @returns {Promise<axios.AxiosResponse<String>>}
 */
const deleteDocuments = async (organizationId, projectId, documentIds, token) => {
  const documentIdsQuery = documentIds.map(id => `documentIds=${id}`).join('&')

  return axios.delete(`${apiRequests.documentInstances(organizationId, projectId)}?${documentIdsQuery}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * delete Document Section
 * @param documentId
 * @param sectionId
 * @param token
 * @returns {Promise<axios.AxiosResponse<String>>}
 */
const deleteDocumentSection = async (documentId, sectionId, token) => {
  return axios.delete(apiRequests.documentSection(documentId, sectionId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * Trigger Spring Jobs for split and training document
 * @param organizationId
 * @param projectId
 * @param token
 * @returns {Promise<axios.AxiosResponse<String>>}
 */
const triggerJobs = async (organizationId, projectId, token, jobName, projectIdParam) => {
  return axios.get(apiRequests.triggerJobs(organizationId, projectId, jobName, projectIdParam), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
}

/**
 * View document bytes (inline preview) as blob.
 * Use for image/pdf preview with Bearer token.
 */
const viewDocumentContent = async (threadId, documentId, token) => {
  return axios.get(apiRequests.viewDocumentContent(threadId, documentId), {
    responseType: 'blob',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
}

/**
 * Download document bytes as blob.
 * Use for "Download" button.
 */
const downloadDocument = async (threadId, documentId, token) => {
  return axios.get(apiRequests.downloadDocument(threadId, documentId), {
    responseType: 'blob',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
}



export default {
  getDocumentById,
  getSectionsByDocumentId,
  diffDocumentsPatchText,
  createDocumentSection,
  updateDocumentSection,
  uploadDocument,
  uploadSingleDocument,
  updateSectionsOrder,
  deleteDocument,
  deleteDocuments,
  deleteDocumentSection,
  triggerJobs,
  findDocumentsByCriteria,
  getDocuments,
  viewDocumentContent,
  downloadDocument
}
