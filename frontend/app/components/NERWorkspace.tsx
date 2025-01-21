// app/components/NERWorkspace.tsx
import { NavigateFunction } from "@remix-run/react"
import { Bolt, Copy, Save, Trash2 } from "lucide-react"
import { useState } from "react"
import {
  ENTITY_TYPES,
  getNewAnnotationStyle,
  Stats,
  StyledEntity,
} from "~/components/NERHelper"
import { NERUsageGuide } from "~/components/NERUsageGuide"
import { ResizableTextAnnotate } from "~/components/TextAnnotate"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { Textarea } from "~/components/ui/textarea"
import { cenv } from "~/lib/cenv"
import { getPocketBaseBrowserClient } from "~/lib/pocketbase"

interface NERWorkspaceProps {
  sourceText: string
  setSourceText: (text: string) => void
  modelAnnotations: StyledEntity[]
  userAnnotations: StyledEntity[]
  setUserAnnotations: (annotations: StyledEntity[]) => void
  isProcessing: boolean
  processText: (text?: string) => Promise<void>
  stats: Stats
  MAX_TOKENS: number
  navigate: NavigateFunction
  toast: any
}

export const NERWorkspace = ({
  sourceText,
  setSourceText,
  modelAnnotations,
  userAnnotations,
  setUserAnnotations,
  isProcessing,
  processText,
  stats,
  MAX_TOKENS,
  navigate,
  toast,
}: NERWorkspaceProps) => {
  const [selectedEntityType, setSelectedEntityType] =
    useState<keyof typeof ENTITY_TYPES>("PER")
  const [showTag, setShowTag] = useState<"hide" | "right" | "above">("right")

  const saveInputToHistory = async (text: string) => {
    const pb = getPocketBaseBrowserClient()

    if (!pb.authStore.isValid) {
      console.warn("Not logged in, skipping history save")
      return
    }

    try {
      await pb.collection("history").create({
        action: "NER",
        details: {
          text: text,
        },
        owner: pb.authStore.record?.id,
        inputOnly: true,
      })
    } catch (error) {
      console.error("Failed to save input to history:", error)
    }
  }

  const renderStats = (section: keyof Stats) => (
    <div className="space-y-1 text-sm text-muted-foreground">
      <div>
        Characters: {stats[section].chars} | Tokens:{" "}
        <span
          className={
            stats[section].tokenCount > MAX_TOKENS ? "text-red-500" : ""
          }
        >
          {stats[section].tokenCount}
        </span>
        /{MAX_TOKENS}
      </div>
    </div>
  )

  const clearAnnotations = () => {
    setUserAnnotations([])
  }

  const saveToHistory = async () => {
    const pb = getPocketBaseBrowserClient()

    if (!pb.authStore.isValid) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please log in to save to history.",
      })
      return
    }

    try {
      await pb.collection("history").create({
        action: "NER",
        details: {
          text: sourceText,
          pred: modelAnnotations,
          user: userAnnotations,
        },
        owner: pb.authStore.record?.id,
        inputOnly: false,
      })
      toast({
        title: "Success",
        description: "Progress saved to history.",
      })
    } catch (error) {
      console.error("Failed to save to history:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save to history.",
      })
    }
  }

  const convertToXML = (text: string, annotations: StyledEntity[]) => {
    const sortedAnnotations = [...annotations].sort((a, b) => a.start - b.start)
    let result = text
    let offset = 0

    sortedAnnotations.forEach(({ start, end, tag, text }) => {
      const entityType =
        ENTITY_TYPES[tag as keyof typeof ENTITY_TYPES]?.label || tag
      const openTag = `<${entityType}>`
      const closeTag = `</${entityType}>`

      result =
        result.slice(0, start + offset) +
        openTag +
        result.slice(start + offset, end + offset) +
        closeTag +
        result.slice(end + offset)

      offset += openTag.length + closeTag.length
    })

    return result
  }

  const copyToClipboard = async (type: "model" | "user") => {
    const annotations = type === "model" ? modelAnnotations : userAnnotations
    const xmlContent = convertToXML(sourceText, annotations)

    try {
      await navigator.clipboard.writeText(xmlContent)
      toast({
        title: "Success",
        description: `${type === "model" ? "Model" : "User"} NER results copied to clipboard`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy to clipboard",
      })
    }
  }

  const handleProcessText = async (text?: string) => {
    const textToUse = text || sourceText
    if (!textToUse.trim()) return

    // Save input to history before processing
    await saveInputToHistory(textToUse)

    // Call the provided processText function
    await processText(textToUse)
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="tag-display"
            className="text-sm text-muted-foreground"
          >
            Tag Display
          </label>
          <Select
            value={showTag}
            onValueChange={value =>
              setShowTag(value as "hide" | "right" | "above")
            }
          >
            <SelectTrigger id="tag-display" className="w-[180px]">
              <SelectValue placeholder="Tag Display" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hide">Hide</SelectItem>
              <SelectItem value="right">Inline</SelectItem>
              <SelectItem value="above">Above</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => handleProcessText()}
          disabled={isProcessing}
          className="flex items-center gap-2"
        >
          <Bolt className="h-4 w-4" />
          <span className="hidden sm:inline">
            {isProcessing ? "Processing..." : "Process"}
          </span>
        </Button>
      </div>

      <Card className={cenv.isCompact ? "mb-2" : "mb-6"}>
        <CardContent className={cenv.isCompact ? "pt-6" : "pt-6"}>
          <Textarea
            placeholder="Enter text for NER analysis..."
            value={sourceText}
            onChange={e => setSourceText(e.target.value)}
            className="mb-2 h-[150px] min-h-[30px] resize-y"
          />
          {renderStats("source")}
        </CardContent>
      </Card>

      <Card className={cenv.isCompact ? "mb-2" : "mb-6"}>
        <CardContent className={cenv.isCompact ? "pt-6" : "pt-6"}>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {Object.entries(ENTITY_TYPES).map(([key, { label, color }]) => (
                <Button
                  key={key}
                  onClick={() =>
                    setSelectedEntityType(key as keyof typeof ENTITY_TYPES)
                  }
                  variant={selectedEntityType === key ? "default" : "secondary"}
                  className="flex items-center gap-2"
                  style={{
                    backgroundColor: color,
                    color: "black",
                    fontWeight: selectedEntityType === key ? "bold" : "normal",
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>
            <NERUsageGuide />
          </div>
        </CardContent>
      </Card>

      <div
        className={
          cenv.isCompact
            ? "mb-2 grid grid-cols-1 gap-2 lg:grid-cols-2"
            : "mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2"
        }
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Model Prediction</CardTitle>
            <Button
              variant="outline"
              onClick={() => copyToClipboard("model")}
              className="flex items-center gap-2"
              title="Copy as XML"
            >
              <Copy className="h-4 w-4" />
              <span className="hidden sm:inline">Copy</span>
            </Button>
          </CardHeader>
          <CardContent>
            <ResizableTextAnnotate
              className="mb-2 h-[300px] min-h-[30px] resize-y rounded-md border bg-muted p-4"
              content={sourceText}
              value={modelAnnotations}
              onChange={() => {}} // Read-only
              getSpan={() => ({}) as StyledEntity} // Disable new annotations
              showTag={showTag}
            />
            {renderStats("model")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>User Annotations</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => copyToClipboard("user")}
                className="flex items-center gap-2"
                title="Copy as XML"
              >
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline">Copy</span>
              </Button>
              <Button
                variant="outline"
                onClick={clearAnnotations}
                className="flex items-center gap-2"
                title="Clear"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
              <Button
                variant="outline"
                onClick={saveToHistory}
                className="flex items-center gap-2"
                title="Save"
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">Save</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResizableTextAnnotate
              className="mb-2 h-[300px] min-h-[30px] resize-y rounded-md border bg-white p-4"
              content={sourceText}
              value={userAnnotations}
              onChange={annotations =>
                setUserAnnotations(
                  annotations.map(({ start, end, text, tag }) => ({
                    start,
                    end,
                    text,
                    tag: tag || selectedEntityType,
                    ...getNewAnnotationStyle(tag || selectedEntityType), // Use the annotation's existing tag if it has one
                  })),
                )
              }
              getSpan={span => ({
                ...span,
                tag: selectedEntityType,
                ...getNewAnnotationStyle(selectedEntityType),
              })}
              showTag={showTag}
            />
            {renderStats("user")}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
