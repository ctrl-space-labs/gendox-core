import { Loader2 } from 'lucide-react'

interface GendoxPageLoaderProps {
  className?: string
}

const GendoxPageLoader = ({ className }: GendoxPageLoaderProps) => {
  return (
    <div className={`h-screen flex items-center flex-col justify-center ${className || ''}`}>
      <img src="/images/gendoxLogo.svg" alt="Gendox Logo" />
      <Loader2 className="mt-6 h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default GendoxPageLoader
