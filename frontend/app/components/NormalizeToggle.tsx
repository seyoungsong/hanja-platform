// app/components/NormalizeToggle.tsx
import { Wand2 } from "lucide-react"
import { Checkbox } from "~/components/ui/checkbox"

interface NormalizeToggleProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function NormalizeToggle({
  checked,
  onCheckedChange,
}: NormalizeToggleProps) {
  return (
    <div className="flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-accent">
      <label
        htmlFor="normalize-text"
        className="flex cursor-pointer items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        <Wand2 className="h-4 w-4" />
        <span className="hidden sm:inline">Normalize Input</span>
      </label>
      <Checkbox
        id="normalize-text"
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  )
}
