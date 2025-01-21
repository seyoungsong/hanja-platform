// app/routes/saved.tsx
import { MetaFunction } from "@remix-run/react"
import { HistoryView } from "~/components/HistoryView"

export const meta: MetaFunction = () => {
  return [{ title: "Hanja Platform | Saved Annotations" }]
}

export default function SavedAnnotationsPage() {
  return <HistoryView title="Saved Annotations" inputOnly={false} />
}
