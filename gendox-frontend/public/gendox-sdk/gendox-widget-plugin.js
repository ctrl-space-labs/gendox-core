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
            gendoxSrc: scriptTag.getAttribute('data-gendox-src') || '',
            organizationId: scriptTag.getAttribute('data-organization-id') || '',
            projectId: scriptTag.getAttribute('data-project-id') || '',
            gendoxContainerId: scriptTag.getAttribute('data-gendox-container-id') || 'gendox-chat-container-id',
            gendoxIframeId: scriptTag.getAttribute('data-gendox-iframe-id') || 'gendox-chat-iframe-id'
        };
    }

    // Create container and iframe dynamically if they don't exist
    function createChatElements(containerId, iframeId, gendoxSrc, organizationId, projectId, origin) {
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
            iframe.src = `${gendoxSrc}/gendox/embed/embedded-chat/?organizationId=${organizationId}&projectId=${projectId}&origin=${encodeURIComponent(origin)}`;
            container.appendChild(iframe);
        }
    }

    // Main logic for the chat window handling
    function initializeChat(config) {
        const { gendoxSrc, gendoxContainerId, gendoxIframeId } = config;

        const iframeWindow = document.getElementById(gendoxIframeId);
        const chatContainer = document.getElementById(gendoxContainerId);

        console.log("gendoxContainerId: ", gendoxContainerId);

        const handleInitializationRequestMessage = function(event) {
            if (event.data && event.data.type === 'gendox.events.initialization.request') {
                const message = { type: "gendox.events.initialization.response", page: "..." };
                iframeWindow.contentWindow.postMessage(message, gendoxSrc);
                console.log('Received message from iframe', event.data);
            }
        };

        const handleLocalContextSelectedText = function(event) {
            if (event.data && event.data.type === 'gendox.events.chat.message.context.local.request') {
                gatherSelectedText((selectedText) => {
                    const message = {
                        type: "gendox.events.chat.message.context.local.response",
                        payload: {
                            contextType: {
                                name: "SELECTED_TEXT"
                            },
                            value: selectedText
                        }
                    };
                    iframeWindow.contentWindow.postMessage(message, gendoxSrc);
                }, true);
            }
        }

        function handleChatWindowToggleMessage(event) {

            if (event.origin !== gendoxSrc) {
                return;
            }

            if (event.data && event.data.type === 'gendox.events.embedded.chat.toggle.action') {
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

        // Listen for actions from the AI Agent
        function handleToolUseMessages(event) {
          if (event.data && event.data.type === 'gendox.events.chat.message.tool_calls.request') {
            const toolCalls = event.data.payload;
            console.log("Tool Calls Request Received:", event.data.payload);

            toolCalls.forEach(tool => {
              const fnName = tool.function.name;
              let parsedArgs = {};

              try {
                parsedArgs = JSON.parse(tool.function.arguments || '{}');
              } catch (err) {
                console.error('Failed to parse arguments for', fnName, err);
                return;
              }

              const handler = window.gendox.tools.allTools[fnName];
              if (handler) {
                try {

                  const result = handler(parsedArgs);
                  console.log(`Tool “${fnName}” returned:`, result);
                  tool.response = result;
                } catch (err) {
                  console.error(`Error executing handler "${fnName}":`, err);
                }
              } else {
                console.warn('Unknown tool call function:', fnName);
              }
            })

            // TODO return all toolCalls->response to the iframe with 'gendox.events.chat.message.tool_calls.response' type

          }
        }

        window.addEventListener('message', handleChatWindowToggleMessage, false);
        window.addEventListener('message', handleInitializationRequestMessage);
        window.addEventListener('message', handleLocalContextSelectedText);
        window.addEventListener('message', handleToolUseMessages);

        window.onunload = function() {
            window.removeEventListener('message', handleInitializationRequestMessage);
            window.removeEventListener('message', handleChatWindowToggleMessage);
            window.removeEventListener('message', handleLocalContextSelectedText);
            window.removeEventListener('message', handleToolUseMessages);
        };
    }

    function initializeDefaultTools() {
        // Register the default "open_web_page" tool
        registerTool('open_web_page', openWebPageToolHandler);
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
        window.gendox.tools = window.gendox.tools || {};
        window.gendox.tools.allTools = {};
        window.gendox.tools.registerTool = registerTool;
        window.gendox.tools.removeTool = removeTool;

        function runChatInitializationOnLoadedDOM() {
            // Create container and iframe elements dynamically
            createChatElements(config.gendoxContainerId, config.gendoxIframeId, config.gendoxSrc, config.organizationId, config.projectId, config.origin);

            // Inject user-defined styles if provided
            if (userConfig.customStyles) {
                injectStyles(userConfig.customStyles);
            }

            initializeChat(config);
            initializeDefaultTools();
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

////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////     Make it an actual SDK and move this to other .js files    //////////////////////////////////



    // Event handlers must be named or saved in variables to allow removal
    const onMouseUp = () => gatherSelectedText((text) => console.log("Selected Text:", text), false);;
    const onKeyUp = (event) => {
        if (event.key === "Shift" || event.key.startsWith("Arrow")) {
            gatherSelectedText((text) => console.log("Selected Text:", text), false);
        }
    };

    /**
     * Sets up event listeners to detect when the user finishes making a selection.
     */
    function setupSelectionListeners() {
        document.addEventListener("mouseup", onMouseUp);
        document.addEventListener("keyup", onKeyUp);
    }

    /**
     * Removes the event listeners for mouse and keyboard selection finalization.
     */
    function removeSelectionListeners() {
        document.removeEventListener("mouseup", onMouseUp);
        document.removeEventListener("keyup", onKeyUp);
    }


    /**
     * Gathers the selected text and passes it to the callback function.
     * @param {Function} handleTextCallback - The callback function to pass the selected text to.
     * @param {boolean} simpleText - Whether to extract simple text or clean HTML.
     */
    function gatherSelectedText(handleTextCallback, simpleText) {
        // Delay by 1 ms. This has been added because if you clear the selection by clicking on the selected text,
        // it keeps the selection until the next event loop.
        // TODO: This is a workaround and may not work in all cases.
        setTimeout(() => {
            const selection = window.getSelection();

            // Check if the selection is empty or has no ranges
            if (!selection || selection.type !== "Range" || selection.rangeCount === 0 || selection.toString().trim() === "") {
                console.log("No text selected or selection cleared.");
                return;
            }

            const extendedRange = getExpandedSelectedRange(selection);
            let selectedText;
            if (simpleText) {
                selectedText = getTextFromRange(extendedRange);
            } else {
                selectedText = getCleanHTMLFromRange(extendedRange);
            }

            handleTextCallback(selectedText);
        }, 1);

    }

    /**
     * Retrieves the original selected text.
     * @param {Selection} selection - The current selection object.
     * @returns {string} - The original selected text.
     */
    function getSelectedText(selection) {
        return selection.toString();
    }

    /**
     * Expands the current selection to include whole words with a 64-character limit in both directions.
     * @param {Selection} selection - The current selection object.
     * @returns {Range} - The extended range after expansion.
     */
    function getExpandedSelectedRange(selection) {
        const range = selection.getRangeAt(0);

        const newStart = expandBoundary(range.startContainer, range.startOffset, "backward", 64);
        const newEnd = expandBoundary(range.endContainer, range.endOffset, "forward", 64);

        const extendedRange = document.createRange();
        extendedRange.setStart(newStart.node, newStart.offset);
        extendedRange.setEnd(newEnd.node, newEnd.offset);

        return extendedRange;
    }

    /**
     * Expands the boundary of the selection either backward or forward until a whitespace or max characters are reached.
     * @param {Node} node - The text node to start expanding from.
     * @param {number} offset - The current offset within the node.
     * @param {string} direction - The direction to expand ('backward' or 'forward').
     * @param {number} maxChars - The maximum number of characters to expand.
     * @returns {Object} - An object containing the new node and offset after expansion.
     */
    function expandBoundary(node, offset, direction, maxChars) {
        if (!node || node.nodeType !== Node.TEXT_NODE) return { node, offset };

        let count = 0;

        if (direction === "backward") {
            while (offset > 0 && count < maxChars) {
                const char = node.textContent[offset - 1];
                if (/\s/.test(char)) break;
                offset--;
                count++;
            }
        } else if (direction === "forward") {
            while (offset < node.textContent.length && count < maxChars) {
                const char = node.textContent[offset];
                if (/\s/.test(char)) break;
                offset++;
                count++;
            }
        }

        return { node, offset };
    }

    /**
     * Retrieves the simple text from a given range.
     * @param {Range} range - The range to extract text from.
     * @returns {string} - The extracted text.
     */
    function getTextFromRange(range) {
        const fragment = range.cloneContents();
        const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT, null, false);
        let text = "";
        while (walker.nextNode()) {
            text += walker.currentNode.nodeValue;
        }
        return text;
    }

    /**
     * Retrieves the cleaned HTML from a given range by removing unnecessary attributes and styles.
     * @param {Range} range - The range to extract HTML from.
     * @returns {string} - The cleaned HTML as a string.
     */
    function getCleanHTMLFromRange(range) {
        const fragment = range.cloneContents();
        const container = document.createElement("div");
        container.appendChild(fragment);

        /**
         * Recursively cleans a node by removing all attributes.
         * @param {Node} node - The node to clean.
         */
        function cleanNode(node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                // Remove all attributes (e.g., class, style)
                while (node.attributes.length > 0) {
                    node.removeAttribute(node.attributes[0].name);
                }
            }

            // Recursively clean child nodes
            node.childNodes.forEach(cleanNode);
        }

        container.childNodes.forEach(cleanNode);

        return container.innerHTML;
    }

  /**
   * Register a new tool handler by name.
   *
   * @param {string} name - Unique identifier for the tool e.g 'open_web_page'.
   * @param {function(Object): Object} handler -
   *   A function that accepts a single argument (an Object containing
   *   the tool’s parameters) and returns an Object (the result of running the tool).
   *
   */
  function registerTool(name, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }

    if (window.gendox.tools.allTools.hasOwnProperty(name)) {
      throw new Error(`A tool named "${name}" is already registered. You will have to remove it first.`);
    }

    window.gendox.tools.allTools[name] = handler;
  }

  /**
   * Remove a previously registered tool handler by name.
   *
   * @param {string} name - The unique identifier of the tool to remove (e.g. 'open_web_page').
   *
   * @throws {Error} If no tool with the given `name` is registered.
   */
  function removeTool(name) {
    if (!window.gendox.tools.allTools.hasOwnProperty(name)) {
      throw new Error(`No tool named "${name}" is registered.`);
    }
    delete window.gendox.tools.allTools[name];
  }


  /**
   * Default implementation for the "open_web_page" tool.
   *
   * @param {Object} arguments - The arguments passed to the tool.
   */
  function openWebPageToolHandler(arguments) {

    console.log("Opening web page:", arguments.url);
    window.open(arguments.url, '_blank');
    return {"status": "executed"}
  }

})();
