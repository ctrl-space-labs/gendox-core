import { Fragment, useState, useEffect, type ReactNode } from "react"
import { useTheme } from "next-themes"

interface FooterIllustrationsV1Props {
  image1?: ReactNode
  image2?: ReactNode
}

const FooterIllustrationsV1 = ({ image1, image2 }: FooterIllustrationsV1Props) => {
  const { resolvedTheme } = useTheme()
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    const check = () => setHidden(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  if (hidden) return null

  return (
    <Fragment>
      {image1 || (
        <img
          alt="tree"
          src="/images/pages/auth-v1-tree.png"
          className="absolute left-0 bottom-0"
        />
      )}
      <img
        alt="mask"
        src={`/images/pages/auth-v1-mask-${resolvedTheme || "dark"}.png`}
        className="absolute bottom-0 -z-[1] w-full"
      />
      {image2 || (
        <img
          alt="tree-2"
          src="/images/pages/auth-v1-tree-2.png"
          className="absolute right-0 bottom-0"
        />
      )}
    </Fragment>
  )
}

export default FooterIllustrationsV1
