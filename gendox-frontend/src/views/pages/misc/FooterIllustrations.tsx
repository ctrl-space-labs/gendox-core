import { Fragment, useState, useEffect, type ReactNode } from "react"
import { useTheme } from "next-themes"

interface FooterIllustrationsProps {
  image?: ReactNode
}

const FooterIllustrations = ({ image }: FooterIllustrationsProps) => {
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
      {image || (
        <img
          alt="tree"
          src="/images/pages/tree-2.png"
          className="absolute left-9 bottom-[4.25rem] lg:left-0 lg:bottom-0"
        />
      )}
      <img
        alt="mask"
        src={`/images/pages/misc-mask-${resolvedTheme || "dark"}.png`}
        className="absolute bottom-0 -z-[1] w-full"
      />
    </Fragment>
  )
}

export default FooterIllustrations
