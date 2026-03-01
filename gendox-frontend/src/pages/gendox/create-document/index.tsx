import { useState } from "react"
import { useRouter } from "next/router"
import { ArrowLeft, Save } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import documentService from "src/gendox-sdk/documentService"
import NewDocument from "src/views/pages/create-document/NewDocument"
import { getErrorMessage } from "src/utils/errorHandler"
import { localStorageConstants } from "src/utils/generalConstants"

const CreateDocument = () => {
  const router = useRouter()
  const { organizationId, projectId } = router.query
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem(localStorageConstants.accessTokenKey)
      : null

  const [documentTitle, setDocumentTitle] = useState("")
  const [documentValue, setDocumentValue] = useState("")
  const [isCreatingDocument, setIsCreatingDocument] = useState(false)
  const [titleError, setTitleError] = useState(false)

  const handleGoBack = () => {
    router.push(
      `/gendox/home/?organizationId=${organizationId}&projectId=${projectId}`
    )
  }

  const handleSave = async () => {
    if (!documentTitle) {
      setTitleError(true)
      toast.error("Document title is required.")
      return
    }

    setTitleError(false)
    setIsCreatingDocument(true)
    try {
      const plainText = documentValue
      const blob = new Blob([plainText], { type: "text/plain" })
      const file = new File([blob], `${documentTitle}.txt`, {
        type: "text/plain",
      })

      const formData = new FormData()
      formData.append("file", file)

      await (documentService as any).uploadDocument(
        organizationId,
        projectId,
        formData,
        token
      )

      toast.success("Document created successfully")
      router.push(
        `/gendox/home/?organizationId=${organizationId}&projectId=${projectId}`
      )
    } catch (error: any) {
      toast.error(`Document did not save. Error: ${getErrorMessage(error)}`)
      console.error("Error saving document:", error)
    } finally {
      setIsCreatingDocument(false)
    }
  }

  return (
    <TooltipProvider>
      <Card className="bg-transparent shadow-none border-none">
        <div className="bg-card rounded-md p-4 sm:p-6">
          <div className="flex justify-between items-center">
            <h4 className="text-2xl font-semibold mb-6 text-left">
              Create New Document
            </h4>
            <div className="inline-flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleGoBack}
                    className="mb-6 text-primary"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Back</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSave}
                    className="mb-6 text-primary"
                  >
                    <Save className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save Document</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        <div className="h-5" />

        <div
          className={`bg-card rounded-md py-3 mb-6 p-4 sm:p-6 transition-all duration-300 ${
            isCreatingDocument ? "blur-sm" : ""
          }`}
        >
          <NewDocument
            documentTitle={documentTitle}
            setDocumentTitle={setDocumentTitle}
            markdownValue={documentValue}
            setMarkdownValue={setDocumentValue}
            titleError={titleError}
          />
        </div>
      </Card>
    </TooltipProvider>
  )
}

export default CreateDocument
