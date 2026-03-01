import { Separator } from "@/components/ui/separator"

interface VerticalNavSectionTitleProps {
  item: {
    sectionTitle: string
  }
}

const VerticalNavSectionTitle = ({ item }: VerticalNavSectionTitleProps) => {
  return (
    <li className="nav-section-title list-none relative flex my-2 bg-transparent transition-[padding-left] duration-250 ease-in-out">
      <div className="flex items-center w-full py-1.5">
        <Separator className="flex-1" />
        <span className="px-2.5 text-[0.75rem] leading-normal tracking-[0.21px] uppercase text-muted-foreground font-medium truncate">
          {item.sectionTitle}
        </span>
        <Separator className="flex-1" />
      </div>
    </li>
  )
}

export default VerticalNavSectionTitle
