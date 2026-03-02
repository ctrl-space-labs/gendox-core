import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/router"
import { useSelector, useDispatch } from "react-redux"
import {
  ArrowLeft,
  Pencil,
  PlusSquare,
  Minimize2,
  Maximize2,
  GripHorizontal,
} from "lucide-react"
import { toast } from "sonner"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ResponsiveCardContent } from "src/utils/responsiveCardContent"
import {
  fetchDocument,
  updateSectionsOrder,
} from "src/store/activeDocument/activeDocument"
import SectionCard from "src/views/pages/documents-components/SectionCard"
import SectionEdit from "src/views/pages/documents-components/SectionEdit"
import documentService from "src/gendox-sdk/documentService"
import { getErrorMessage } from "src/utils/errorHandler"
import { localStorageConstants } from "src/utils/generalConstants"

const DocumentSections = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const { organizationId, documentId, sectionId, projectId } =
    router.query as Record<string, string>
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem(localStorageConstants.accessTokenKey)
      : null
  const document = useSelector(
    (state: any) => state.activeDocument.document
  )
  const sections = useSelector(
    (state: any) => state.activeDocument.sections
  )
  const isBlurring = useSelector(
    (state: any) => state.activeDocument.isBlurring
  )

  const [editMode, setEditMode] = useState(false)
  const [areAllMinimized, setAreAllMinimized] = useState(false)
  const [highlightedSectionId, setHighlightedSectionId] = useState<
    string | null
  >(null)
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false)

  const sectionRefs = useRef<(HTMLElement | null)[]>([])
  const [targetIndex, setTargetIndex] = useState<number | null>(null)
  const sectionCardRef = useRef<HTMLDivElement>(null)

  const handleGoBack = () => {
    router.push(
      `/gendox/home/?organizationId=${organizationId}&projectId=${projectId}`
    )
  }

  const scrollToSectionOrderByOrderNumber = (order: number) => {
    const sectionIndex = sections.findIndex(
      (section: any) =>
        section.documentSectionMetadata.sectionOrder === order
    )
    if (sectionIndex !== -1) {
      setTargetIndex(sectionIndex)
    }
  }

  const scrollToSectionOrderBySectionid = (secId: string) => {
    const sectionIndex = sections.findIndex(
      (section: any) => section.id === secId
    )
    if (sectionIndex !== -1) {
      setTargetIndex(sectionIndex)
    }
  }

  const scrollToAndHighlightSection = (id: string) => {
    const sectionIndex = sections.findIndex(
      (section: any) => section.id === id
    )
    if (sectionIndex !== -1) {
      setHighlightedSectionId(id)
      sectionRefs?.current[sectionIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
      setTimeout(() => setHighlightedSectionId(null), 10000)
    }
  }

  useEffect(() => {
    if (targetIndex !== null && sectionCardRef.current) {
      sectionCardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }, [targetIndex])

  useEffect(() => {
    const fragment = router.asPath.split("#")[1]
    if (fragment && !editMode) {
      const sectionOrder = parseInt(fragment, 10)
      if (!isNaN(sectionOrder)) {
        scrollToSectionOrderByOrderNumber(sectionOrder)
      }
    }
  }, [sections, router.asPath, editMode])

  useEffect(() => {
    if (sectionId && sections.length > 0) {
      scrollToSectionOrderBySectionid(sectionId)
    }
  }, [sectionId, sections])

  useEffect(() => {
    if (sectionId && sections.length > 0) {
      scrollToAndHighlightSection(sectionId)
    }
  }, [sectionId, sections])

  useEffect(() => {
    fetchSectionsRow(sections)
  }, [dispatch, sections])

  const fetchSectionsRow = (secs: any[]) => {
    const updatedSectionPayload = secs.reduce(
      (acc: any[], section: any, index: number) => {
        const newOrder = index + 1
        if (
          Number(section.documentSectionMetadata.sectionOrder) !== newOrder
        ) {
          acc.push({
            sectionId: section.id,
            documentSectionMetadataId: section.documentSectionMetadata.id,
            sectionOrder: newOrder,
          })
        }
        return acc
      },
      []
    )
    if (updatedSectionPayload.length > 0) {
      setIsUpdatingOrder(true)
      ;(dispatch as any)(
        updateSectionsOrder({ documentId, updatedSectionPayload, token })
      ).then(() => {
        ;(dispatch as any)(fetchDocument({ documentId, token }))
        setIsUpdatingOrder(false)
      })
    }
  }

  useEffect(() => {
    const loadData = () => {
      if (!document || document.id !== documentId) {
        ;(dispatch as any)(fetchDocument({ documentId, token }))
      }
    }
    loadData()
  }, [documentId, document, dispatch, token, sections])

  const handleToggleEdit = () => {
    if (!editMode) {
      ;(dispatch as any)(fetchDocument({ documentId, token }))
    }
    setEditMode(!editMode)
  }

  const handleToggleMinimizeAll = () => {
    setAreAllMinimized(!areAllMinimized)
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return
    const reorderedSections = Array.from(sections)
    const [movedSection] = reorderedSections.splice(result.source.index, 1)
    reorderedSections.splice(result.destination.index, 0, movedSection)
    fetchSectionsRow(reorderedSections)
  }

  const addNewSection = async () => {
    try {
      await documentService.createDocumentSection(document.id, token)
      ;(dispatch as any)(
        fetchDocument({ documentId: document.id, token })
      ).then(() => {
        const lastIndex = sections.length
        if (sectionRefs.current[lastIndex]) {
          sectionRefs.current[lastIndex]?.scrollIntoView({
            behavior: "smooth",
          })
        }
      })
      toast.success("New Document Section created successfully")
    } catch (error) {
      toast.error(
        `Document Section did not create. Error: ${getErrorMessage(error)}`
      )
      console.error("Error creating new section", error)
    }
  }

  const assignRefs =
    (...refs: any[]) =>
    (element: HTMLElement | null) => {
      refs.forEach((ref) => {
        if (typeof ref === "function") {
          ref(element)
        } else if (ref) {
          ref.current = element
        }
      })
    }

  const IconButtons = () => (
    <div className="inline-flex gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            onClick={!editMode ? handleGoBack : handleToggleEdit}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Back</TooltipContent>
      </Tooltip>
      {!editMode ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
              onClick={handleToggleEdit}
            >
              <Pencil className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit Document Sections</TooltipContent>
        </Tooltip>
      ) : (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
                onClick={addNewSection}
              >
                <PlusSquare className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add new Section</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
                onClick={handleToggleMinimizeAll}
              >
                {areAllMinimized ? (
                  <Maximize2 className="h-5 w-5" />
                ) : (
                  <Minimize2 className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {areAllMinimized ? "Maximize All" : "Minimize All"}
            </TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  )

  return (
    <TooltipProvider>
      <div className="space-y-6 py-6 px-4 sm:px-8">
        <Card className="p-6">
          <div
            className={cn("flex justify-between items-center transition-all duration-300", (isBlurring || isUpdatingOrder) && "blur-sm")}
          >
            <h2 className="text-2xl font-semibold tracking-tight">
              {document ? document.title : "No Selected Document"}
            </h2>
            <IconButtons />
          </div>
        </Card>

        {!editMode ? (
          <ResponsiveCardContent
            className={cn(
              "bg-accent/50 pt-3 pb-3 mb-6 transition-all duration-300",
              (isBlurring || isUpdatingOrder) && "blur-sm",
              sectionId === highlightedSectionId && "border-2 border-primary"
            )}
          >
            <SectionCard
              ref={sectionCardRef}
              targetIndex={targetIndex}
              highlightedSectionId={highlightedSectionId}
            />
          </ResponsiveCardContent>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sections">
              {(provided: any) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {sections.map((section: any, index: number) => (
                    <Draggable
                      key={section.id}
                      draggableId={section.id}
                      index={index}
                    >
                      {(provided: any) => (
                        <ResponsiveCardContent
                          ref={assignRefs(
                            provided.innerRef,
                            (el: HTMLElement | null) =>
                              (sectionRefs.current[index] = el)
                          )}
                          {...provided.draggableProps}
                          className={cn(
                            "mb-6 transition-all duration-300",
                            section.id === highlightedSectionId
                              ? "bg-accent border-2 border-primary"
                              : "bg-transparent",
                            (isUpdatingOrder || isBlurring) && "blur-sm"
                          )}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1" {...provided.dragHandleProps}>
                              <SectionEdit
                                section={section}
                                isMinimized={areAllMinimized}
                              />
                            </div>
                            <div className="flex justify-end">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-primary cursor-grab"
                                    {...provided.dragHandleProps}
                                  >
                                    <GripHorizontal className="h-5 w-5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Drag</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </ResponsiveCardContent>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        <div className="py-2 text-center">
          <IconButtons />
        </div>
      </div>
    </TooltipProvider>
  )
}

DocumentSections.pageConfig = {
  applyEffectiveOrgAndProjectIds: true,
}

export default DocumentSections
