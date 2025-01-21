// app/lib/pocketbase.ts
import PocketBase from "pocketbase"
import { cenv } from "~/lib/cenv"

export function getPocketBaseBrowserClient() {
  return new PocketBase(cenv.PB_URL)
}

export function isAuthValid() {
  const pb = getPocketBaseBrowserClient()
  return pb.authStore.isValid
}
