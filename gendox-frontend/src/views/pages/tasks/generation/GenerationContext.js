import React, { createContext, useContext, useState, useEffect } from 'react'

const GenerationContext = createContext()

export const useGeneration = () => {
  const context = useContext(GenerationContext)
  if (!context) {
    throw new Error('useGeneration must be used within a GenerationProvider')
  }
  return context
}

export const GenerationProvider = ({ children }) => {
  const [activeGenerations, setActiveGenerations] = useState(new Map())
  const keyOf = (taskId, documentId) => `${taskId}-${documentId ?? 'all'}`

  const startGeneration = (taskId, documentId, type, metadata = null) => {
    const key = `${taskId}-${documentId ?? 'all'}`
    setActiveGenerations(
      prev =>
        new Map(
          prev.set(key, {
            taskId,
            documentId,
            type, // 'all', 'new', 'selected', 'single'
            startTime: Date.now(),
            totalItems: metadata?.totalItems || null,
            completedItems: 0,
            status: 'running',
            documentNames: metadata?.documentNames || null,
            totalDocuments: metadata?.totalDocuments || null,
            warningMessage: null,
            // ---- retry metadata ----
            selectedIds: metadata?.selectedIds || null,
            reGenerateExistingAnswers: metadata?.reGenerateExistingAnswers ?? null,
            pageFrom: metadata?.pageFrom ?? null,
            pageTo: metadata?.pageTo ?? null,
            generationType: metadata?.generationType || type
          })
        )
    )
  }



  const updateProgress = (taskId, documentId, completedItems) => {
    const key = `${taskId}-${documentId ?? 'all'}`
    setActiveGenerations(prev => {
      const exists = prev.has(key)
      if (!exists) {
        console.warn('[GEN] updateProgress key NOT FOUND in map!', key, 'current keys:', Array.from(prev.keys()))
        return prev
      }
      const generation = prev.get(key)
      if (generation) {
        return new Map(prev.set(key, { ...generation, completedItems }))
      }
      return prev
    })
  }

  const completeGeneration = (taskId, documentId) => {
    const key = `${taskId}-${documentId ?? 'all'}`
    setActiveGenerations(prev => {
      const newMap = new Map(prev)
      newMap.delete(key)
      return newMap
    })
  }

  const failGeneration = (taskId, documentId, error) => {
    const key = `${taskId}-${documentId ?? 'all'}`
    setActiveGenerations(prev => {
      const generation = prev.get(key)
      if (generation) {
        return new Map(
          prev.set(key, {
            ...generation,
            status: 'failed',
            error: error || 'Unknown error'
          })
        )
      }
      return prev
    })
  }

  const retryGeneration = (taskId, documentId) => {
    const key = `${taskId}-${documentId ?? 'all'}`
    setActiveGenerations(prev => {
      const generation = prev.get(key)
      if (generation) {
        return new Map(
          prev.set(key, {
            ...generation,
            status: 'running',
            error: null,
            startTime: Date.now()
          })
        )
      }
      return prev
    })
  }

  const setGenerationWarning = (taskId, documentId, message) => {
    const key = keyOf(taskId, documentId)
    setActiveGenerations(prev => {
      const gen = prev.get(key)
      if (!gen) return prev
      return new Map(prev.set(key, { ...gen, warningMessage: message }))
    })
  }

  const clearGenerationWarning = (taskId, documentId) => {
    const key = keyOf(taskId, documentId)
    setActiveGenerations(prev => {
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
        startGeneration,
        updateProgress,
        completeGeneration,
        failGeneration,
        retryGeneration,
        setGenerationWarning,
        clearGenerationWarning,
        hasActiveGenerations: activeGenerations.size > 0,
        totalActiveGenerations: activeGenerations.size
      }}
    >
      {children}
    </GenerationContext.Provider>
  )
}

export default GenerationContext
