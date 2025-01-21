// app/components/AuthForm.tsx
import { Link, useNavigate } from "@remix-run/react"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { ProfileDialog, type ProfileData } from "~/components/ProfileDialog"
import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Checkbox } from "~/components/ui/checkbox"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { useToast } from "~/hooks/use-toast"
import { getPocketBaseBrowserClient, isAuthValid } from "~/lib/pocketbase"

interface AuthFormProps {
  mode: "login" | "signup"
}

export default function AuthForm({ mode }: AuthFormProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showRawError, setShowRawError] = useState(false)
  const [rawErrorData, setRawErrorData] = useState<any>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    affiliation: "",
    hanjaLevel: "",
    introduction: "",
  })
  const emailInputRef = useRef<HTMLInputElement>(null)

  const isLogin = mode === "login"
  const title = isLogin ? "Welcome back" : "Create an account"
  const description = isLogin
    ? "Enter your credentials to access your account"
    : "Enter your details to create your account"
  const buttonText = isLogin ? "Sign in" : "Create account"
  const alternateLink = isLogin ? "/signup" : "/login"
  const alternateLinkText = isLogin ? "Sign up" : "Sign in"
  const alternateDescription = isLogin
    ? "Don't have an account?"
    : "Already have an account?"

  useEffect(() => {
    if (isAuthValid()) {
      navigate("/dashboard")
    }
  }, [navigate])

  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus()
    }
  }, [])

  async function handleProfileSubmit(skipProfile: boolean = false) {
    try {
      const pb = getPocketBaseBrowserClient()
      const formData = new FormData(document.querySelector("form")!)
      const email = formData.get("email") as string
      const password = formData.get("password") as string
      const passwordConfirm = formData.get("passwordConfirm") as string

      const userData = {
        email,
        password,
        passwordConfirm,
        bio: skipProfile ? {} : profileData,
      }

      await pb.collection("users").create(userData)
      await pb.collection("users").authWithPassword(email, password)

      toast({
        title: "Welcome!",
        description: "Your account has been created successfully.",
      })

      navigate("/dashboard")
    } catch (error: any) {
      console.error("Profile submission error:", error)
      setRawErrorData(error)
      handleError(error)
    } finally {
      setShowProfileDialog(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    setRawErrorData(null)

    try {
      if (isLogin) {
        const pb = getPocketBaseBrowserClient()
        const formData = new FormData(event.currentTarget)
        const email = formData.get("email") as string
        const password = formData.get("password") as string

        if (!email || !password) {
          setErrors({ form: "Please fill in all required fields" })
          return
        }

        await pb.collection("users").authWithPassword(email, password)
        toast({
          title: "Welcome back!",
          description: "You have been logged in successfully.",
        })
        navigate("/dashboard")
      } else {
        const formData = new FormData(event.currentTarget)
        const email = formData.get("email") as string
        const password = formData.get("password") as string
        const passwordConfirm = formData.get("passwordConfirm") as string

        if (!email || !password || !passwordConfirm) {
          setErrors({ form: "Please fill in all required fields" })
          return
        }

        if (!agreedToTerms) {
          setErrors({ terms: "You must agree to the terms and policies" })
          return
        }

        if (password.length < 8) {
          setErrors({ password: "Password must be at least 8 characters long" })
          return
        }

        if (password !== passwordConfirm) {
          setErrors({ passwordConfirm: "Passwords do not match" })
          return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          setErrors({ email: "Please enter a valid email address" })
          return
        }

        setShowProfileDialog(true)
      }
    } catch (error: any) {
      handleError(error)
    }
  }

  function handleError(error: any) {
    console.error("Auth error:", error)
    setRawErrorData(error)

    if (error.data?.data) {
      const newErrors: Record<string, string> = {}
      Object.entries(error.data.data).forEach(([key, message]) => {
        const errorMessage = Array.isArray(message)
          ? message[0]
          : typeof message === "object"
            ? JSON.stringify(message)
            : String(message)
        newErrors[key] = errorMessage
      })
      setErrors(newErrors)
    } else {
      const errorMessage = error.message || "Authentication failed"

      if (errorMessage.includes("password")) {
        setErrors({ password: "Invalid password" })
      } else if (errorMessage.includes("email")) {
        setErrors({ email: "Invalid email address" })
      } else {
        setErrors({ form: errorMessage })
      }
    }

    toast({
      variant: "destructive",
      title: isLogin ? "Authentication failed" : "Registration failed",
      description: "Please check your details and try again.",
    })
  }

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-white p-4">
      <div className="mx-auto w-full max-w-[400px]">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-center text-2xl font-bold">
              {title}
            </CardTitle>
            <CardDescription className="text-center">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.form && (
                <div className="text-center text-sm font-medium text-red-500">
                  {errors.form}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  className={errors.email ? "border-red-500" : ""}
                  ref={emailInputRef}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className={
                      errors.password ? "border-red-500 pr-10" : "pr-10"
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
                {!isLogin && (
                  <p className="text-sm text-gray-500">
                    Password must be at least 8 characters long
                  </p>
                )}
              </div>

              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="passwordConfirm">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="passwordConfirm"
                        name="passwordConfirm"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                        className={
                          errors.passwordConfirm
                            ? "border-red-500 pr-10"
                            : "pr-10"
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                    {errors.passwordConfirm && (
                      <p className="text-sm text-red-500">
                        {errors.passwordConfirm}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={checked =>
                        setAgreedToTerms(checked as boolean)
                      }
                    />
                    <Label htmlFor="terms" className="text-sm">
                      I agree to the{" "}
                      <Link
                        to="/policies"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        terms and policies
                      </Link>
                    </Label>
                  </div>
                  {errors.terms && (
                    <p className="text-sm text-red-500">{errors.terms}</p>
                  )}
                </>
              )}

              <Button type="submit" className="w-full">
                {buttonText}
              </Button>
            </form>

            {rawErrorData && (
              <div className="mt-4">
                <Button
                  variant="ghost"
                  className="text-sm text-gray-500 hover:text-gray-700"
                  onClick={() => setShowRawError(!showRawError)}
                >
                  {showRawError ? "Hide" : "Show"} Error Details
                </Button>
                {showRawError && (
                  <pre className="mt-2 overflow-auto rounded bg-gray-100 p-2 text-xs">
                    {JSON.stringify(rawErrorData, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              {alternateDescription}{" "}
              <Link
                to={alternateLink}
                className="text-primary underline-offset-4 hover:underline"
              >
                {alternateLinkText}
              </Link>
            </div>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to home
            </Button>
          </CardFooter>
        </Card>

        <ProfileDialog
          open={showProfileDialog}
          onOpenChange={setShowProfileDialog}
          profileData={profileData}
          setProfileData={setProfileData}
          onSubmit={handleProfileSubmit}
        />
      </div>
    </main>
  )
}
