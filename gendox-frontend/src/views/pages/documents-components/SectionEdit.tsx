import { useState, useRef, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { toast } from "sonner"

import documentService from "src/gendox-sdk/documentService"
import { localStorageConstants } from "src/utils/generalConstants"
import DeleteConfirmDialog from "src/utils/dialogs/DeleteConfirmDialog"
import { fetchDocument } from "src/store/activeDocument/activeDocument"
import MarkdownEditor from "src/views/pages/documents-components/MarkdownEditor"
import { getErrorMessage } from "src/utils/errorHandler"

interface SectionEditProps {
  section: any
  isMinimized: boolean
}

const SectionEdit = ({ section, isMinimized }: SectionEditProps) => {
  const dispatch = useDispatch()
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(localStorageConstants.accessTokenKey)
      : null
  const project = useSelector(
    (state: any) => state.activeProject.projectDetails
  )
  const document = useSelector(
    (state: any) => state.activeDocument.document
  )

  const [activeSection, setActiveSection] = useState(section)
  const [isSectionMinimized, setIsSectionMinimized] = useState(isMinimized)
  const [markdownValue, setMarkdownValue] = useState(
    section.sectionValue || ""
  )
  const [sectionTitle, setSectionTitle] = useState(
    section.documentSectionMetadata.title
  )
  const [confirmDelete, setConfirmDelete] = useState(false)

  const lastSavedMarkdown = useRef(markdownValue)
  const lastSavedTitle = useRef(sectionTitle)

  useEffect(() => {
    setIsSectionMinimized(isMinimized)
  }, [isMinimized])

  // Autosave changes every second
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (
        markdownValue !== lastSavedMarkdown.current ||
        sectionTitle !== lastSavedTitle.current
      ) {
        handleSave()
        lastSavedMarkdown.current = markdownValue
        lastSavedTitle.current = sectionTitle
      }
    }, 1000)

    return () => clearInterval(intervalId)
  }, [markdownValue, sectionTitle])

  const handleMinimize = () => {
    setIsSectionMinimized(!isSectionMinimized)
  }

  const handleDelete = async () => {
    try {
      await documentService.deleteDocumentSection(
        document.id,
        section.id,
        token
      )
      ;(dispatch as any)(
        fetchDocument({ documentId: document.id, token })
      ).then(() => {
        toast.success("Document Section deleted successfully")
      })
    } catch (error) {
      toast.error(
        `Document Section deletion failed. Error: ${getErrorMessage(error)}`
      )
      console.error("Error deleting section", error)
    }
    setConfirmDelete(false)
  }

  const handleDeleteConfirmOpen = () => {
    setConfirmDelete(true)
  }

  const handleDeleteConfirmClose = () => {
    setConfirmDelete(false)
  }

  const handleRestore = () => {
    handleSave()
    setMarkdownValue(section.sectionValue || "")
    setSectionTitle(section.documentSectionMetadata.title)
  }

  const handleSave = async () => {
    const updatedSectionPayload = {
      ...activeSection,
      sectionValue: markdownValue,
      documentInstanceDTO: document,
      documentSectionMetadata: {
        ...activeSection.documentSectionMetadata,
        title: sectionTitle,
      },
    }

    try {
      const response = await documentService.updateDocumentSection(
        document.id,
        section.id,
        updatedSectionPayload,
        token
      )
      dispatch({
        type: "activeDocument/updateSection",
        payload: {
          sectionId: section.id,
          updatedSection: response.data,
        },
      })
      setActiveSection(response.data)
    } catch (error) {
      console.error("Error updating section", error)
    }
  }

  return (
    <div>
      <MarkdownEditor
        sectionTitle={sectionTitle}
        setSectionTitle={setSectionTitle}
        markdownValue={markdownValue}
        setMarkdownValue={setMarkdownValue}
        isSectionMinimized={isSectionMinimized}
        handleMinimize={handleMinimize}
        handleRestore={handleRestore}
        handleDeleteConfirmOpen={handleDeleteConfirmOpen}
      />
      <DeleteConfirmDialog
        open={confirmDelete}
        onClose={handleDeleteConfirmClose}
        onConfirm={handleDelete}
        title="Confirm Deletion Document Section"
        contentText={`Are you sure you want to delete ${
          sectionTitle || "this section"
        } from this document? This action cannot be undone.`}
        confirmButtonText="Delete Section"
        cancelButtonText="Cancel"
      />
    </div>
  )
}

export default SectionEdit
