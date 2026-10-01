import { Manrope } from "next/font/google";

// latin-ext Turkce (ş, ğ, ı, İ) ve Azerbaycanca, cyrillic Rusca karakterler icin gerekir;
// eksik olursa bu harfler sistem yazi tipine duser ve metin yamali gorunur.
export const manrope = Manrope({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-manrope", display: "swap" });
