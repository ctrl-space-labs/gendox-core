
import React, {useEffect, useState} from 'react';
import AppChat from 'src/pages/gendox/chat';
import Box from "@mui/material/Box";
import {styled, useTheme} from "@mui/material/styles";
import {useSettings} from "../../../../@core/hooks/useSettings";
import BlankLayout from "../../../../@core/layouts/BlankLayout";
import PoweredByGendox from "../../../../layouts/components/shared-components/PoweredByGendox";
import IconButton from "@mui/material/IconButton";
import {CloseIcon} from "next/dist/client/components/react-dev-overlay/internal/icons/CloseIcon";
import {useIFrameMessageManager} from "../../../../context/IFrameMessageManagerContext";


// Add any extra configurations here
const appChatConfig = {
    authProviderOption: 'IFrameAuthProvider',
    // footerContent: 'poweredBy', // no need for this, since we are using the PoweredByGendox component directly
    embedView: true,
    chatUrlPath: '/gendox/embed/embedded-chat',
};
const StyledWrapper = styled(Box)(({ theme, isOpen }) => ({
    display: "flex",
    flexDirection: "column",
    height: "100vh", // Full viewport height
    width: "100vw", // Full viewport width
    position: "fixed", // Make it fixed to stay on the screen when opened
    bottom: 0, // Align it to the bottom of the viewport
    right: 0, // Align it to the right of the viewport
    zIndex: 1000, // Ensure it's above other content
    transition: "transform 0.3s ease-in-out", // For smooth opening/closing animation
    transform: isOpen ? "translateY(0)" : "translateY(100%)", // Slide up/down based on isOpen state
}));

const EmbeddedChatApp = (props) => {
    const theme = useTheme();
    const { settings } = useSettings();
    const [isOpen, setIsOpen] = useState(false); // Manage chat window visibility
    const iFrameMessageManager = useIFrameMessageManager();


    const toggleChatWindow = () => {
        const nextState = !isOpen;
        const sendMessage = () => {
            iFrameMessageManager.messageManager.sendMessage({
                type: 'GENDOX_EVENTS_EMBEDDED_CHAT_TOGGLE_ACTION',
                data: { isOpen: nextState }
            });
        };

        // Delay logic depending on whether we're opening or closing
        if (nextState) {
            sendMessage(); // Opening: send the message immediately
            setTimeout(() => setIsOpen(nextState), 10); // Delay state update
        } else {
            setIsOpen(nextState); // Closing: update state immediately
            setTimeout(sendMessage, 320); // Delay message
        }
    };

    return (
        <>
            {/* Bubble button to toggle chat window */}
            {!isOpen && (
                <IconButton
                    onClick={toggleChatWindow}
                    sx={{
                        position: 'fixed',
                        bottom: theme.spacing(0), // Place the bubble near the bottom
                        right: theme.spacing(0), // Place it near the right
                        // width: 60,
                        // height: 60,
                        borderRadius: "50%",
                        zIndex: 999, // Keep above other content
                        // boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)', // Add a shadow for effect
                        display: 'flex', // Show the bubble when chat window is closed
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        backgroundColor: "rgba(0,0,0,0)"
                    }}
                >
                    <img
                        src="/images/gendoxLogo.svg"
                        alt="Chat Icon"
                        style={{width: '100%', height: '100%', borderRadius: '50%'}}
                    />
                </IconButton>
            )}

            {/* Chat window */}
            <StyledWrapper
                isOpen={isOpen} // Pass the isOpen prop here
                sx={{
                    backgroundImage:
                        settings.mode === "light"
                            ? `url('/images/gendox-background-light.webp')`
                            : `url('/images/gendox-background-dark.webp')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                }}
            >
                {/* "X" button to close the chat window */}
                {isOpen && (
                    <IconButton
                        onClick={toggleChatWindow}
                        sx={{
                            position: 'absolute',
                            top: theme.spacing(3),
                            right: theme.spacing(3),
                            zIndex: 1002, // Ensure it stays above the chat window content
                            // color: '#fff', // Customize color if needed
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                )}

                <Box className="embedded-app-chat" sx={{ flex: 1 }}>
                    <AppChat {...appChatConfig} />
                </Box>
                <footer>
                    <Box sx={{
                        padding: theme.spacing(2),
                    }}>
                        <PoweredByGendox />
                    </Box>
                </footer>
            </StyledWrapper>
        </>
    );
};


EmbeddedChatApp.authProviderOption = appChatConfig.authProviderOption;
// // Allow both authenticated and unauthenticated users to access the embedded chat
EmbeddedChatApp.authGuard = false

EmbeddedChatApp.setConfig = () => {
    return {
        skin: 'embedded'
    }
}

EmbeddedChatApp.getLayout = page => <BlankLayout>{page}</BlankLayout>

export default EmbeddedChatApp;