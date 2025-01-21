// app/routes/saved-admin.tsx
import { MetaFunction } from "@remix-run/react"
import { HistoryView } from "~/components/HistoryView"

export const meta: MetaFunction = () => {
  return [{ title: "Hanja Platform | Saved Annotations (Admin)" }]
}

export default function SavedAnnotationsAdminPage() {
  return (
    <HistoryView
      title="Saved Annotations (Admin)"
      inputOnly={false}
      showOwner={true}
      filterByOwner={false}
      isAdmin={true}
    />
  )
}
