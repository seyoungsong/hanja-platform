// app/components/HistoryView.tsx
import { Link } from "@remix-run/react"
import {
  Clock,
  Download,
  FileSpreadsheet,
  SquareArrowOutUpRight,
  Trash2,
} from "lucide-react"
import { useEffect, useState } from "react"
import { z } from "zod"
import { MyContainer, MyHeader } from "~/components/MyCommon"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { useToast } from "~/hooks/use-toast"
import { exportToExcel } from "~/lib/excel"
import { getPocketBaseBrowserClient } from "~/lib/pocketbase"

const HistoryItemSchema = z.object({
  id: z.string(),
  action: z.string(),
  details: z.unknown(),
  created: z.string(),
  updated: z.string(),
  owner: z.string(),
  inputOnly: z.boolean(),
})

type HistoryItem = z.infer<typeof HistoryItemSchema>

interface HistoryViewProps {
  title: string
  description?: string
  showOwner?: boolean
  filterByOwner?: boolean
  isAdmin?: boolean
  inputOnly?: boolean
}

const ACTION_LABELS = {
  PR: "Punctuate",
  NER: "NER",
  MT: "Translate",
} as const

const ACTION_PATHS = {
  PR: "/punc",
  NER: "/ner",
  MT: "/translation",
} as const

export function HistoryView({
  title,
  description,
  showOwner = false,
  filterByOwner = true,
  isAdmin = false,
  inputOnly,
}: HistoryViewProps) {
  const { toast } = useToast()
  const [historyList, setHistoryList] = useState<HistoryItem[]>([])

  useEffect(() => {
    loadHistory()
  }, [inputOnly])

  const loadHistory = async () => {
    try {
      const pb = getPocketBaseBrowserClient()
      const currentUserId = pb.authStore.record?.id

      const filterConditions = []

      if (filterByOwner && currentUserId) {
        filterConditions.push(`owner = "${currentUserId}"`)
      }

      if (inputOnly !== undefined) {
        filterConditions.push(`inputOnly = ${inputOnly}`)
      }

      const options: Record<string, any> = {
        sort: "-created",
      }

      if (filterConditions.length > 0) {
        options.filter = filterConditions.join(" && ")
      }

      const records = await pb.collection("history").getFullList(options)
      const validatedRecords = records.map(record =>
        HistoryItemSchema.parse(record),
      )
      setHistoryList(validatedRecords)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load or validate history records.",
        variant: "destructive",
      })
      console.error("Error loading history:", error)
    }
  }

  const handleDownloadJson = () => {
    try {
      const dataToDownload = historyList.map(item => ({
        action: item.action,
        details: item.details,
        created: item.created,
        owner: item.owner,
      }))

      const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `history-export-${new Date().toISOString()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download history data.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadExcel = () => {
    try {
      const dataToExport = historyList.map(item => {
        // Start with base fields
        const flattenedData: Record<string, any> = {
          action:
            ACTION_LABELS[item.action as keyof typeof ACTION_LABELS] ||
            item.action,
          created: new Date(item.created).toLocaleString(),
          owner: item.owner,
        }

        // Flatten the details object if it exists and is an object
        if (item.details && typeof item.details === "object") {
          // Cast to any to handle unknown shape of details
          const details = item.details as any

          // Add each key from details to the flattened data
          Object.entries(details).forEach(([key, value]) => {
            // Avoid overwriting existing keys
            const uniqueKey = flattenedData[key] ? `details_${key}` : key

            // Handle nested objects by stringifying them
            flattenedData[uniqueKey] =
              typeof value === "object" && value !== null
                ? JSON.stringify(value)
                : value
          })
        } else if (item.details) {
          // If details is not an object, store it as is
          flattenedData.details = item.details
        }

        return flattenedData
      })

      exportToExcel(dataToExport, "history-export")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download Excel file.",
        variant: "destructive",
      })
    }
  }

  const getActionPath = (action: string, id: string) => {
    const path = ACTION_PATHS[action as keyof typeof ACTION_PATHS]
    if (!path) {
      return null
    }
    return `${path}?id=${id}`
  }

  const handleDelete = async (id: string) => {
    try {
      const pb = getPocketBaseBrowserClient()
      await pb.collection("history").delete(id)

      toast({
        title: "Success",
        description: "Entry deleted successfully.",
      })

      loadHistory()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete entry.",
        variant: "destructive",
      })
    }
  }

  const formatDetails = (details: unknown): string => {
    try {
      if (typeof details === "string") {
        return details
      }
      const prettyJson = JSON.stringify(details, null, 2)
      if (prettyJson.split("\n").length > 100) {
        return JSON.stringify(details)
      }
      return prettyJson
    } catch {
      return String(details)
    }
  }

  const getDisplayTitle = (record: HistoryItem) => {
    const details = record.details as any
    const text = details?.text || ""
    const actionLabel =
      ACTION_LABELS[record.action as keyof typeof ACTION_LABELS] ||
      record.action
    return `${actionLabel}: ${text}`
  }

  const headerButtons = (
    <div className="flex justify-center gap-2">
      <Button
        variant="outline"
        onClick={handleDownloadJson}
        disabled={historyList.length === 0}
        data-umami-event="download_history_json"
        data-umami-event-type="export"
        data-umami-event-count={historyList.length}
      >
        <Download className="mr-2 h-4 w-4" />
        Download JSON
      </Button>
      <Button
        variant="default"
        onClick={handleDownloadExcel}
        disabled={historyList.length === 0}
        data-umami-event="download_history_excel"
        data-umami-event-type="export"
        data-umami-event-count={historyList.length}
      >
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Download Excel
      </Button>
    </div>
  )

  return (
    <MyContainer>
      <MyHeader
        title={title}
        description={description}
        buttons={headerButtons}
      />
      <section className="mb-8 space-y-4">
        {historyList.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No history entries yet</p>
              <p className="text-sm text-muted-foreground">
                {inputOnly
                  ? "No input history available"
                  : "No saved annotations available"}
              </p>
            </CardContent>
          </Card>
        ) : (
          historyList.map((record, idx) => (
            <Card key={record.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex min-w-0 flex-grow items-center gap-4">
                    {getActionPath(record.action, record.id) ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0"
                        asChild
                        data-umami-event="view_history_item"
                        data-umami-event-type="navigation"
                        data-umami-event-action={record.action}
                      >
                        <Link to={getActionPath(record.action, record.id)!}>
                          <SquareArrowOutUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled
                        className="flex-shrink-0"
                      >
                        <SquareArrowOutUpRight className="h-4 w-4" />
                      </Button>
                    )}
                    <span className="truncate">{getDisplayTitle(record)}</span>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-4">
                    <span className="whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(record.created).toLocaleString()}
                    </span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          disabled={isAdmin}
                          data-umami-event="open_delete_dialog"
                          data-umami-event-type="action"
                          data-umami-event-action={record.action}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this entry? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-umami-event="cancel_delete">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(record.id)}
                            className="bg-destructive hover:bg-destructive/90"
                            data-umami-event="confirm_delete"
                            data-umami-event-type="action"
                            data-umami-event-action={record.action}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <span className="whitespace-nowrap text-sm text-muted-foreground">
                      {idx + 1}/{historyList.length}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="max-h-[200px] overflow-y-auto whitespace-pre-wrap rounded-md bg-muted p-2 text-sm">
                    {formatDetails(record.details)}
                  </pre>
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-background to-transparent" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </MyContainer>
  )
}
