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
      <img
        src="/images/gendoxLogo.svg"
        alt="Gendox"
        width={16}
        height={16}
        className="h-4 w-4"
      />
      <span className="font-medium">Gendox</span>
    </a>
  )
}

export default PoweredByGendox
