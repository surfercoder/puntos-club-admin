"use client"

import { Collapsible as CollapsiblePrimitive } from "radix-ui"

export { CollapsibleTrigger } from "./collapsible-trigger"
export { CollapsibleContent } from "./collapsible-content"

export function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}
