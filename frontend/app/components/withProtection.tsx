// app/components/withProtection.tsx
import { useNavigate } from "@remix-run/react"
import { useEffect } from "react"
import { isAuthValid } from "~/lib/pocketbase"

export function withProtection(Component: React.ComponentType) {
  return function ProtectedComponent(props: any) {
    return (
      <ProtectedRoute>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthValid()) {
      navigate("/login")
    }
  }, [navigate])

  return <>{children}</>
}
