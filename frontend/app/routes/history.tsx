// app/routes/history.tsx
import { MetaFunction } from "@remix-run/react"
import { HistoryView } from "~/components/HistoryView"

export const meta: MetaFunction = () => {
  return [{ title: "Hanja Platform | Input History" }]
}

export default function InputHistoryPage() {
  return <HistoryView title="Input History" inputOnly={true} />
}
