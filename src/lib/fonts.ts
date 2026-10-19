import localFont from "next/font/local";

// The PLAY-NICE display face (navbar links, stat headlines, tile names). Its digits are stylised
// and misread at a glance, so numbers stay in Inter.
export const logoFont = localFont({ src: "../../public/font-style.ttf" });
