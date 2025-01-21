// app/components/PasswordUpdateDialog.tsx
import { Eye, EyeOff, Lock } from "lucide-react"
import { useState } from "react"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { useToast } from "~/hooks/use-toast"
import { getPocketBaseBrowserClient } from "~/lib/pocketbase"

export function PasswordUpdateDialog() {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      const oldPassword = formData.get("oldPassword") as string
      const newPassword = formData.get("newPassword") as string
      const passwordConfirm = formData.get("passwordConfirm") as string

      // Validation
      if (!oldPassword || !newPassword || !passwordConfirm) {
        setError("Please fill in all fields")
        return
      }

      if (newPassword.length < 8) {
        setError("New password must be at least 8 characters long")
        return
      }

      if (newPassword !== passwordConfirm) {
        setError("New passwords do not match")
        return
      }

      const pb = getPocketBaseBrowserClient()
      const userId = pb.authStore.model?.id

      if (!userId) {
        throw new Error("User not authenticated")
      }

      await pb.collection("users").update(userId, {
        oldPassword,
        password: newPassword,
        passwordConfirm,
      })

      toast({
        title: "Success",
        description: "Your password has been updated successfully.",
      })
      setIsOpen(false)
    } catch (error: any) {
      console.error("Password update error:", error)
      setError(error.message || "Failed to update password")

      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Failed to update password. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Lock className="h-4 w-4" />
          Update Password
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Password</DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new password.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-center text-sm font-medium text-red-500">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="oldPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="oldPassword"
                name="oldPassword"
                type={showOldPassword ? "text" : "password"}
                required
                disabled={isLoading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowOldPassword(!showOldPassword)}
              >
                {showOldPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? "text" : "password"}
                required
                disabled={isLoading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="passwordConfirm"
                name="passwordConfirm"
                type={showConfirmPassword ? "text" : "password"}
                required
                disabled={isLoading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
