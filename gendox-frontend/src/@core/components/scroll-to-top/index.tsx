import { useEffect, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ScrollToTopProps {
  children: ReactNode
  className?: string
}

const ScrollToTop = ({ children, className }: ScrollToTopProps) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleClick = () => {
    document.querySelector("body")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div
      className={cn(
        "fixed right-6 bottom-10 z-[11] transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0 pointer-events-none",
        className
      )}
      onClick={handleClick}
      role="presentation"
    >
      {children}
    </div>
  )
}

export default ScrollToTop
