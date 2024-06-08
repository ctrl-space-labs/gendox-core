
import React from 'react';
import AppChat from 'src/pages/gendox/chat';
import Box from "@mui/material/Box";
import {useTheme} from "@mui/material/styles";
import {useSettings} from "../../../../@core/hooks/useSettings";


// Add any extra configurations here
const appChatConfig = {
    authProviderOption: 'IFrameAuthProvider',
    footerContent: 'poweredBy',
    embedView: true,
};
const EmbeddedChatApp = (props) => {
    const theme = useTheme();

    const { settings } = useSettings();
    const { skin } = settings;

    return (
        <Box className="embedded-app-chat" sx={{height: "100%"}}>
            {/* Pass the extra configurations as props to AppChat */}
            <AppChat {...appChatConfig} />
        </Box>
    );
};


EmbeddedChatApp.authProviderOption = appChatConfig.authProviderOption;

export default EmbeddedChatApp;