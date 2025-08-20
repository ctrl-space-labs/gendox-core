import React, { createContext, useContext, useState } from 'react'

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

  const startGeneration = (taskId, documentId, type, totalItems = null) => {
    const key = `${taskId}-${documentId || 'all'}`
    setActiveGenerations(prev => new Map(prev.set(key, {
      taskId,
      documentId,
      type, // 'all', 'new', 'selected', 'single'
      startTime: Date.now(),
      totalItems,
      completedItems: 0,
      status: 'running'
    })))
  }

  const updateProgress = (taskId, documentId, completedItems) => {
    const key = `${taskId}-${documentId || 'all'}`
    setActiveGenerations(prev => {
      const generation = prev.get(key)
      if (generation) {
        return new Map(prev.set(key, { ...generation, completedItems }))
      }
      return prev
    })
  }

  const completeGeneration = (taskId, documentId) => {
    const key = `${taskId}-${documentId || 'all'}`
    setActiveGenerations(prev => {
      const newMap = new Map(prev)
      newMap.delete(key)
      return newMap
    })
  }

  const failGeneration = (taskId, documentId, error) => {
    const key = `${taskId}-${documentId || 'all'}`
    setActiveGenerations(prev => {
      const generation = prev.get(key)
      if (generation) {
        return new Map(prev.set(key, { 
          ...generation, 
          status: 'failed',
          error: error || 'Unknown error'
        }))
      }
      return prev
    })
  }

  const retryGeneration = (taskId, documentId) => {
    const key = `${taskId}-${documentId || 'all'}`
    setActiveGenerations(prev => {
      const generation = prev.get(key)
      if (generation) {
        return new Map(prev.set(key, { 
          ...generation, 
          status: 'running',
          error: null,
          startTime: Date.now()
        }))
      }
      return prev
    })
  }

  return (
    <GenerationContext.Provider value={{
      activeGenerations,
      startGeneration,
      updateProgress,
      completeGeneration,
      failGeneration,
      retryGeneration,
      hasActiveGenerations: activeGenerations.size > 0,
      totalActiveGenerations: activeGenerations.size
    }}>
      {children}
    </GenerationContext.Provider>
  )
}

export default GenerationContext