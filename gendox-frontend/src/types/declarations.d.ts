// Module declarations for JS files that don't have TypeScript types
// These will be properly typed when the files are migrated to TypeScript

declare module "src/authentication/components/RouteHandler" {
  const RouteHandler: React.FC<{ children: React.ReactNode; routeType: string }>
  export default RouteHandler
  export const routeTypes: Record<string, string>
}

declare module "src/authentication/components/OrganizationProjectGuard" {
  const OrganizationProjectGuard: React.FC<{
    children: React.ReactNode
    authProviderOption: string
    pageConfig?: any
  }>
  export default OrganizationProjectGuard
}

declare module "src/authentication/context/AuthContext" {
  export const AuthProvider: React.FC<{ children: React.ReactNode; option: string }>
}

declare module "src/authentication/context/IFrameMessageManagerContext" {
  export const IFrameMessageManagerProvider: React.FC<{
    children: React.ReactNode
  }>
  export function useIFrameMessageManager(): any
}

declare module "src/authentication/useAuth" {
  export function useAuth(): {
    user: any
    logout: () => Promise<void>
    [key: string]: any
  }
}

declare module "src/store" {
  import { Store } from "@reduxjs/toolkit"
  export const store: Store
}

declare module "src/store/activeProject/activeProject" {
  export const fetchProject: any
  export const updateProject: any
  export const deleteProject: any
  export const fetchProjectMembersAndRoles: any
  export const deleteProjectMember: any
}

declare module "src/store/activeOrganization/activeOrganization" {
  export const fetchOrganization: any
  export const fetchAiModelProviders: any
  export const fetchOrganizationAiModelKeys: any
  export const fetchOrganizationPlans: any
  export const fetchApiKeys: any
  export const fetchOrganizationWebSites: any
  export const updateMemberRole: any
  export const removeOrganizationMember: any
  export const fetchOrganizationMembers: any
}

declare module "src/store/activeProjectAgent/activeProjectAgent" {
  export const fetchAiModels: any
  export const fetchExampleTools: any
  export const updateProjectAgent: any
}

declare module "src/store/activeDocument/activeDocument" {
  export const fetchDocuments: any
  export const fetchDocument: any
  export const updateSectionsOrder: any
  export const resetSupportingDocuments: any
}

declare module "src/store/activeTask/activeTask" {
  export const fetchTasks: any
  export const fetchTaskById: any
  export const createTask: any
  export const deleteTask: any
  export const updateTask: any
  export const duplicateTask: any
  export const executeTaskByType: any
  export const setInsightsGeneratingCells: any
  export const removeInsightsGeneratingCells: any
  export const clearInsightsGenerationState: any
  export const setDigitizationGenerating: any
  export const clearDigitizationGenerationState: any
}

declare module "src/utils/identiconUtil" {
  export function generateIdenticon(...args: any[]): string
}

declare module "src/utils/generalConstants" {
  export const localStorageConstants: {
    accessTokenKey: string
    selectedOrganizationId: string
    selectedProjectId: string
    [key: string]: string
  }
}

declare module "src/utils/orderUtils" {
  export function sortByField(arr: any[], field: string, priorityId?: any): any[]
}

declare module "src/configs/common.config" {
  const commonConfig: {
    gendoxHomePage?: string
    [key: string]: any
  }
  export default commonConfig
}

declare module "nprogress" {
  const NProgress: {
    start: () => void
    done: () => void
    [key: string]: any
  }
  export default NProgress
}

declare module "src/gendox-sdk/documentService" {
  const documentService: {
    uploadDocument: (...args: any[]) => Promise<any>
    deleteDocument: (...args: any[]) => Promise<any>
    triggerJobs: (...args: any[]) => Promise<any>
    createDocumentSection: (...args: any[]) => Promise<any>
    deleteDocumentSection: (...args: any[]) => Promise<any>
    updateDocumentSection: (...args: any[]) => Promise<any>
    [key: string]: any
  }
  export default documentService
}

