import type { ReactElement } from "react"
import Link from "next/link"
import { ServerCrash, ArrowLeft } from "lucide-react"
import BlankLayout from "src/@core/layouts/BlankLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const Error500 = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-10 pb-10 px-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto mb-6">
            <ServerCrash className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-6xl font-bold text-foreground mb-2">500</h1>
          <h2 className="text-xl font-semibold mb-2">
            Internal Server Error
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Something went wrong on our end. Please try again later or contact
            support if the problem persists.
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

Error500.getLayout = (page: ReactElement) => <BlankLayout>{page}</BlankLayout>

export default Error500
