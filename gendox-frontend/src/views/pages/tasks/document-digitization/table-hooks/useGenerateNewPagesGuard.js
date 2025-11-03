import { useMemo, useCallback } from 'react'

/**
 * Guard logic for "Generate New".
 *
 * Modes:
 * - Global mode (Header): pass { documents, selectedDocuments, documentPages }
 *   -> returns disableGenerateFlag (global), isRangeInvalidForDoc (per doc)
 *
 * - Single-doc mode (Dialog): pass { documentPages, singleDoc: { docId, pageFrom, pageTo, allPages } }
 *   -> returns requestedExceedsGeneratedSingle, and helper generateNewDisabledSingle(uiOpts)
 *
 * Notes:
 * - requested > generated → eligible to "Generate New"
 * - Range check applies only if both from & to exist; else treat as "all pages" when allPages==true
 */
export default function useGenerateNewPagesGuard({
  documents,
  selectedDocuments,
  documentPages,
  singleDoc // optional: { docId, pageFrom, pageTo, allPages }
}) {
  // ---------- shared helpers ----------
  const getGeneratedPagesCount = useCallback(
    docId => {
      const dp = Array.isArray(documentPages)
        ? documentPages.find(p => p.taskDocumentNodeId === docId)
        : (documentPages?.content || []).find(p => p.taskDocumentNodeId === docId)
      return dp?.numberOfNodePages ?? 0
    },
    [documentPages]
  )

  const getTotalPagesCount = useCallback(
    docId => {
      const dp = Array.isArray(documentPages)
        ? documentPages.find(p => p.taskDocumentNodeId === docId)
        : (documentPages?.content || []).find(p => p.taskDocumentNodeId === docId)
      return dp?.documentPages ?? 0
    },
    [documentPages]
  )

  // ---------- global mode (HeaderSection) ----------

  const isRangeInvalidForDoc = useCallback(
    doc => {
      const total = getTotalPagesCount(doc.id)
      const generated = getGeneratedPagesCount(doc.id)

      // Αν δεν υπάρχουν σελίδες, δεν έχει νόημα να παράξουμε κάτι
      if (!total || total <= 0) return false

      // 1) Αν allPages = true -> ζητάμε όλες τις σελίδες
      if (doc?.allPages) {
        return total > generated
      }

      // 2) Αν ΔΕΝ υπάρχει ρητό range -> το αντιμετωπίζουμε σαν all pages
      const from = Number.isInteger(doc?.pageFrom) ? doc.pageFrom : null
      const to = Number.isInteger(doc?.pageTo) ? doc.pageTo : null
      if (from === null || to === null) {
        return total > generated
      }

      // 3) Υπάρχει range -> ζητάμε μόνο τις requested
      const requested = Math.max(0, to - from + 1)
      return requested > generated
    },
    [getGeneratedPagesCount, getTotalPagesCount]
  )

  const docsToCheck = useMemo(() => {
    return selectedDocuments?.length > 0
      ? (documents || []).filter(d => selectedDocuments.includes(d.id))
      : documents || []
  }, [documents, selectedDocuments])

 

  const disableGenerateFlag = useMemo(() => {
    if (!docsToCheck || docsToCheck.length === 0) return true

    const eligibleDocs = docsToCheck.filter(doc => {
      const hasPrompt = !!doc?.prompt?.trim()
      const isSupported = /\.(pdf|docx?|pptx?|xlsx?|odt|rtf)$/i.test(doc?.url || doc?.name || '')
      return hasPrompt && isSupported
    })

    if (eligibleDocs.length === 0) return true

    // Έστω ένα doc που έχει ακόμα να παράξει σελίδες
    return !eligibleDocs.some(isRangeInvalidForDoc)
  }, [docsToCheck, isRangeInvalidForDoc])

  // ---------- single-doc mode (Dialog) ----------
  const requestedExceedsGeneratedSingle = useMemo(() => {
    if (!singleDoc?.docId) return false
    const totalPages = getTotalPagesCount(singleDoc.docId)
    const generated = getGeneratedPagesCount(singleDoc.docId)

    const from = Number.isFinite(singleDoc.pageFrom) ? singleDoc.pageFrom : null
    const to = Number.isFinite(singleDoc.pageTo) ? singleDoc.pageTo : null
    const allPagesActive = !!singleDoc.allPages || (from === null && to === null)

    const requested = allPagesActive ? totalPages : from !== null && to !== null ? Math.max(0, to - from + 1) : 0

    return requested > generated
  }, [singleDoc, getTotalPagesCount, getGeneratedPagesCount])

  /**
   * UI helper for Dialog:
   *   generateNewDisabledSingle({
   *     isSupported: boolean,
   *     hasPrompt: boolean,
   *     isGenerating: boolean,
   *     dialogLoading: boolean,
   *     pageRangeError: string
   *   })
   */
  const generateNewDisabledSingle = useCallback(
    uiOpts => {
      const { isSupported, hasPrompt, isGenerating, dialogLoading, pageRangeError } = uiOpts || {}

      return (
        !isSupported ||
        !hasPrompt ||
        !!isGenerating ||
        !!dialogLoading ||
        !!(pageRangeError && pageRangeError !== '') ||
        !requestedExceedsGeneratedSingle
      )
    },
    [requestedExceedsGeneratedSingle]
  )

  return {
    // global mode
    disableGenerateFlag,
    isRangeInvalidForDoc,
    getGeneratedPagesCount,
    getTotalPagesCount,

    // single-doc mode
    requestedExceedsGeneratedSingle,
    generateNewDisabledSingle
  }
}