declare module "src/gendox-sdk/organizationService" {
  const organizationService: {
    updateOrganization: (...args: any[]) => Promise<any>
    deactivateOrganizationById: (...args: any[]) => Promise<any>
    [key: string]: any
  }
  export default organizationService
}

declare module "src/gendox-sdk/aiModelService" {
  const aiModelService: {
    createAiModelKey: (...args: any[]) => Promise<any>
    updateAiModelKey: (...args: any[]) => Promise<any>
    deleteAiModelKey: (...args: any[]) => Promise<any>
    [key: string]: any
  }
  export default aiModelService
}

declare module "src/gendox-sdk/apiKeyService" {
  const apiKeyService: {
    createApiKey: (...args: any[]) => Promise<any>
    updateApiKey: (...args: any[]) => Promise<any>
    deleteApiKey: (...args: any[]) => Promise<any>
    [key: string]: any
  }
  export default apiKeyService
}

declare module "src/gendox-sdk/organizationWebSiteService" {
  const organizationWebSiteService: {
    createOrganizationWebSite: (...args: any[]) => Promise<any>
    updateOrganizationWebSite: (...args: any[]) => Promise<any>
    deleteOrganizationWebSite: (...args: any[]) => Promise<any>
    [key: string]: any
  }
  export default organizationWebSiteService
}

declare module "src/gendox-sdk/invitationService" {
  const invitationService: {
    inviteProjectMember: (...args: any[]) => Promise<any>
    [key: string]: any
  }
  export default invitationService
}

declare module "src/gendox-sdk/userService" {
  const userService: {
    deactivateUserById: (...args: any[]) => Promise<any>
    [key: string]: any
  }
  export default userService
}

declare module "src/utils/validators" {
  export function isValidOrganizationAndProject(...args: any[]): boolean
  export function isValidOrganization(...args: any[]): boolean
}

declare module "src/utils/errorHandler" {
  export function getErrorMessage(error: any): string
}

declare module "src/utils/sortModels" {
  export function sortModels(models: any[]): any[]
}

declare module "src/utils/tasks/taskUtils" {
  export const TASK_TYPE_MAP: Record<string, { label: string; color: string }>
  export function getQuestionMessageById(questions: any[], questionId: string): string
  export function chunk(array: any[], size: number): any[][]
  export const isFileTypeSupported: (fileName: string) => boolean
  export const getFileTypeValidator: (taskType: string) => (fileName: string) => boolean
}

declare module "react-mde" {
  const ReactMde: React.FC<any>
  export default ReactMde
}

declare module "showdown" {
  export class Converter {
    constructor(options?: any)
    makeHtml(text: string): string
  }
}

declare module "react-beautiful-dnd" {
  export const DragDropContext: React.FC<any>
  export const Droppable: React.FC<any>
  export const Draggable: React.FC<any>
}

declare module "src/store/chat/gendoxChat" {
  export const fetchThreads: any
  export const loadThread: any
  export const sendMessage: any
  export const fetchMessageMetadata: any
  export const chatActions: {
    resetChatState: () => any
    updateCurrentThreadWithAgent: () => any
    updateCurrentThreadWithThreadObj: () => any
    clearCurrentMessageMetadata: () => any
    [key: string]: any
  }
}

declare module "src/gendox-sdk/chatThreadService" {
  const chatThreadService: {
    updateChatThread: (...args: any[]) => Promise<any>
    deleteChatThread: (...args: any[]) => Promise<any>
    [key: string]: any
  }
  export default chatThreadService
}

declare module "src/utils/copyToClipboard" {
  export function copyToClipboard(text: string): void
}

declare module "src/@core/layouts/BlankLayout" {
  const BlankLayout: React.FC<{ children: React.ReactNode }>
  export default BlankLayout
}

declare module "src/layouts/components/shared-components/PoweredByGendox" {
  const PoweredByGendox: React.FC
  export default PoweredByGendox
}

declare module "src/configs/themeConfig" {
  const themeConfig: {
    menuTextTruncate?: boolean
    [key: string]: any
  }
  export default themeConfig
}

