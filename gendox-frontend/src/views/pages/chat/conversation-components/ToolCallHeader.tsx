import { useState } from "react"
import { Wrench, ChevronDown } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface ToolCall {
  id: string
  function: {
    name: string
    arguments: any
  }
}

interface ToolResponse {
  messageId: string
  toolCallId: string
  message: string
}

interface ToolCallHeaderProps {
  header: {
    toolCalls?: ToolCall[]
  }
  outputs: ToolResponse[]
}

const ToolCallHeader = ({ header, outputs }: ToolCallHeaderProps) => {
  const [open, setOpen] = useState(false)
  const calls = header.toolCalls || []

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full mb-1">
      <CollapsibleTrigger asChild>
        <button className="inline-flex items-center cursor-pointer border border-border border-l-4 border-l-primary rounded px-2 py-1 min-h-[32px] select-none">
          <Wrench className="h-4 w-4 mr-1 text-primary" />
          <span className="flex-1 text-sm leading-tight">
            calling {calls.map((c) => c.function.name).join(", ")}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-150 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-1 ml-4 border-l-2 border-border pl-2">
          {calls.map((call) => (
            <div key={call.id} className="mb-2">
              <span className="block text-xs text-muted-foreground mb-0.5">
                &#8627; args
              </span>
              <pre className="m-0 text-xs whitespace-pre-wrap break-all">
                {JSON.stringify(call.function.arguments, null, 2)}
              </pre>

              {outputs
                .filter((r) => r.toolCallId === call.id)
                .map((resp) => (
                  <div key={resp.messageId} className="mt-1">
                    <span className="block text-xs text-muted-foreground mb-0.5">
                      &#8627; result
                    </span>
                    <pre className="m-0 text-xs whitespace-pre-wrap break-all">
                      {resp.message}
                    </pre>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default ToolCallHeader
