import type { ReactElement } from "react"
import Link from "next/link"
import { FileQuestion, ArrowLeft } from "lucide-react"
import BlankLayout from "src/@core/layouts/BlankLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const Error404 = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-10 pb-10 px-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-6">
            <FileQuestion className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
          <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
          <p className="text-sm text-muted-foreground mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
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

Error404.getLayout = (page: ReactElement) => <BlankLayout>{page}</BlankLayout>

export default Error404
