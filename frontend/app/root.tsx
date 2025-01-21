// app/root.tsx
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node"
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react"
import { AppSidebar } from "~/components/AppSidebar"
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar"
import { Toaster } from "~/components/ui/toaster"
import "./tailwind.css"

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get("Cookie")
  const cookies =
    cookieHeader?.split(";").reduce((acc: Record<string, string>, cookie) => {
      const [key, value] = cookie.split("=").map(c => c.trim())
      acc[key] = value
      return acc
    }, {}) || {}
  return Response.json({
    defaultOpen: cookies["sidebar:state"] === "true",
  })
}

export default function App() {
  const { defaultOpen } = useLoaderData<typeof loader>()

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script
          defer
          src="https://umami.hanja.dev/script.js"
          data-website-id="umami-key"
        ></script>
      </head>
      <body>
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar />
          <SidebarTrigger />
          <Outlet />
        </SidebarProvider>
        <Toaster />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
]
