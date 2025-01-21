// app/routes/dashboard.tsx
import { Link, MetaFunction, useNavigate } from "@remix-run/react"
import { History, LogOut, Pencil, Shield, User } from "lucide-react"
import { useEffect, useState } from "react"
import { MyContainer, MyHeader } from "~/components/MyCommon"
import { PasswordUpdateDialog } from "~/components/PasswordUpdateDialog"
import { ProfileData, ProfileDialog } from "~/components/ProfileDialog"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { withProtection } from "~/components/withProtection"
import { useToast } from "~/hooks/use-toast"
import { getPocketBaseBrowserClient } from "~/lib/pocketbase"

export const meta: MetaFunction = () => {
  return [{ title: "Hanja Platform | Dashboard" }]
}

interface UserData {
  email: string
  id: string
  bio?: ProfileData | null
}

export default withProtection(DashboardPage)

function DashboardPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    affiliation: "",
    hanjaLevel: "beginner",
    introduction: "",
  })

  useEffect(() => {
    const pb = getPocketBaseBrowserClient()
    const user = pb.authStore.record as unknown as UserData
    setUserData(user)
    if (user.bio) {
      setProfileData(user.bio)
    }
  }, [])

  const handleLogout = async () => {
    const pb = getPocketBaseBrowserClient()
    pb.authStore.clear()
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    })
    navigate("/login")
  }

  const handleProfileUpdate = async (skipProfile: boolean) => {
    try {
      const pb = getPocketBaseBrowserClient()
      await pb.collection("users").update(userData?.id || "", {
        bio: skipProfile ? null : profileData,
      })
      setUserData(prev =>
        prev ? { ...prev, bio: skipProfile ? null : profileData } : null,
      )
      setIsProfileDialogOpen(false)
      toast({
        title: "Profile Updated",
        description: skipProfile
          ? "Profile update skipped."
          : "Your profile has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!userData) {
    return null
  }

  return (
    <MyContainer>
      <MyHeader
        title="Dashboard"
        description="Manage your account, view your activity, and update your profile"
      />

      <section className="mx-auto mb-12 grid gap-6 md:grid-cols-2">
        {/* Account Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Email
                </p>
                <p className="text-sm">{userData.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">UID</p>
                <p className="text-sm">{userData.id}</p>
              </div>
            </div>
            <div className="flex flex-col gap-4 pt-4">
              <PasswordUpdateDialog />
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsProfileDialogOpen(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {userData.bio ? (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Name
                    </p>
                    <p className="text-sm">{userData.bio.name || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Affiliation
                    </p>
                    <p className="text-sm">
                      {userData.bio.affiliation || "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Hanja Level
                    </p>
                    <p className="text-sm capitalize">
                      {userData.bio.hanjaLevel || "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Introduction
                    </p>
                    <p className="text-sm">
                      {userData.bio.introduction || "Not set"}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No profile information set
                </p>
              )}
            </div>
            <Link to="/history" className="block pt-4">
              <Button variant="outline" className="w-full">
                <History className="ml-2 h-4 w-4" />
                View History
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <ProfileDialog
        open={isProfileDialogOpen}
        onOpenChange={setIsProfileDialogOpen}
        profileData={profileData}
        setProfileData={setProfileData}
        onSubmit={handleProfileUpdate}
      />
    </MyContainer>
  )
}
