import { useState, useEffect, useCallback } from "react"
import { Progress } from "@/components/ui/progress"

interface AiResponseLoaderProps {
  isSending: boolean
}

const AiResponseLoader = ({ isSending }: AiResponseLoaderProps) => {
  const [statusMessage, setStatusMessage] = useState("")

  const simulateStatusUpdates = useCallback(async () => {
    setStatusMessage("Gathering local context...")
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setStatusMessage("Searching for related documents...")
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setStatusMessage("Generating answer...")
  }, [])

  useEffect(() => {
    if (isSending) {
      simulateStatusUpdates()
    }
  }, [isSending, simulateStatusUpdates])

  if (!isSending) return null

  return (
    <div className="w-[90%] max-w-[800px] mt-3 mb-3 p-3 rounded-lg bg-card shadow-md text-center mx-auto">
      <Progress className="h-1.5 rounded mb-2" />
      <p className="mt-1 font-bold text-primary">{statusMessage}</p>
    </div>
  )
}

export default AiResponseLoader
