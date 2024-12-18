/**
 * The `MessageManagerService` class is used to manage message communication between iframes and their parent windows.
 *
 * In General upon initialization you provide:
 * - A target origin to send messages to.
 * - A list of trusted origins to accept messages from. (usually just 1, the parent window that embeds the Gendox iframe)
 *
 * Other components send messages by using the `MessageManagerService#sendMessage`
 * by providing the message and optionally the target origin.
 *
 * Other components can add message handlers using `MessageManagerService#addHandler`.
 * All messages receive from the trusted origins are passed to the handlers.
 * A handler needs to check if the message is intended for it by checking the message type. eg.
 * ```
 * const handler = (message) => {
 *    if (message.type !== 'gendox.events.example.message.type') {
 *      // else ignore the message
 *      return;
 *    }
 *    // handle the message
 * }
 * ```
 *
 * !!! Note: upon destruction of the component that uses the `MessageManagerService`, method `cleanup` should be called to remove the event listeners.
 *
 */

class MessageManagerService {
    constructor() {
        this.handlers = [];
        this.targetOrigin = null;
        this.trustedOrigins = new Set(); // Using a Set for better performance
        this.initiated = null;
    }

    init(targetOrigin = null, trustedOrigins = []) {
        if (this.initiated) {
            return;
        }
        // console.log("MessageManagerService.init()");
        window.addEventListener("message", this.handleMessage);
        this.initiated = true;
        if (targetOrigin) {
            this.targetOrigin = targetOrigin;
        }
        if (trustedOrigins.length > 0) {
            this.trustedOrigins = new Set(trustedOrigins);
        }
    }

    handleMessage = (event) => {
        // Validate origin
        if (!this.trustedOrigins.has(event.origin)) return;

        // Handle the message
        this.handlers.forEach((handler) => handler(event.data));
    };

    sendMessage(message, targetOrigin = null) {
        let target = this.targetOrigin;

        if (targetOrigin) {
            target = targetOrigin;
        }

        // I can't find why sometimes it is initiated as 'null'
        // usually when an embedded page, is not actually embedded, but viewed directly in the browser
        // Prize: 1 hug to the person who finds the bug!
        if (!target || target === 'null') {
            console.error("Target origin not set. Cannot send message.");
            return;
        }
        window.parent.postMessage(message, target);
    }

    addHandler(handler) {
        this.handlers.push(handler);
    }

    removeHandler(handler) {
        const index = this.handlers.indexOf(handler);
        if (index !== -1) {
            this.handlers.splice(index, 1);
        }
    }

    cleanup() {
        window.removeEventListener("message", this.handleMessage);
        this.initiated = false;
    }

    // Manage trusted origins with Set
    addTrustedOrigin(origin) {
        this.trustedOrigins.add(origin);
    }

    setTargetOrigin(origin) {
        this.targetOrigin = origin;
    }

    removeTrustedOrigin(origin) {
        this.trustedOrigins.delete(origin);
    }

    /**
     * Sends a request and listens for responses of a certain type for a given timeout.
     *
     * @param {string} requestType - The type of the request message to send.
     * @param {string} responseType - The type of the response messages to listen for.
     * @param {object} requestPayload - The payload to include in the request.
     * @param {number} [timeout=100] - How long to wait (in ms) for response messages.
     * @returns {Promise<Array>} A promise that resolves to an array of response payloads collected during the timeout period.
     */
    async fetchResponses(requestType, responseType, requestPayload, timeout = 100) {
        const collectedResponses = [];

        // Handler for collecting responses
        const responseHandler = (event) => {
            if (event.type === responseType) {
                collectedResponses.push(event.payload);
            }
        };

        // Send the request message
        this.sendMessage({
            type: requestType,
            payload: requestPayload,
        });

        // Add the temporary handler
        this.addHandler(responseHandler);

        // Wait for the specified timeout
        await new Promise((resolve) => setTimeout(resolve, timeout));

        // Remove the handler
        this.removeHandler(responseHandler);

        return collectedResponses;
    }
}

export default MessageManagerService;