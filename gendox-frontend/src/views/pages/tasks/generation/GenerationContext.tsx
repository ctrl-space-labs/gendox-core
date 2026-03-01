import React, { createContext, useContext, useState } from "react"

interface GenerationMetadata {
  totalItems?: number | null
  documentNames?: string | null
  totalDocuments?: number | null
  selectedIds?: string[] | null
  reGenerateExistingAnswers?: boolean | null
  pageFrom?: number | null
  pageTo?: number | null
  generationType?: string
  completedItems?: number
}

interface GenerationEntry {
  taskId: string
  documentId: string | null
  type: string
  startTime: number
  totalItems: number | null
  completedItems: number
  status: "running" | "failed"
  documentNames: string | null
  totalDocuments: number | null
  warningMessage: string | null
  selectedIds: string[] | null
  reGenerateExistingAnswers: boolean | null
  pageFrom: number | null
  pageTo: number | null
  generationType: string
  error?: string | null
}

interface GenerationContextValue {
  activeGenerations: Map<string, GenerationEntry>
  startGenerationMonitor: (
    taskId: string,
    documentId: string | null,
    type: string,
    metadata?: GenerationMetadata | null
  ) => void
  updateProgress: (
    taskId: string,
    documentId: string | null,
    completedItems: number
  ) => void
  completeGeneration: (taskId: string, documentId: string | null) => void
  failGeneration: (
    taskId: string,
    documentId: string | null,
    error?: string
  ) => void
  retryGeneration: (taskId: string, documentId: string | null) => void
  setGenerationWarning: (
    taskId: string,
    documentId: string | null,
    message: string
  ) => void
  clearGenerationWarning: (
    taskId: string,
    documentId: string | null
  ) => void
  hasActiveGenerations: boolean
  totalActiveGenerations: number
}

interface GenerationMonitorProviderProps {
  children: React.ReactNode
}

const GenerationContext = createContext<GenerationContextValue | undefined>(
  undefined
)

export const useGeneration = (): GenerationContextValue => {
  const context = useContext(GenerationContext)
  if (!context) {
    throw new Error(
      "useGeneration must be used within a GenerationMonitorProvider"
    )
  }
  return context
}

export const GenerationMonitorProvider = ({
  children,
}: GenerationMonitorProviderProps) => {
  const [activeGenerations, setActiveGenerations] = useState<
    Map<string, GenerationEntry>
  >(new Map())
  const keyOf = (taskId: string, documentId: string | null) =>
    `${taskId}-${documentId ?? "all"}`

  const startGenerationMonitor = (
    taskId: string,
    documentId: string | null,
    type: string,
    metadata: GenerationMetadata | null = null
  ) => {
    const key = `${taskId}-${documentId ?? "all"}`
    setActiveGenerations(
      (prev) =>
        new Map(
          prev.set(key, {
            taskId,
            documentId,
            type, // 'all', 'new', 'selected', 'single'
            startTime: Date.now(),
            totalItems: metadata?.totalItems || null,
            completedItems: 0,
            status: "running",
            documentNames: metadata?.documentNames || null,
            totalDocuments: metadata?.totalDocuments || null,
            warningMessage: null,
            // ---- retry metadata ----
            selectedIds: metadata?.selectedIds || null,
            reGenerateExistingAnswers:
              metadata?.reGenerateExistingAnswers ?? null,
            pageFrom: metadata?.pageFrom ?? null,
            pageTo: metadata?.pageTo ?? null,
            generationType: metadata?.generationType || type,
          })
        )
    )
  }

  const updateProgress = (
    taskId: string,
    documentId: string | null,
    completedItems: number
  ) => {
    const key = `${taskId}-${documentId ?? "all"}`
    setActiveGenerations((prev) => {
      const exists = prev.has(key)
      if (!exists) {
        console.warn(
          "[GEN] updateProgress key NOT FOUND in map!",
          key,
          "current keys:",
          Array.from(prev.keys())
        )
        return prev
      }
      const generation = prev.get(key)
      if (generation) {
        return new Map(prev.set(key, { ...generation, completedItems }))
      }
      return prev
    })
  }

  const completeGeneration = (
    taskId: string,
    documentId: string | null
  ) => {
    const key = `${taskId}-${documentId ?? "all"}`
    setActiveGenerations((prev) => {
      const newMap = new Map(prev)
      newMap.delete(key)
      return newMap
    })
  }

  const failGeneration = (
    taskId: string,
    documentId: string | null,
    error?: string
  ) => {
    const key = `${taskId}-${documentId ?? "all"}`
    setActiveGenerations((prev) => {
      const generation = prev.get(key)
      if (generation) {
        return new Map(
          prev.set(key, {
            ...generation,
            status: "failed",
            error: error || "Unknown error",
          })
        )
      }
      return prev
    })
  }

  const retryGeneration = (
    taskId: string,
    documentId: string | null
  ) => {
    const key = `${taskId}-${documentId ?? "all"}`
    setActiveGenerations((prev) => {
      const generation = prev.get(key)
      if (generation) {
        return new Map(
          prev.set(key, {
            ...generation,
            status: "running",
            error: null,
            startTime: Date.now(),
          })
        )
      }
      return prev
    })
  }

  const setGenerationWarning = (
    taskId: string,
    documentId: string | null,
    message: string
  ) => {
    const key = keyOf(taskId, documentId)
    setActiveGenerations((prev) => {
      const gen = prev.get(key)
      if (!gen) return prev
      return new Map(prev.set(key, { ...gen, warningMessage: message }))
    })
  }

  const clearGenerationWarning = (
    taskId: string,
    documentId: string | null
  ) => {
    const key = keyOf(taskId, documentId)
    setActiveGenerations((prev) => {
      const gen = prev.get(key)
      if (!gen) return prev
      if (!gen.warningMessage) return prev
      return new Map(prev.set(key, { ...gen, warningMessage: null }))
    })
  }

  return (
    <GenerationContext.Provider
      value={{
        activeGenerations,
        startGenerationMonitor,
        updateProgress,
        completeGeneration,
        failGeneration,
        retryGeneration,
        setGenerationWarning,
        clearGenerationWarning,
        hasActiveGenerations: activeGenerations.size > 0,
        totalActiveGenerations: activeGenerations.size,
      }}
    >
      {children}
    </GenerationContext.Provider>
  )
}

export default GenerationContext
