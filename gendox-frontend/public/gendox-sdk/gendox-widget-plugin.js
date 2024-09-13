(function() {
    // Default CSS styles
    const defaultStyles = `
        .gendox-chat-container-position {
            position: fixed;
            bottom: 1rem;
            right: 1rem;
            z-index: 1000;
            border-radius: 10px;
        }
        .gendox-chat-iframe {
            width: 100%;
            height: 100%;
            border: 0;
            border-radius: 0.5rem;
        }
        .gendox-chat-open {
            width: 25rem;
            height: 35rem;
        }
        .gendox-chat-closed {
            width: 3.5rem;
            height: 3.5rem;
        }
    `;

    // Function to inject CSS into the document
    function injectStyles(css) {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = css;
        document.head.appendChild(style);
    }

    // Inject default styles
    injectStyles(defaultStyles);

    // Extract data attributes from the script tag
    function getDataAttributes() {
        const scriptTag = document.getElementById('gendox-chat-script');
        return {
            trustedOrigin: scriptTag.getAttribute('data-trusted-origin') || '',
            organizationId: scriptTag.getAttribute('data-organization-id') || '',
            threadId: scriptTag.getAttribute('data-thread-id') || '',
            gendoxContainerId: scriptTag.getAttribute('data-gendox-container-id') || 'gendox-chat-container-id',
            gendoxIframeId: scriptTag.getAttribute('data-gendox-iframe-id') || 'gendox-chat-iframe-id'
        };
    }

    // Create container and iframe dynamically if they don't exist
    function createChatElements(containerId, iframeId, organizationId, threadId, origin) {
        let container = document.getElementById(containerId);
        let iframe = document.getElementById(iframeId);

        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            container.classList.add('gendox-chat-container-position', 'gendox-chat-closed');
            document.body.appendChild(container);
        }

        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = iframeId;
            iframe.classList.add('gendox-chat-iframe');
            iframe.src = `http://localhost:3000/gendox/embed/embedded-chat/?organizationId=${organizationId}&threadId=${threadId}&origin=${encodeURIComponent(origin)}`;
            container.appendChild(iframe);
        }
    }

    // Main logic for the chat window handling
    function initializeChat(config) {
        const { trustedOrigin, gendoxContainerId, gendoxIframeId } = config;

        const iframeWindow = document.getElementById(gendoxIframeId);
        const chatContainer = document.getElementById(gendoxContainerId);

        console.log("gendoxContainerId: ", gendoxContainerId);

        const messageListener = function(event) {
            if (event.data && event.data.type === 'gendox.events.initialization.request') {
                const message = { type: "gendox.events.initialization.response", page: "..." };
                iframeWindow.contentWindow.postMessage(message, "*");
                console.log('Received message from iframe', event.data);
            }
        };

        function handleIframeMessage(event) {

            if (event.origin !== trustedOrigin) {
                return;
            }

            if (event.data && event.data.type === 'GENDOX_EVENTS_EMBEDDED_CHAT_TOGGLE_ACTION') {
                const isOpen = event.data.data.isOpen;
                if (isOpen) {
                    console.log("Opening chat window");
                    console.log("chatContainer: ", chatContainer);
                    chatContainer.classList.remove('gendox-chat-closed');
                    chatContainer.classList.add('gendox-chat-open');
                } else {
                    console.log("Closing chat window");
                    chatContainer.classList.remove('gendox-chat-open');
                    chatContainer.classList.add('gendox-chat-closed');
                }
            }
        }

        window.addEventListener('message', handleIframeMessage, false);
        window.addEventListener('message', messageListener);

        window.onunload = function() {
            window.removeEventListener('message', messageListener);
        };
    }

    window.gendox = {};
    // Example usage
    window.gendox.initializeGendoxChat = function(userConfig = {}) {
        const defaultConfig = getDataAttributes();
        const config = {
            ...defaultConfig,
            ...userConfig,
            origin: window.location.origin
        };

        window.gendox.widget = {};
        window.gendox.widget.config = config;

        function runChatInitializationOnLoadedDOM() {
            // Create container and iframe elements dynamically
            createChatElements(config.gendoxContainerId, config.gendoxIframeId, config.organizationId, config.threadId, config.origin);

            // Inject user-defined styles if provided
            if (userConfig.customStyles) {
                injectStyles(userConfig.customStyles);
            }

            initializeChat(config);
        }

        // Check if DOM is already loaded
        if (document.readyState === 'loading') {
            // Still loading, wait for the DOMContentLoaded event
            document.addEventListener('DOMContentLoaded', function () {
                runChatInitializationOnLoadedDOM();
            });
        } else {
            // DOM is already loaded, run the initialization immediately
            runChatInitializationOnLoadedDOM();
        }

    };


    // initialize chat window
    // user could directly call this function to initialize chat window
    window.gendox.initializeGendoxChat();

})();