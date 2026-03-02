const GendoxFooterContent = () => {
  return (
    <div className="flex flex-wrap items-center justify-between">
      <p className="mr-2 text-sm text-muted-foreground">
        {`\u00A9 ${new Date().getFullYear()}, Created by `}
        <a
          href="https://www.ctrlspace.dev/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        >
          Ctrl+Space Labs
        </a>
      </p>
      <div className="hidden md:flex flex-wrap items-center gap-4 text-sm">
        <a
          href="https://ctrl-space-labs.github.io/gendox-core"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        >
          Documentation
        </a>
        <a
          href="https://www.ctrlspace.dev/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        >
          Support
        </a>
        <a
          href="https://themeselection.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        >
          ThemeSelection
        </a>
      </div>
    </div>
  )
}

export default GendoxFooterContent
