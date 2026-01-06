import * as React from "react"
import { cn } from "@/lib/utils"

function ScrollArea({ className, children, ...props }) {
  return (
    <div
      data-slot="scroll-area"
      className={cn("relative overflow-x-visible overflow-y-scroll", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { ScrollArea }

