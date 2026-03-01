import Link from "next/link"

const GendoxAppBrand = () => {
  return (
    <Link
      href="/gendox/home"
      className="no-underline flex items-center cursor-pointer p-5"
    >
      <div
        className="w-[30px] h-[30px] bg-no-repeat bg-center"
        style={{
          backgroundImage: "url('/images/gendoxLogo.svg')",
          backgroundSize: "20px 20px",
        }}
      />
      <span className="ml-2 text-lg font-semibold text-foreground">Gendox</span>
    </Link>
  )
}

export default GendoxAppBrand
