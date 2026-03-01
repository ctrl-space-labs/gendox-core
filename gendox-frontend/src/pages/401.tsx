import type { ReactElement } from "react"
import Link from "next/link"
import { ShieldX, ArrowLeft } from "lucide-react"
import BlankLayout from "src/@core/layouts/BlankLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const Error401 = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-10 pb-10 px-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto mb-6">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-6xl font-bold text-foreground mb-2">401</h1>
          <h2 className="text-xl font-semibold mb-2">
            You are not authorized
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            You don&apos;t have permission to access this page. Please sign in
            with an authorized account.
          </p>
          <Link href="/gendox/home">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

Error401.getLayout = (page: ReactElement) => <BlankLayout>{page}</BlankLayout>

export default Error401
