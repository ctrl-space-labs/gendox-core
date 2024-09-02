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
}

export default MessageManagerService;