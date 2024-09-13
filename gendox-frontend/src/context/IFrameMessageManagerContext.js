import React, {createContext, useState, useEffect, useContext} from "react";
import MessageManagerService from 'src/gendox-sdk/messageManagerService';
import {useRouter} from "next/router";


const IFrameMessageManagerContext = createContext();

export const IFrameMessageManagerProvider = ({ children }) => {
    const [messageManager, setMessageManager] = useState(new MessageManagerService());
    const [originUrl, setOriginUrl] = useState(null);
    const [isEmbedded, setIsEmbedded] = useState(false);

    const router = useRouter();



    const initializationHandler = (data) => {
        if (data.type !== 'gendox.events.initialization.response') {
            return;
        }
        // Handle the incoming message
        // console.log('Received message:', data);
    };

    useEffect(() => {
        //get url param named 'origin'
        const urlParams = new URLSearchParams(window.location.search);
        const originParam = decodeURIComponent(urlParams.get('origin'));

        if (originParam && !originUrl) {
            setOriginUrl(originParam);
            messageManager.init(originParam, [originParam]);
            messageManager.setTargetOrigin(originParam);
            messageManager.addTrustedOrigin(originParam);
        }

        if (_inIframe()) {
            setIsEmbedded(true);
            messageManager.addHandler(initializationHandler)
            messageManager.sendMessage({ type: 'gendox.events.initialization.request', payload: {} });
            // console.log("In iframe. Sending initialization request to parent...");

        }

        return () => {
            messageManager.cleanup();
        };
    }, []);



    useEffect(() => {

        // console.log("Origin: ", originUrl)
    }, [originUrl]);

    // log the current url every time it changes
    useEffect(() => {
        // console.log("Current URL: ", router.asPath);

        // console.log("Origin: ", originUrl)
    }, [router]);


    const _inIframe = () => {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    };

    const values = {
        messageManager,
        isEmbedded,
        iFrameConfiguration: {
            externalToken: null,
        }
    };

    return (
        <IFrameMessageManagerContext.Provider value={values}>
            {children}
        </IFrameMessageManagerContext.Provider>
    );
};


export const useIFrameMessageManager = () => {
    return useContext(IFrameMessageManagerContext);
};