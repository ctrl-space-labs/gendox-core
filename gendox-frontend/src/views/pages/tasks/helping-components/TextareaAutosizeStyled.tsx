import { forwardRef } from "react"
import { cn } from "@/lib/utils"

interface TextareaAutosizeStyledProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const TextareaAutosizeStyled = forwardRef<
  HTMLTextAreaElement,
  TextareaAutosizeStyledProps
>((props, ref) => {
  const { className, ...rest } = props
  return (
    <textarea
      ref={ref}
      className={cn(
        "mb-4 w-full min-h-[180px] resize-y rounded-lg border border-border bg-background px-4 py-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...rest}
    />
  )
})

TextareaAutosizeStyled.displayName = "TextareaAutosizeStyled"

export default TextareaAutosizeStyled
