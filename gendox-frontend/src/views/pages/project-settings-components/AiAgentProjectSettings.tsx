import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { useSelector, useDispatch } from "react-redux"
import Link from "next/link"
import {
  Info,
  Plus,
  X,
  Braces,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { sortModels } from "@/utils/sortModels"
import { localStorageConstants } from "@/utils/generalConstants"
import {
  fetchAiModels,
  fetchExampleTools,
  updateProjectAgent,
} from "@/store/activeProjectAgent/activeProjectAgent"
import { fetchProject } from "@/store/activeProject/activeProject"
import commonConfig from "@/configs/common.config.js"

interface AiModel {
  name: string
  aiModelProvider?: { name: string }
  modelTierType?: { name: string }
}

interface ExampleTool {
  name: string
  description: string
}

interface AiTool {
  id?: string
  type: string
  jsonSchema: string
}

interface FormValues {
  semanticSearchModel: string
  completionModel: string
  moderationModel: string
  rerankModel: string
  advancedSearchModel: string
  moderationCheck: boolean
  rerankEnable: boolean
  advancedSearchEnable: boolean
  documentSplitterType: string
  maxToken: number
  temperature: number
  maxSearchLimit: number
  maxCompletionLimit: number
  topP: number
  agentBehavior: string
  aiTools: AiTool[]
  selected: string
}

const FreeBadge = () => (
  <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
    Free
  </Badge>
)

const ModelSelectField = ({
  label,
  value,
  models,
  onValueChange,
}: {
  label: string
  value: string
  models: AiModel[]
  onValueChange: (val: string) => void
}) => {
  const sortedModels = sortModels(models) as AiModel[]
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value || ""} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {sortedModels.map((model) => (
            <SelectItem key={model.name} value={model.name}>
              <div className="flex flex-col">
                <span>{model.name}</span>
                <span className="text-xs text-muted-foreground italic">
                  {model.aiModelProvider?.name}
                  {model.modelTierType?.name === "FREE_MODEL" && (
                    <FreeBadge />
                  )}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

const AiAgentProjectSettings = () => {
  const dispatch = useDispatch()
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
  const { provenAiEnabled, provenAiUrl } = commonConfig as any

  const { projectDetails: project, isBlurring: isUpdatingProject } =
    useSelector((state: any) => state.activeProject)

  const {
    isFetchingAiModels,
    isUpdatingProjectAgent,
    aiModels,
    exampleTools,
    isFetchingExampleTools,
  } = useSelector((state: any) => state.activeProjectAgent)

  const { semanticModels, completionModels, moderationModels, rerankModels } =
    aiModels as {
      semanticModels: AiModel[]
      completionModels: AiModel[]
      moderationModels: AiModel[]
      rerankModels: AiModel[]
    }

  const isLoading =
    isUpdatingProjectAgent ||
    isFetchingAiModels ||
    isUpdatingProject ||
    isFetchingExampleTools

  const [toolModalOpen, setToolModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [toolSchema, setToolSchema] = useState("")

  const { id: projectId, organizationId } = project

  const defaultValues: FormValues = {
    semanticSearchModel:
      project.projectAgent.semanticSearchModel?.name || "",
    completionModel: project.projectAgent.completionModel?.name || "",
    moderationModel: project.projectAgent.moderationModel?.name || "",
    rerankModel: project.projectAgent.rerankModel?.name || "",
    advancedSearchModel:
      project.projectAgent.advancedSearchModel?.name || "",
    moderationCheck: project.projectAgent.moderationCheck,
    rerankEnable: project.projectAgent.rerankEnable,
    advancedSearchEnable: project.projectAgent.advancedSearchEnable,
    documentSplitterType:
      project.projectAgent.documentSplitterType?.name || "",
    maxToken: project.projectAgent.maxToken,
    temperature: project.projectAgent.temperature,
    maxSearchLimit: project.projectAgent.maxSearchLimit,
    maxCompletionLimit: project.projectAgent.maxCompletionLimit,
    topP: project.projectAgent.topP,
    agentBehavior: project.projectAgent.agentBehavior,
    aiTools: project.projectAgent.aiTools,
    selected: project.projectAgent.privateAgent ? "private" : "public",
  }

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues })

  const aiTools = watch("aiTools")

  const handleAddTool = () => {
    setEditingIndex(null)
    setToolSchema("")
    setToolModalOpen(true)
  }

  const handleEditTool = (idx: number) => {
    setEditingIndex(idx)
    setToolSchema(
      JSON.stringify(JSON.parse(aiTools[idx].jsonSchema), null, 2)
    )
    setToolModalOpen(true)
  }

  const handleDeleteTool = (idx: number) => {
    setValue(
      "aiTools",
      aiTools.filter((_: AiTool, i: number) => i !== idx)
    )
  }

  const handleCloseToolModal = () => setToolModalOpen(false)

  const handleSaveTool = () => {
    try {
      const parsed = JSON.parse(toolSchema)
      const toolSchemaStr = JSON.stringify(parsed, null, 2)
      let updatedTools: AiTool[]
      const newTool: AiTool = {
        type: "function",
        jsonSchema: toolSchemaStr,
      }

      if (editingIndex === null) {
        updatedTools = [...aiTools, newTool]
      } else {
        updatedTools = aiTools.map((tool: AiTool, index: number) =>
          index === editingIndex ? { ...tool, ...newTool } : tool
        )
      }

      setValue("aiTools", updatedTools)
      setToolModalOpen(false)
    } catch (err) {
      toast.error("Invalid JSON")
    }
  }

  const AgentPrivate = [
    {
      value: "public",
      title: "Public",
      content: "Anyone can use",
    },
    {
      value: "private",
      title: "Private",
      content: "Only within team",
    },
  ]

  // Synchronize models with available options
  useEffect(() => {
    if (semanticModels.length > 0) {
      const current = watch("semanticSearchModel")
      const exists = semanticModels.some((model) => model.name === current)
      if (!exists) {
        setValue("semanticSearchModel", semanticModels[0].name)
      }
    }
  }, [semanticModels, watch("semanticSearchModel"), setValue])

  useEffect(() => {
    if (completionModels.length > 0) {
      const current = watch("completionModel")
      const exists = completionModels.some((model) => model.name === current)
      if (!exists) {
        setValue("completionModel", completionModels[0].name)
      }
    }
  }, [completionModels, watch("completionModel"), setValue])

  useEffect(() => {
    if (moderationModels.length > 0) {
      const current = watch("moderationModel")
      const exists = moderationModels.some((model) => model.name === current)
      if (!exists) {
        setValue("moderationModel", moderationModels[0].name)
      }
    }
  }, [moderationModels, watch("moderationModel"), setValue])

  useEffect(() => {
    if (rerankModels.length > 0) {
      const current = watch("rerankModel")
      const exists = rerankModels.some((model) => model.name === current)
      if (!exists) {
        setValue("rerankModel", rerankModels[0].name)
      }
    }
  }, [rerankModels, watch("rerankModel"), setValue])

  // Fetch AI models on mount
  useEffect(() => {
    if (organizationId && projectId && token) {
      ;(dispatch as any)(
        (fetchAiModels as any)({ organizationId, projectId, token })
      )
    }
    if (token) {
      ;(dispatch as any)((fetchExampleTools as any)({ token }))
    }
  }, [organizationId, projectId, token, dispatch])

  // onSubmit callback for the form
  const onSubmit = (data: FormValues) => {
    const updatedProjectPayload = {
      ...project,
      projectAgent: {
        ...project.projectAgent,
        semanticSearchModel: { name: data.semanticSearchModel },
        completionModel: { name: data.completionModel },
        moderationModel: { name: data.moderationModel },
        rerankModel: { name: data.rerankModel },
        advancedSearchModel: { name: data.advancedSearchModel },
        privateAgent: data.selected === "private",
        maxToken: data.maxToken,
        temperature: data.temperature,
        topP: data.topP,
        maxSearchLimit: data.maxSearchLimit,
        maxCompletionLimit: data.maxCompletionLimit,
        agentBehavior: data.agentBehavior,
        moderationCheck: data.moderationCheck,
        advancedSearchEnable: data.advancedSearchEnable,
        rerankEnable: data.rerankEnable,
        aiTools: data.aiTools,
      },
    }
    ;(dispatch as any)(
      (updateProjectAgent as any)({
        organizationId,
        projectId,
        payload: updatedProjectPayload,
        token,
      })
    )
      .unwrap()
      .then(() => {
        toast.success("Project updated successfully!")
        ;(dispatch as any)(
          (fetchProject as any)({ organizationId, projectId, token })
        )
      })
      .catch((error: any) => {
        console.error("Failed to update project", error)
      })
  }

  return (
    <Card>
      <CardHeader />
      <div className="relative">
        <div
          className={cn("transition-all duration-300", isLoading && "blur-sm")}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-5">
              {/* ===== 1. AI Model Section ===== */}
              <div className="flex items-center">
                <span className="text-sm font-semibold text-primary">
                  1. AI Model
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="ml-1 text-primary h-8 w-8"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Give name to the Agent and decide what models you want
                      to use. Advanced models are available only if you set
                      your API key (e.g. for OpenAI)
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Agent Name */}
                <div className="space-y-1.5">
                  <Label>Agent Name</Label>
                  <Input
                    value={project.projectAgent.agentName}
                    placeholder="Leonard"
                    disabled
                  />
                </div>

                {/* Semantic Search Model */}
                <Controller
                  name="semanticSearchModel"
                  control={control}
                  render={({ field }) => (
                    <ModelSelectField
                      label="Semantic Search Model"
                      value={field.value}
                      models={semanticModels}
                      onValueChange={(val) =>
                        setValue("semanticSearchModel", val)
                      }
                    />
                  )}
                />

                {/* Completion Model */}
                <Controller
                  name="completionModel"
                  control={control}
                  render={({ field }) => (
                    <ModelSelectField
                      label="Completion Model"
                      value={field.value}
                      models={completionModels}
                      onValueChange={(val) =>
                        setValue("completionModel", val)
                      }
                    />
                  )}
                />

                {/* Document Splitter */}
                <Controller
                  name="documentSplitterType"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <Label>Document Splitter</Label>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select splitter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STATIC_WORD_COUNT_SPLITTER">
                            STATIC_WORD_COUNT_SPLITTER
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
              </div>

              <p className="text-sm text-muted-foreground mb-2">
                Basic and Pro models require an API key for their providers.{" "}
                <Link
                  href={`/gendox/organization-settings/?organizationId=${organizationId}&tab=advancedSettings`}
                  className="text-primary underline font-medium"
                >
                  Go to Advanced Settings
                </Link>
              </p>

              {/* ===== 2. Agent's Personality ===== */}
              <Separator className="mt-5" />

              <div className="flex items-center">
                <span className="text-sm font-semibold text-primary">
                  2. Agent&apos;s Personality
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="ml-1 text-primary h-8 w-8"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Configure the agent&apos;s personality settings. Adjust
                      the parameters to fine-tune the agent&apos;s responses.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Left column: numeric inputs, checkboxes, conditional selectors */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Max Tokens</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          Tokens
                        </span>
                        <Input
                          type="number"
                          className="pl-16"
                          {...register("maxToken", { valueAsNumber: true })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Temperature</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          temp:
                        </span>
                        <Input
                          type="number"
                          className="pl-14"
                          max={1}
                          min={0}
                          step={0.01}
                          {...register("temperature", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Top p</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          top P
                        </span>
                        <Input
                          type="number"
                          className="pl-14"
                          max={1}
                          min={0}
                          step={0.01}
                          {...register("topP", { valueAsNumber: true })}
                        />
                      </div>
                    </div>

                    {/* Empty spacer cell */}
                    <div />

                    <div className="space-y-1.5">
                      <Label>Max Search Limit</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          sections:
                        </span>
                        <Input
                          type="number"
                          className="pl-20"
                          {...register("maxSearchLimit", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Max Completion Limit</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          sections:
                        </span>
                        <Input
                          type="number"
                          className="pl-20"
                          {...register("maxCompletionLimit", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      {errors.maxCompletionLimit && (
                        <p className="text-xs text-destructive">
                          {errors.maxCompletionLimit.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Moderation Check */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="moderationCheck"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id="moderationCheck"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <Label htmlFor="moderationCheck" className="cursor-pointer">
                        Moderation Check
                      </Label>
                    </div>

                    {watch("moderationCheck") && (
                      <Controller
                        name="moderationModel"
                        control={control}
                        render={({ field }) => (
                          <ModelSelectField
                            label="Moderation Model"
                            value={field.value}
                            models={moderationModels}
                            onValueChange={(val) =>
                              setValue("moderationModel", val)
                            }
                          />
                        )}
                      />
                    )}
                  </div>

                  {/* Advanced Search */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="advancedSearchEnable"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id="advancedSearchEnable"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <Label
                        htmlFor="advancedSearchEnable"
                        className="cursor-pointer"
                      >
                        Advanced Search
                      </Label>
                    </div>

                    {watch("advancedSearchEnable") && (
                      <Controller
                        name="advancedSearchModel"
                        control={control}
                        render={({ field }) => (
                          <ModelSelectField
                            label="Advanced Search Model"
                            value={field.value}
                            models={completionModels}
                            onValueChange={(val) =>
                              setValue("advancedSearchModel", val)
                            }
                          />
                        )}
                      />
                    )}
                  </div>

                  {/* Rerank Search Results */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="rerankEnable"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id="rerankEnable"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <Label htmlFor="rerankEnable" className="cursor-pointer">
                        Rerank Search Results
                      </Label>
                    </div>

                    {watch("rerankEnable") && (
                      <Controller
                        name="rerankModel"
                        control={control}
                        render={({ field }) => (
                          <ModelSelectField
                            label="Rerank Model"
                            value={field.value}
                            models={rerankModels}
                            onValueChange={(val) =>
                              setValue("rerankModel", val)
                            }
                          />
                        )}
                      />
                    )}
                  </div>
                </div>

                {/* Right column: Agent Behavior */}
                <div className="space-y-1.5">
                  <Label>Agent Behavior</Label>
                  <Textarea
                    rows={10}
                    {...register("agentBehavior")}
                    className="min-h-[250px]"
                  />
                </div>
              </div>

              {/* ===== 3. Tools ===== */}
              <Separator className="mt-5" />

              <div className="flex items-center flex-wrap">
                <span className="text-sm font-semibold text-primary mr-1">
                  3. Tools
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-primary h-8 w-8"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Tools are described by a JSON schema. You can start from
                      one of the examples below or write your own.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* List of existing tools */}
              <div className="flex flex-wrap gap-2">
                {aiTools.map((tool: AiTool, idx: number) => {
                  let toolSchemaObj: any = {}
                  try {
                    toolSchemaObj = JSON.parse(tool.jsonSchema)
                  } catch {
                    toolSchemaObj = { name: "Invalid", description: "" }
                  }
                  return (
                    <TooltipProvider key={idx}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="secondary"
                            className="cursor-pointer flex items-center gap-1 px-3 py-1.5 text-sm"
                            onClick={() => handleEditTool(idx)}
                          >
                            <Braces className="h-3.5 w-3.5" />
                            {toolSchemaObj.name}
                            <Button
                              variant="ghost"
                              size="icon"
                              type="button"
                              className="ml-1 h-5 w-5 hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteTool(idx)
                              }}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[300px] whitespace-pre-line">
                          {toolSchemaObj.description}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                })}
              </div>

              {/* Add tool button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTool}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Tool
              </Button>

              {/* Tool Modal */}
              <Dialog
                open={toolModalOpen}
                onOpenChange={handleCloseToolModal}
              >
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingIndex === null ? "Add Tool" : "Edit Tool"}
                    </DialogTitle>
                    <DialogDescription>
                      Tools are described using a JSON schema. You can start
                      with an example or paste your own definition below.
                    </DialogDescription>
                  </DialogHeader>

                  {/* Examples dropdown */}
                  <div className="mb-3">
                    <Select
                      value=""
                      onValueChange={(val) => {
                        const ex = (exampleTools as ExampleTool[]).find(
                          (t) => t.name === val
                        )
                        if (ex) setToolSchema(ex.description)
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Examples" />
                      </SelectTrigger>
                      <SelectContent>
                        {(exampleTools as ExampleTool[]).map((ex) => (
                          <SelectItem key={ex.name} value={ex.name}>
                            {ex.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* JSON editor */}
                  <Textarea
                    value={toolSchema}
                    placeholder={
                      (exampleTools as ExampleTool[])[0]?.description ??
                      "Paste or write the JSON Schema of the tool..."
                    }
                    onChange={(e) => setToolSchema(e.target.value)}
                    rows={20}
                    className="font-mono text-sm whitespace-pre"
                  />

                  <DialogFooter className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseToolModal}
                    >
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleSaveTool}>
                      {editingIndex === null ? "Add" : "Update"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* ===== 4. Access ===== */}
              <Separator className="mt-5" />

              <div className="flex items-center">
                <span className="text-sm font-semibold text-primary">
                  4. Access
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="ml-1 text-primary h-8 w-8"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      With a public Agent you can use the API without any
                      authentication, use with caution.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <RadioGroup
                  value={watch("selected")}
                  onValueChange={(value) => setValue("selected", value)}
                  className="flex gap-4"
                >
                  {AgentPrivate.map((item) => (
                    <Label
                      key={item.value}
                      htmlFor={`agent-privacy-${item.value}`}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                        watch("selected") === item.value
                          ? "border-primary border-2 bg-primary/10"
                          : "border-border hover:border-primary"
                      )}
                    >
                      <RadioGroupItem
                        value={item.value}
                        id={`agent-privacy-${item.value}`}
                      />
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.content}
                        </p>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>

                {provenAiEnabled && (
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      asChild
                    >
                      <a
                        href={`${provenAiUrl}/provenAI/agent-control/?organizationId=${organizationId}&agentId=${project.projectAgent.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="mr-5">Go to Proven-Ai</span>
                        <ArrowRight className="h-5 w-5" />
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>

            <Separator className="mt-5" />

            <CardFooter className="flex justify-end py-6">
              <Button size="lg" type="submit" className="px-20 py-3">
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </div>
      </div>
    </Card>
  )
}

export default AiAgentProjectSettings
