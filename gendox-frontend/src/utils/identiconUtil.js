import CryptoJS from 'crypto-js';

// Desc: Generated identicon for the provided text
import Identicon from "identicon.js";

const calculateIdenticonHash = (text) => {

    return CryptoJS.MD5(text).toString(CryptoJS.enc.Hex);
}


export const generateIdenticon = (text) => {

    // Append default value to text, even if text is null or undefined
    const appendedText = (text || "") + "default_hash_1312";

    const hash = calculateIdenticonHash(appendedText);


    // Generate the identicon data URI with custom color and transparent background
    const data = new Identicon(hash, {
        size: 64,                       // Adjust size if needed
        margin: 0.2,                    // 20% margin
        format: "svg",                  // SVG format for better quality
        foreground: [8, 182, 141, 255], // Custom color #08B68D
        background: [8, 182, 141, 30]  // TODO: get color from theme
    }).toString();



    // Construct the src URL for the Avatar component
    return `data:image/svg+xml;base64,${data}`;
};