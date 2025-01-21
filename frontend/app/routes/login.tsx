import { MetaFunction } from "@remix-run/react"
import AuthForm from "~/components/AuthForm"

export const meta: MetaFunction = () => {
  return [{ title: "Hanja Platform | Login" }]
}

export default function LoginPage() {
  return <AuthForm mode="login" />
}
