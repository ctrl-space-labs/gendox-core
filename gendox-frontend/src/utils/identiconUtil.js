// Desc: Generated identicon for the provided text
import Identicon from "identicon.js";

export const generateIdenticon = (text) => {
    if (text) {
        // Create a hash based on the user’s unique ID or name
        const hash = text
            ? text
                .split("")
                .reduce((acc, char) => acc + char.charCodeAt(0).toString(16), "")
            : "defaulthash";

        // Generate the identicon data URI with custom color and transparent background
        const data = new Identicon(hash, {
            size: 64,                       // Adjust size if needed
            margin: 0.2,                    // 20% margin
            format: "svg",                  // SVG format for better quality
            foreground: [8, 182, 141, 255], // Custom color #08B68D
            background: [255, 255, 255, 0]  // Transparent background
        }).toString();

        console.log("Generating Identicon!!!!")

        // Construct the src URL for the Avatar component
        return `data:image/svg+xml;base64,${data}`;
    }
};