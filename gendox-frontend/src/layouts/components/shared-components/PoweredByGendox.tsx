import commonConfig from "src/configs/common.config"

const PoweredByGendox = () => {
  return (
    <a
      href={commonConfig?.gendoxHomePage || "https://gendox.dev"}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground no-underline"
    >
      Powered by
      <div
        className="w-4 h-4 bg-no-repeat bg-center bg-contain"
        style={{ backgroundImage: "url('/images/gendoxLogo.svg')" }}
      />
      <span className="font-medium">Gendox</span>
    </a>
  )
}

export default PoweredByGendox
