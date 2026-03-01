import type { ReactElement } from "react"
import Link from "next/link"
import BlankLayout from "src/@core/layouts/BlankLayout"
import FooterIllustrations from "src/views/pages/misc/FooterIllustrations"
import { Button } from "@/components/ui/button"

const Error401 = () => {
  return (
    <div className="content-center">
      <div className="p-5 flex flex-col items-center text-center">
        <div className="md:w-auto w-[90vw]">
          <h1 className="text-8xl font-bold text-foreground">401</h1>
          <h5 className="text-2xl font-medium mb-1">
            You are not authorized!
          </h5>
          <p className="text-sm text-muted-foreground">
            You don&prime;t have permission to access this page. Go Home!
          </p>
        </div>
        <img
          height={487}
          alt="error-illustration"
          src="/images/pages/401.png"
          className="mb-10 lg:mt-13 lg:h-auto md:h-[400px] h-[350px]"
        />
        <Link href="/">
          <Button className="px-6">Back to Home</Button>
        </Link>
      </div>
      <FooterIllustrations />
    </div>
  )
}

Error401.getLayout = (page: ReactElement) => <BlankLayout>{page}</BlankLayout>

export default Error401
