import { useState } from "react"
import { useRouter } from "next/router"
import { ArrowLeft, Save, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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
    <div className="flex justify-center py-8 px-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  Create New Document
                </CardTitle>
                <CardDescription>
                  Write your content in Markdown and save it to your project.
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </CardHeader>
        <Separator />
        <CardContent
          className={cn("pt-6 transition-all duration-300", isCreatingDocument && "blur-sm")}
        >
          <NewDocument
            documentTitle={documentTitle}
            setDocumentTitle={setDocumentTitle}
            markdownValue={documentValue}
            setMarkdownValue={setDocumentValue}
            titleError={titleError}
          />
        </CardContent>
        <Separator />
        <div className="flex items-center justify-end gap-3 p-6">
          <Button
            variant="ghost"
            onClick={handleGoBack}
            disabled={isCreatingDocument}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isCreatingDocument}>
            {isCreatingDocument ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isCreatingDocument ? "Saving..." : "Save Document"}
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default CreateDocument
