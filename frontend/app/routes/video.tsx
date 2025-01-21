// app/routes/video.tsx
import type { LoaderFunction } from "@remix-run/node"
import { redirect } from "@remix-run/node"

export const loader: LoaderFunction = async () => {
  return redirect("https://hanja.dev/video")
}

export default function Video() {
  // This component won't be rendered since we're redirecting
  return null
}
