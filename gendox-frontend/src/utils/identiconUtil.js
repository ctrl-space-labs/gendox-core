import MD5 from 'crypto-js/md5';
import Hex from 'crypto-js/enc-hex';

// Desc: Generated identicon for the provided text
import Identicon from "identicon.js";
import {hexToRGBAArray} from "../@core/utils/hex-to-rgba";

const calculateIdenticonHash = (text) => {

  return MD5(text).toString(Hex);
}


export const generateIdenticon = (
  text,
  foregroundHex = '#08B68D',
  backgroundHex = '#08B68D',
  backgroundAlpha = 30) => {

    // Append default value to text, even if text is null or undefined
    const appendedText = (text || "") + "default_hash_1312";

    const hash = calculateIdenticonHash(appendedText);
  // Convert the hex colors to [R, G, B, A] arrays
  const foreground = hexToRGBAArray(foregroundHex, 255)
  const background = hexToRGBAArray(backgroundHex, backgroundAlpha)


    // Generate the identicon data URI with custom color and transparent background
  const data = new Identicon(hash, {
    size: 64,                       // Adjust size if needed
    margin: 0.2,                    // 20% margin
    format: "svg",                  // SVG format for better quality
    foreground,
    background
  }).toString();

  // console.log("Calculating identicon hash for:", text); // debugging

  // Construct the src URL for the Avatar component
  return `data:image/svg+xml;base64,${data}`;
};
