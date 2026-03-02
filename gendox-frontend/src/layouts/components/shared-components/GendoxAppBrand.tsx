import Link from "next/link"

const GendoxAppBrand = () => {
  return (
    <Link
      href="/gendox/home"
      className="no-underline flex items-center p-5"
    >
      <img
        src="/images/gendoxLogo.svg"
        alt="Gendox"
        width={20}
        height={20}
        className="h-5 w-5"
      />
      <span className="ml-2 text-lg font-semibold text-foreground">Gendox</span>
    </Link>
  )
}

export default GendoxAppBrand
