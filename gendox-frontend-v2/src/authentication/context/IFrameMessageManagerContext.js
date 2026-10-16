import React, {createContext, useState, useEffect, useContext} from "react";
import MessageManagerService from 'src/gendox-sdk/messageManagerService';
import {useRouter} from "next/router";


const IFrameMessageManagerContext = createContext();
const CONFIG_UPDATE_EVENT = 'gendox.events.embedded.config.update';
const DEFAULT_IFRAME_CONFIGURATION = {
    externalToken: null,
    chatInitialState: 'closed',   // 'open' or 'closed'
    localContextMaxResponses: 1,
    localContextMaxWaitMs: 200,
    sessionResumeTimeoutMs: 600_000
};

const normalizeChatInitialState = (value) => value === 'open' ? 'open' : 'closed';

const parseNonNegativeInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
};

export const IFrameMessageManagerProvider = ({ children }) => {
    const [messageManager, setMessageManager] = useState(new MessageManagerService());
    const [originUrl, setOriginUrl] = useState(null);
    const [isEmbedded, setIsEmbedded] = useState(false);
    const [iFrameConfiguration, setIFrameConfiguration] = useState(DEFAULT_IFRAME_CONFIGURATION);

    const router = useRouter();



    const initializationHandler = (data) => {
        if (data.type !== 'gendox.events.initialization.response') {
            return;
        }
        const payload = data.payload || data;
        setIFrameConfiguration({
            externalToken: payload.externalToken || payload.accessToken || null,
            chatInitialState: normalizeChatInitialState(payload.chatInitialState),
            localContextMaxResponses: parseNonNegativeInt(
                payload.localContextMaxResponses,
                DEFAULT_IFRAME_CONFIGURATION.localContextMaxResponses
            ),
            localContextMaxWaitMs: parseNonNegativeInt(
                payload.localContextMaxWaitMs,
                DEFAULT_IFRAME_CONFIGURATION.localContextMaxWaitMs
            ),
            sessionResumeTimeoutMs: parseNonNegativeInt(
                payload.sessionResumeTimeoutMs,
                DEFAULT_IFRAME_CONFIGURATION.sessionResumeTimeoutMs
            )
        });
    };

    const configUpdateHandler = (data) => {
        if (data.type !== CONFIG_UPDATE_EVENT || !data.payload) return;
        const p = data.payload;
        setIFrameConfiguration(prev => ({
            ...prev,
            ...(p.chatInitialState !== undefined && { chatInitialState: normalizeChatInitialState(p.chatInitialState) }),
            ...(p.localContextMaxResponses !== undefined && {
                localContextMaxResponses: Math.max(1, parseNonNegativeInt(p.localContextMaxResponses, prev.localContextMaxResponses))
            }),
            ...(p.localContextMaxWaitMs !== undefined && {
                localContextMaxWaitMs: parseNonNegativeInt(p.localContextMaxWaitMs, prev.localContextMaxWaitMs)
            })
        }));
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
            messageManager.addHandler(initializationHandler);
            messageManager.addHandler(configUpdateHandler);
            messageManager.sendMessage({ type: 'gendox.events.initialization.request', payload: {} });
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
        iFrameConfiguration,
        originUrl
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
