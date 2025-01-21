// app/routes/signup.tsx
import { MetaFunction } from "@remix-run/react"
import AuthForm from "~/components/AuthForm"

export const meta: MetaFunction = () => {
  return [{ title: "Hanja Platform | Signup" }]
}

export default function SignupPage() {
  return <AuthForm mode="signup" />
}
