import type { ReactNode } from "react"

interface BlankLayoutProps {
  children: ReactNode
}

const BlankLayout = ({ children }: BlankLayoutProps) => {
  return (
    <div className="layout-wrapper h-screen">
      <div className="app-content min-h-screen overflow-x-hidden relative">
        {children}
      </div>
    </div>
  )
}

export default BlankLayout

export const BlankLayoutWrapper = ({ children }: { children: ReactNode }) => (
  <div className="h-screen [&_.content-center]:flex [&_.content-center]:min-h-screen [&_.content-center]:items-center [&_.content-center]:justify-center [&_.content-center]:p-5 [&_.content-right]:flex [&_.content-right]:min-h-screen [&_.content-right]:overflow-x-hidden [&_.content-right]:relative">
    {children}
  </div>
)
