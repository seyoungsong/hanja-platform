// app/routes/history-admin.tsx
import { MetaFunction } from "@remix-run/react"
import { HistoryView } from "~/components/HistoryView"

export const meta: MetaFunction = () => {
  return [{ title: "Hanja Platform | Input History (Admin)" }]
}

export default function InputHistoryAdminPage() {
  return (
    <HistoryView
      title="Input History (Admin)"
      inputOnly={true}
      showOwner={true}
      filterByOwner={false}
      isAdmin={true}
    />
  )
}
