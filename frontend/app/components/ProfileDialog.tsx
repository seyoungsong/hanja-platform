// app/components/ProfileDialog.tsx
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { Textarea } from "~/components/ui/textarea"

export interface ProfileData {
  name: string
  affiliation: string
  hanjaLevel: string
  introduction: string
}

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profileData: ProfileData
  setProfileData: (data: ProfileData) => void
  onSubmit: (skipProfile: boolean) => Promise<void>
}

const HANJA_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "learner", label: "Learner" },
  { value: "expert", label: "Expert" },
]

export function ProfileDialog({
  open,
  onOpenChange,
  profileData,
  setProfileData,
  onSubmit,
}: ProfileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Tell us a bit about yourself. You can skip this step and complete it
            later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={profileData.name}
              onChange={e =>
                setProfileData({ ...profileData, name: e.target.value })
              }
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="affiliation">Current Affiliation</Label>
            <Input
              id="affiliation"
              value={profileData.affiliation}
              onChange={e =>
                setProfileData({ ...profileData, affiliation: e.target.value })
              }
              placeholder="Your school or organization"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hanjaLevel">Hanja Expertise Level</Label>
            <Select
              value={profileData.hanjaLevel}
              onValueChange={value =>
                setProfileData({ ...profileData, hanjaLevel: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your level" />
              </SelectTrigger>
              <SelectContent>
                {HANJA_LEVELS.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="introduction">Introduction</Label>
            <Textarea
              id="introduction"
              value={profileData.introduction}
              onChange={e =>
                setProfileData({ ...profileData, introduction: e.target.value })
              }
              placeholder="Brief introduction about yourself"
              className="h-24"
            />
          </div>
        </div>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onSubmit(true)}>
            Skip for now
          </Button>
          <Button onClick={() => onSubmit(false)}>Complete Profile</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
