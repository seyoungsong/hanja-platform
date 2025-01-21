// app/lib/excel.ts
import { utils, writeFile } from "xlsx"

const COLUMN_ORDER = [
  "owner",
  "created",
  "action",
  "text",
  "pred",
  "user",
  "source",
  "target",
  "mode",
]

export function exportToExcel(
  data: Record<string, any>[],
  filename: string = "export",
) {
  if (!data || data.length === 0) {
    throw new Error("No data provided for export")
  }

  try {
    // Get all unique keys from the data
    const allKeys = new Set<string>()
    data.forEach(item => {
      Object.keys(item).forEach(key => allKeys.add(key))
    })

    // Sort keys according to specified order
    const sortedKeys = Array.from(allKeys).sort((a, b) => {
      const indexA = COLUMN_ORDER.indexOf(a)
      const indexB = COLUMN_ORDER.indexOf(b)

      // If both keys are in COLUMN_ORDER, sort by their order
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB
      }
      // If only one key is in COLUMN_ORDER, it comes first
      if (indexA !== -1) return -1
      if (indexB !== -1) return 1
      // For additional columns, sort alphabetically
      return a.localeCompare(b)
    })

    // Process the data maintaining column order
    const processedData = data.map(item => {
      const processed: Record<string, string> = {}

      // Add columns in the sorted order
      sortedKeys.forEach(key => {
        const value = item[key]
        processed[key] =
          typeof value === "string" ? value : JSON.stringify(value)
      })

      return processed
    })

    // Create workbook and worksheet
    const worksheet = utils.json_to_sheet(processedData, {
      header: sortedKeys,
    })

    const workbook = utils.book_new()
    utils.book_append_sheet(workbook, worksheet, "Sheet1")

    // Generate filename with timestamp
    const fullFilename = `${filename}-${new Date().toISOString()}.xlsx`

    // Trigger download
    writeFile(workbook, fullFilename)
  } catch (error) {
    console.error("Error exporting to Excel:", error)
    throw new Error("Failed to export data to Excel")
  }
}