declare module "src/gendox-sdk/taskService" {
  const taskService: {
    createTask: (...args: any[]) => Promise<any>
    duplicateTask: (...args: any[]) => Promise<any>
    getTasks: (...args: any[]) => Promise<any>
    updateTask: (...args: any[]) => Promise<any>
    getTaskById: (...args: any[]) => Promise<any>
    getTaskNodesByTaskId: (...args: any[]) => Promise<any>
    getTaskNodesByCriteria: (...args: any[]) => Promise<any>
    getDocumentPages: (...args: any[]) => Promise<any>
    getAnswerTaskNodes: (...args: any[]) => Promise<any>
    createTaskNode: (...args: any[]) => Promise<any>
    createTaskNodesBatch: (...args: any[]) => Promise<any>
    updateTaskNode: (...args: any[]) => Promise<any>
    getTaskNodeById: (...args: any[]) => Promise<any>
    createTaskEdge: (...args: any[]) => Promise<any>
    getTaskEdgeById: (...args: any[]) => Promise<any>
    getTaskEdgesByCriteria: (...args: any[]) => Promise<any>
    executeTaskByType: (...args: any[]) => Promise<any>
    getJobsByCriteria: (...args: any[]) => Promise<any>
    deleteTaskNode: (...args: any[]) => Promise<any>
    deleteTask: (...args: any[]) => Promise<any>
    documentInsightsExportAllCSV: (...args: any[]) => Promise<any>
    documentInsightsExportCSV: (...args: any[]) => Promise<any>
    documentDigitizationExportCSV: (...args: any[]) => Promise<any>
    [key: string]: any
  }
  export default taskService
}

declare module "src/store/activeTaskNode/activeTaskNode" {
  export const createTaskNode: any
  export const createTaskNodesBatch: any
  export const updateTaskNode: any
  export const fetchTaskNodeById: any
  export const fetchTaskNodesByTaskId: any
  export const fetchTaskNodesByCriteria: any
  export const fetchAnswerTaskNodes: any
  export const fetchDocumentPages: any
  export const deleteTaskNode: any
  export const loadTaskDigitizationData: any
  export const loadTaskInsightsData: any
}

declare module "src/utils/tasks/downloadBlobForCSV" {
  export function downloadBlobForCSV(blob: Blob | Uint8Array, fileName: string): void
}

declare module "src/utils/tasks/fileFormats" {
  export const DOCUMENT_DIGITIZATION_SUPPORTED_EXTENSIONS: string[]
  export const DOCUMENT_INSIGHTS_SUPPORTED_EXTENSIONS: string[]
  export const DOCUMENT_DIGITIZATION_UNSUPPORTED_EXTENSIONS: string[]
  export const DOCUMENT_INSIGHTS_UNSUPPORTED_EXTENSIONS: string[]
  export const DOCUMENT_DIGITIZATION_SUPPORTED_MIME_TYPES: Record<string, string[]>
  export const DOCUMENT_INSIGHTS_SUPPORTED_MIME_TYPES: Record<string, string[]>
  export const DOCUMENT_DIGITIZATION_SUPPORTED_FORMAT_NAMES: string[]
  export const DOCUMENT_INSIGHTS_SUPPORTED_FORMAT_NAMES: string[]
  export function isDocumentDigitizationFileTypeSupported(fileName: string): boolean
  export function isDocumentInsightsFileTypeSupported(fileName: string): boolean
  export function isFileTypeSupported(fileName: string, taskType: string): boolean
  export function getSupportedMimeTypes(taskType: string): Record<string, string[]>
  export function getUnsupportedFormatMessage(unsupportedFiles: any[], taskType: string): string
}

declare module "src/views/pages/markdown-renderer/GendoxMarkdownRenderer" {
  interface GendoxMarkdownRendererProps {
    markdownText: string
    classNameOverrides?: Record<string, string>
  }
  const GendoxMarkdownRenderer: React.FC<GendoxMarkdownRendererProps>
  export default GendoxMarkdownRenderer
}
