import { useState } from "react"
import { useRouter } from "next/router"
import { useAuth } from "src/authentication/useAuth"
import { localStorageConstants } from "src/utils/generalConstants"
import organizationService from "src/gendox-sdk/organizationService"
import { toast } from "sonner"
import { getErrorMessage } from "src/utils/errorHandler"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Organization</CardTitle>
      </CardHeader>
      <Separator />
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organization-name">Name</Label>
              <Input
                id="organization-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization-displayName">Display Name</Label>
              <Input
                id="organization-displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization-address">Address</Label>
              <Input
                id="organization-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization-phone">Phone</Label>
              <Input
                id="organization-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          {loading ? (
            <Spinner size="sm" />
          ) : (
            <>
              <Button type="submit" size="lg">
                Submit
              </Button>
              <Button type="reset" variant="outline" size="lg">
                Reset
              </Button>
            </>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}

export default CreateOrganization
