
import React from 'react';
import AppChat from 'src/pages/gendox/chat';
import Box from "@mui/material/Box";
import {styled, useTheme} from "@mui/material/styles";
import {useSettings} from "../../../../@core/hooks/useSettings";
import BlankLayout from "../../../../@core/layouts/BlankLayout";
import PoweredByGendox from "../../../../layouts/components/shared-components/PoweredByGendox";


// Add any extra configurations here
const appChatConfig = {
    authProviderOption: 'IFrameAuthProvider',
    // footerContent: 'poweredBy', // no need for this, since we are using the PoweredByGendox component directly
    embedView: true,
    chatUrlPath: '/gendox/embed/embedded-chat',
};
const StyledWrapper = styled(Box)(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    height: "100vh", // Full viewport height
    width: "100vw", // Full viewport width
}));

const EmbeddedChatApp = (props) => {
    const theme = useTheme();

    const { settings } = useSettings();
    const { skin } = settings;

    return (
        <StyledWrapper
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
            <Box className="embedded-app-chat" sx={{flex: 1 }}>
                {/* Pass the extra configurations as props to AppChat */}
                <AppChat {...appChatConfig} />
            </Box>
            <footer>
                <Box sx={{
                    padding: theme.spacing(2),
                }}>
                    <PoweredByGendox/>
                </Box>
            </footer>

        </StyledWrapper>
    );
};


EmbeddedChatApp.authProviderOption = appChatConfig.authProviderOption;
// // Allow both authenticated and unauthenticated users to access the embedded chat
EmbeddedChatApp.authGuard = false

EmbeddedChatApp.getLayout = page => <BlankLayout>{page}</BlankLayout>

export default EmbeddedChatApp;