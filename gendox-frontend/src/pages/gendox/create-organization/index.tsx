import { useState } from "react"
import { useRouter } from "next/router"
import { Building2, RotateCcw, Loader2 } from "lucide-react"
import { useAuth } from "src/authentication/useAuth"
import { localStorageConstants } from "src/utils/generalConstants"
import organizationService from "src/gendox-sdk/organizationService"
import { toast } from "sonner"
import { getErrorMessage } from "src/utils/errorHandler"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const CreateOrganization = () => {
  const auth = useAuth()
  const router = useRouter()
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem(localStorageConstants.accessTokenKey)
      : null

  const [name, setName] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const newOrganizationPayload = { name, displayName, address, phone }

    try {
      const response = await (organizationService as any).createOrganization(
        newOrganizationPayload,
        token
      )
      toast.success("Organization created successfully!")
      await auth.loadUserProfileFromAuthState(auth.oidcAuthState)
      router.push(
        `/gendox/create-project/?organizationId=${response.data.id}`
      )
    } catch (error: any) {
      console.error("Failed to create organization", error)
      toast.error(
        `Organization did not create. Error: ${getErrorMessage(error)}`
      )
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setName("")
    setDisplayName("")
    setAddress("")
    setPhone("")
  }

  return (
    <div className="flex justify-center py-8 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">
                Create New Organization
              </CardTitle>
              <CardDescription>
                Organizations let you manage projects, team members, and
                billing in one place.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="organization-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="organization-name"
                  placeholder="e.g. acme-corp"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  A unique identifier for your organization.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization-displayName">Display Name</Label>
                <Input
                  id="organization-displayName"
                  placeholder="e.g. Acme Corporation"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  How your organization appears to others.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="organization-address">Address</Label>
                <Input
                  id="organization-address"
                  placeholder="e.g. 123 Main St, City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization-phone">Phone</Label>
                <Input
                  id="organization-phone"
                  placeholder="e.g. +1 (555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <Separator />
          <div className="flex items-center justify-end gap-3 p-6">
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              disabled={loading}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Building2 className="mr-2 h-4 w-4" />
              )}
              {loading ? "Creating..." : "Create Organization"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default CreateOrganization
