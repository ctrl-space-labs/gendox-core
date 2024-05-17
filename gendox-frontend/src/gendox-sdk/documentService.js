import axios from "axios";
import apiRequests from "src/configs/apiRequest.js";

/**
 * Get all Project documents
 * @param organizationId
 * @param projectId
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<DocumentInstances[]>>}
 */
const getDocumentByProject = async (organizationId, projectId, storedToken) => {
  return axios.get(
    apiRequests.getDocumentsByProject(organizationId, projectId),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + storedToken,
      },
      params: {
        projectId: projectId,
      },
    }
  );
};

/**
 * Get Document by id 
 * @param documentId
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<Document>>}
 */
const getDocumentById = async (  
  documentId,
  storedToken
) => {
  return axios.get(
    apiRequests.getDocumentById(documentId),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + storedToken,
      },      
    }
  );
};

/**
 * Get project sections 
 * @param documentId
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<DocumentInstanceSections[]>>}
 */
const getSectionsByDocumentId = async (  
  documentId,
  storedToken
) => {
  return axios.get(
    apiRequests.documentSections(documentId),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + storedToken,
      },      
    }
  );
};

/**
 * update document section 
 * @param documentId
 * @param sectionId
 * @param updatedSectionPayload
 * @param storedToken 
 * @returns {Promise<axios.AxiosResponse<DocumentInstanceSection>}
 */
const updateDocumentSection = async (  
  documentId,
  sectionId,
  updatedSectionPayload,
  storedToken
) => {
  return axios.put(
    apiRequests.documentSection(documentId, sectionId),
    updatedSectionPayload,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + storedToken,
      },      
    }
  );
}





/**
 * Upload document
 * @param organizationId
 * @param projectId
 * @param storedToken
 * @param formData
 * @returns {Promise<axios.AxiosResponse<String>>}
 */
const uploadDocument = async (
  organizationId,
  projectId,
  formData,
  storedToken
) => {
  return axios.post(
    apiRequests.uploadDocument(organizationId, projectId),
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${storedToken}`,
      },
    }
  );
};

/**
 * Trigger Spring Jobs for split and training document
 * @param organizationId
 * @param projectId
 * @param storedToken
 * @returns {Promise<axios.AxiosResponse<String>>}
 */
const triggerJobs = async (organizationId, projectId, storedToken) => {
  return axios.get(apiRequests.triggerJobs(organizationId, projectId), {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + storedToken,
    },
    params: {
      projectId: projectId,
    },
  });
};

export default {
  getDocumentByProject,
  getDocumentById,
  getSectionsByDocumentId,
  updateDocumentSection,
  uploadDocument,
  triggerJobs,
};
