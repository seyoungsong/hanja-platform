import { HelpCircle } from "lucide-react"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card"

export const NERUsageGuide = () => {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
          <HelpCircle className="h-4 w-4" />
          How to use
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="font-medium">NER Annotation Guide</h4>
          <ul className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
            <li>Select an entity type from the buttons below</li>
            <li>Click and drag text to create an annotation</li>
            <li>Click on any highlighted text to remove the annotation</li>
          </ul>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
