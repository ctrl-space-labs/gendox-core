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
     * Fetches responses of a specific type, waiting until the maximum number of responses
     * are collected or the maximum wait timeout is reached, whichever comes first.
     *
     * @param {string} requestType - The type of the request to send.
     * @param {string} responseType - The type of the responses to collect.
     * @param {Object} requestPayload - The payload to include in the request message.
     * @param {number} [maxResponses=2] - The maximum number of responses to collect.
     * @param {number} [maxWaitTimeoutMs=100] - The maximum time to wait (in milliseconds) for responses.
     * @returns {Promise<Object[]>} A promise that resolves to an array of collected response payloads.
     *
     * @example
     * const responses = await fetchResponses('getData', 'responseType', { key: 'value' }, 5, 2000);
     * console.log(responses); // Array of response payloads, up to 5 or until timeout
     */
    async fetchResponses(
        requestType,
        responseType,
        requestPayload,
        maxResponses = 2,
        maxWaitTimeoutMs = 100
    ) {
        const collectedResponses = [];
        let resolveCondition;

        // Create a promise that resolves when `maxResponses` messages are collected or timeout occurs
        const responsesPromise = new Promise((resolve) => {
            resolveCondition = resolve;
        });

        // Handler for collecting responses
        const responseHandler = (event) => {
            if (event.type === responseType) {
                collectedResponses.push(event.payload);
                if (collectedResponses.length >= maxResponses) {
                    resolveCondition(); // Resolve the promise when enough responses are collected
                }
            }
        };

        // Send the request message
        this.sendMessage({
            type: requestType,
            payload: requestPayload,
        });

        // Add the temporary handler
        this.addHandler(responseHandler);

        // Wait for either the messages or timeout
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, maxWaitTimeoutMs));
        await Promise.race([responsesPromise, timeoutPromise]);

        // Remove the handler
        this.removeHandler(responseHandler);

        return collectedResponses;
    }
}

export default MessageManagerService;