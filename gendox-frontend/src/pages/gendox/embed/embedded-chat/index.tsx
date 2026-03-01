import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { useSettings } from "src/@core/context/settingsContext"
import BlankLayout from "src/@core/layouts/BlankLayout"
import PoweredByGendox from "src/layouts/components/shared-components/PoweredByGendox"
import { Button } from "@/components/ui/button"
import { useIFrameMessageManager } from "src/authentication/context/IFrameMessageManagerContext"
import GendoxChat from "src/views/pages/chat/GendoxChat"
import { routeTypes } from "src/authentication/components/RouteHandler"
import ChatInsight from "src/views/pages/chat/ChatInsight"

const gendoxChatConfig = {
  authProviderOption: "IFrameAuthProvider",
  embedView: true,
  chatUrlPath: "/gendox/embed/embedded-chat",
  chatInsightView: false,
}

const EmbeddedChatPage = () => {
  const { settings, saveSettings } = useSettings()
  const [isOpen, setIsOpen] = useState(false)
  const iFrameMessageManager = useIFrameMessageManager()

  useEffect(() => {
    const originalSettings = settings

    saveSettings({
      ...settings,
      footerContent: "poweredBy",
      navBarContent: "hidden",
      globalSearch: false,
      embeddedLayout: true,
    })

    return () => saveSettings(originalSettings)
  }, [])

  const toggleChatWindow = () => {
    const nextState = !isOpen
    const sendMessage = () => {
      iFrameMessageManager.messageManager.sendMessage({
        type: "gendox.events.embedded.chat.toggle.action",
        data: { isOpen: nextState },
      })
    }

    if (nextState) {
      sendMessage()
      setTimeout(() => setIsOpen(nextState), 10)
    } else {
      setIsOpen(nextState)
      setTimeout(sendMessage, 320)
    }
  }

  const backgroundImage =
    settings.mode === "light"
      ? "url('/images/gendox-back-light.webp')"
      : "url('/images/gendox-back-dark.webp')"

  return (
    <>
      {/* Bubble button to toggle chat window */}
      {!isOpen && (
        <button
          onClick={toggleChatWindow}
          className="fixed bottom-0 right-0 rounded-full z-[999] flex items-center justify-center cursor-pointer bg-transparent border-none"
        >
          <img
            src="/images/gendoxLogo.svg"
            alt="Chat Icon"
            className="w-full h-full rounded-full"
          />
        </button>
      )}

      {/* Chat window */}
      <div
        className={`flex flex-col h-screen w-screen fixed bottom-0 right-0 z-[1000] transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          backgroundImage,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* "X" button to close the chat window */}
        {isOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-[1002]"
            onClick={toggleChatWindow}
          >
            <X className="h-5 w-5" />
          </Button>
        )}

        <div className="embedded-app-chat flex-1 max-h-[calc(100%-3rem)]">
          <GendoxChat {...gendoxChatConfig} />
        </div>
        <footer>
          <div className="p-2">
            <PoweredByGendox />
          </div>
        </footer>
      </div>
    </>
  )
}

;(EmbeddedChatPage as any).pageConfig = {
  authProviderOption: gendoxChatConfig.authProviderOption,
  routeType: routeTypes.sharedRoute,
  embeddedLayout: true,
  mode: "light",
}

;(EmbeddedChatPage as any).getLayout = (page: React.ReactElement) => (
  <BlankLayout>{page}</BlankLayout>
)

export default EmbeddedChatPage
