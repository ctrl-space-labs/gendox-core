import React, { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import {
  ChevronUp,
  ChevronDown,
  X,
  RefreshCw,
  AlertCircle,
  GripVertical,
  Loader2,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useGeneration } from "src/views/pages/tasks/generation/GenerationContext"

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
  error?: string | null
}

interface GlobalGenerationStatusProps {
  showTimeoutDialog?: boolean
  onRetryGeneration?: (gen: GenerationEntry) => void
}

interface GenerationItemProps {
  generation: GenerationEntry
  onRetry: () => void
  onDismiss: () => void
}

const GlobalGenerationStatus = ({
  showTimeoutDialog = false,
  onRetryGeneration,
}: GlobalGenerationStatusProps) => {
  const { activeGenerations, completeGeneration, retryGeneration } =
    useGeneration()
  const [expanded, setExpanded] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [autoHideTimeout, setAutoHideTimeout] =
    useState<ReturnType<typeof setTimeout> | null>(null)
  const [position, setPosition] = useState(() => {
    // Try to load saved position from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("generationStatusPosition")
      if (saved) {
        return JSON.parse(saved)
      }
    }
    return { x: 0, y: 20 } // Default top center
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const generations = Array.from(activeGenerations.values()) as GenerationEntry[]
  const totalActive = generations.length
  const runningGenerations = generations.filter(
    (gen) => gen.status === "running"
  )
  const failedGenerations = generations.filter(
    (gen) => gen.status === "failed"
  )

  const getStatusClasses = () => {
    if (failedGenerations.length > 0) return "bg-destructive text-destructive-foreground"
    return "bg-primary text-primary-foreground"
  }

  const getStatusText = () => {
    if (failedGenerations.length > 0 && runningGenerations.length === 0) {
      return totalActive === 1
        ? "Document generation failed"
        : `${failedGenerations.length} generation(s) failed`
    }
    if (runningGenerations.length > 0) {
      return totalActive === 1
        ? "Document generation in progress..."
        : `${runningGenerations.length} generation(s) in progress...`
    }
    return "Generation status"
  }

  const handleDismiss = () => {
    setDismissed(true)
    // Clear any auto-hide timeout
    if (autoHideTimeout) {
      clearTimeout(autoHideTimeout)
      setAutoHideTimeout(null)
    }
  }

  useEffect(() => {
    if (activeGenerations.size === 0) {
      setDismissed(false)
    }
  }, [activeGenerations.size])

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".drag-handle")) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x
      const newY = Math.max(0, e.clientY - dragStart.y) // Prevent going above viewport

      const newPosition = { x: newX, y: newY }
      setPosition(newPosition)
    }
  }

  const handleMouseUp = () => {
    if (isDragging) {
      // Save position to localStorage when user stops dragging
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "generationStatusPosition",
          JSON.stringify(position)
        )
      }
    }
    setIsDragging(false)
  }

  // Add global mouse event listeners for drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.userSelect = "none" // Prevent text selection while dragging

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.body.style.userSelect = ""
      }
    }
  }, [isDragging, dragStart, position])

  // Calculate center position based on container width
  const getCenterPosition = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth
      const viewportWidth = window.innerWidth
      return (viewportWidth - containerWidth) / 2
    }
    return 0
  }

  // Set initial center position when component mounts (only if not dragged before)
  useEffect(() => {
    if (containerRef.current && position.x === 0 && position.y === 20) {
      const centerX = getCenterPosition()
      setPosition((prev: { x: number; y: number }) => ({
        ...prev,
        x: centerX,
      }))
    }
  }, [containerRef.current]) // Only run when container ref is available

  // Auto-hide after 10 seconds if not expanded and not failed
  useEffect(() => {
    if (activeGenerations.size > 0 && !expanded && !dismissed) {
      const failedGens = Array.from(activeGenerations.values()).filter(
        (gen: any) => gen.status === "failed"
      )
      if (failedGens.length === 0) {
        const timeout = setTimeout(() => {
          setDismissed(true)
          // Auto-restore when new generations start
          setTimeout(() => setDismissed(false), 100)
        }, 10000) // Hide after 10 seconds
        setAutoHideTimeout(timeout)

        return () => clearTimeout(timeout)
      }
    }
  }, [activeGenerations.size, expanded, dismissed])

  // Don't render if no active generations or dismissed
  if (activeGenerations.size === 0 || dismissed) {
    return null
  }

  const content = (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      className={cn(
        "fixed z-[9998] min-w-[320px] max-w-[450px] rounded-lg border border-white/10",
        getStatusClasses(),
        isDragging ? "shadow-[0_8px_32px_rgba(0,0,0,0.3)]" : "shadow-[0_4px_16px_rgba(0,0,0,0.2)]",
        !isDragging && "transition-shadow duration-200",
        "animate-in slide-in-from-top duration-300"
      )}
      style={{
        top: position.y,
        left: position.x === 0 ? "50%" : position.x,
        transform: position.x === 0 ? "translateX(-50%)" : "none",
        cursor: isDragging ? "grabbing" : "default",
      }}
    >
      <div className="px-4 py-3">
        <div
          className={cn(
            "flex items-center",
            totalActive > 1 ? "cursor-pointer" : "cursor-default"
          )}
          onClick={() => totalActive > 1 && setExpanded(!expanded)}
        >
          {/* Drag handle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="drag-handle mr-2 flex cursor-grab items-center opacity-70 hover:opacity-100 active:cursor-grabbing">
                  <GripVertical className="h-4 w-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent>Drag to reposition</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {runningGenerations.length > 0 && (
            <Loader2 className="mr-3 h-4 w-4 animate-spin" />
          )}
          {failedGenerations.length > 0 &&
            runningGenerations.length === 0 && (
              <AlertCircle className="mr-3 h-4 w-4" />
            )}

          <span className="flex-1 text-sm font-semibold">
            {getStatusText()}
            {showTimeoutDialog && (
              <span className="ml-2 font-bold text-yellow-300">
                <br /> This is taking too long. If it&apos;s not expected,
                please contact the administrator.
              </span>
            )}
          </span>

          <div className="flex items-center gap-1">
            {totalActive > 1 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-inherit hover:bg-white/10"
                    >
                      {expanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {expanded ? "Collapse details" : "Show details"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-inherit hover:bg-white/10"
                    onClick={handleDismiss}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Dismiss</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {expanded && totalActive > 1 && (
          <div className="mt-3 pb-1">
            {generations.map((gen) => (
              <GenerationItem
                key={`${gen.taskId}-${gen.documentId || "all"}`}
                generation={gen}
                onRetry={() =>
                  onRetryGeneration
                    ? onRetryGeneration(gen)
                    : retryGeneration(gen.taskId, gen.documentId)
                }
                onDismiss={() =>
                  completeGeneration(gen.taskId, gen.documentId)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )

  if (typeof document !== "undefined") {
    return createPortal(content, document.body)
  }
  return null
}

const GenerationItem = ({
  generation,
  onRetry,
  onDismiss,
}: GenerationItemProps) => {
  const progress = generation.totalItems
    ? (generation.completedItems / generation.totalItems) * 100
    : undefined

  const elapsedTime = Math.floor(
    (Date.now() - generation.startTime) / 1000
  )

  const getTypeLabel = () => {
    switch (generation.type) {
      case "single":
        return "Single Document"
      case "all":
        return "All Documents"
      case "new":
        return "New Documents"
      case "selected":
        return "Selected Documents"
      default:
        return "Documents"
    }
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  return (
    <div
      className={cn(
        "mb-2 rounded p-3",
        generation.status === "failed"
          ? "border border-white/30 bg-white/15"
          : "bg-white/10"
      )}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold">{getTypeLabel()}</span>

        <div className="flex items-center gap-1">
          {generation.status === "failed" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-inherit hover:bg-white/10"
                onClick={onRetry}
                title="Retry"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-inherit hover:bg-white/10"
                onClick={onDismiss}
                title="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </>
          )}

          <Badge
            variant={
              generation.status === "failed" ? "destructive" : "secondary"
            }
            className={cn(
              "h-[18px] px-1.5 text-[0.65rem]",
              generation.status !== "failed" &&
                "bg-white/20 text-inherit hover:bg-white/20"
            )}
          >
            {generation.status === "failed" ? "Failed" : "Running"}
          </Badge>
        </div>
      </div>

      {generation.status === "failed" && generation.error && (
        <span className="mb-1 block text-[0.7rem] opacity-80">
          Error: {generation.error}
        </span>
      )}

      {progress !== undefined && generation.status === "running" && (
        <Progress
          value={progress}
          className="mb-1 h-[3px] bg-white/20 [&>[role=progressbar]]:bg-white/80"
        />
      )}

      <div className="flex items-center justify-between">
        <span className="text-[0.7rem]">
          {progress !== undefined
            ? `${generation.completedItems}/${generation.totalItems} pages`
            : generation.status === "running"
              ? "Processing..."
              : "Failed"}
        </span>
        <span className="text-[0.7rem]">{formatTime(elapsedTime)}</span>
      </div>
    </div>
  )
}

export default GlobalGenerationStatus
