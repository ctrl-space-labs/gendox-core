import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  fetchLatestEOScriptThunk,
  fetchEOScriptsThunk,
  resetEOScriptState,
  createEOScriptThunk
} from 'src/store/earthObservation'
import { editorCodeRef } from 'src/views/pages/earth-observation/panels/shared/panelState'
import { buildSaveDescription } from '../utils/editorDateUtils'

export default function useEOScripts({ organizationId, projectId, taskId, token, editorRef, code, setCode }) {
  const dispatch = useDispatch()
  const { latestEOScriptLoading, latestEOScript, eoScripts, createEOScriptLoading } = useSelector(
    state => state.earthObservation.scripts
  )

  const [currentScriptName, setCurrentScriptName] = useState('New Script')
  const [currentVersionId, setCurrentVersionId] = useState(null)
  const [scriptMenuAnchor, setScriptMenuAnchor] = useState(null)
  const [versionMenuAnchor, setVersionMenuAnchor] = useState(null)
  const [newScriptDialogOpen, setNewScriptDialogOpen] = useState(false)
  const [newScriptNameInput, setNewScriptNameInput] = useState('')
  const [isFirstScript, setIsFirstScript] = useState(false)

  // One entry per unique title — most recent first (eoScripts already sorted desc)
  const distinctScripts = useMemo(() => {
    const seen = new Set()
    return eoScripts.filter(s => {
      if (!s.title || seen.has(s.title)) return false
      seen.add(s.title)
      return true
    })
  }, [eoScripts])

  // All versions of the currently active named script
  const currentScriptVersions = useMemo(
    () => eoScripts.filter(s => s.title === currentScriptName),
    [eoScripts, currentScriptName]
  )

  // The currently loaded version object
  const currentVersion = currentScriptVersions.find(v => v.id === currentVersionId) ?? currentScriptVersions[0] ?? null

  useEffect(() => {
    const doFetch = async () => {
      const [latestResult, allResult] = await Promise.all([
        dispatch(fetchLatestEOScriptThunk({ organizationId, projectId, taskId, token })),
        dispatch(fetchEOScriptsThunk({ organizationId, projectId, taskId, token }))
      ])

      const noScripts =
        allResult.payload == null || (Array.isArray(allResult.payload) && allResult.payload.length === 0)
      const noLatest = latestResult.payload == null
      if (noScripts && noLatest) {
        setIsFirstScript(true)
        setNewScriptNameInput('')
      }
    }

    doFetch()
    return () => {
      dispatch(resetEOScriptState())
      setIsFirstScript(false)
    }
  }, [dispatch, organizationId, projectId, taskId, token])

  useEffect(() => {
    if (latestEOScript?.scriptContent) {
      setCode(latestEOScript.scriptContent)
      editorCodeRef.current = latestEOScript.scriptContent
    }
    if (latestEOScript?.title) setCurrentScriptName(latestEOScript.title)
    if (latestEOScript?.id) setCurrentVersionId(latestEOScript.id)
  }, [latestEOScript])

  const handleSelectScript = script => {
    setCode(script.scriptContent)
    editorCodeRef.current = script.scriptContent
    editorRef.current?.setValue?.(script.scriptContent)
    setCurrentScriptName(script.title)
    setCurrentVersionId(script.id)
    setScriptMenuAnchor(null)
  }

  const handleSelectVersion = version => {
    setCode(version.scriptContent)
    editorCodeRef.current = version.scriptContent
    editorRef.current?.setValue?.(version.scriptContent)
    setCurrentVersionId(version.id)
    setVersionMenuAnchor(null)
  }

  const handleOpenNewScriptDialog = () => {
    setNewScriptNameInput('')
    setScriptMenuAnchor(null)
    setNewScriptDialogOpen(true)
  }

  const handleCreateNewScript = () => {
    const name = newScriptNameInput.trim() || 'New Script'
    setCurrentScriptName(name)
    setCurrentVersionId(null)
    setCode('')
    editorRef.current?.setValue?.('')
    setIsFirstScript(false)
    setNewScriptDialogOpen(false)
  }

  const handleSave = () => {
    const currentCode = (editorRef.current?.getValue?.() ?? code ?? '').trim()
    if (!currentCode || !organizationId || !projectId || !taskId || !token) return

    dispatch(
      createEOScriptThunk({
        organizationId,
        projectId,
        taskId,
        eoScriptPayload: {
          title: currentScriptName || 'New Script',
          description: buildSaveDescription(),
          scriptContent: currentCode
        },
        token
      })
    )
  }

  const hasUnsavedChanges = code.trim() !== (currentVersion?.scriptContent ?? '').trim()

  return {
    latestEOScriptLoading,
    createEOScriptLoading,
    distinctScripts,
    currentScriptVersions,
    currentVersion,
    currentScriptName,
    currentVersionId,
    isFirstScript,
    newScriptDialogOpen,
    setNewScriptDialogOpen,
    newScriptNameInput,
    setNewScriptNameInput,
    hasUnsavedChanges,
    scriptMenuAnchor,
    setScriptMenuAnchor,
    versionMenuAnchor,
    setVersionMenuAnchor,
    handleSelectScript,
    handleSelectVersion,
    handleOpenNewScriptDialog,
    handleCreateNewScript,
    handleSave
  }
}
