import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { I18nProvider } from "@/components/i18n-provider";
import { SerwistProvider } from "@/components/serwist-provider";
import { getLang } from "@/lib/i18n/server";
import "./globals.css";

// Fonts are bundled with the app (app/fonts, OFL licensed via Fontsource), so builds never depend
// on downloading from Google Fonts. Variable weight files cover 100 to 900.
const inter = localFont({
  variable: "--font-inter",
  src: [
    { path: "./fonts/inter-latin-wght-normal.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/inter-latin-ext-wght-normal.woff2", weight: "100 900", style: "normal" },
  ],
  display: "swap",
});

const tasa = localFont({
  variable: "--font-tasa",
  src: "./fonts/tasa-orbiter-latin-wght-normal.woff2",
  weight: "400 800",
  display: "swap",
});

const notoDevanagari = localFont({
  variable: "--font-devanagari",
  src: "./fonts/noto-sans-devanagari-devanagari-wght-normal.woff2",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Udhaar Suite · Razorpay",
  description: "Give credit safely, get paid on time.",
  applicationName: "Udhaar Suite",
  appleWebApp: { capable: true, title: "Udhaar Suite", statusBarStyle: "black" },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  return (
    <html
      lang={lang}
      className={`${inter.variable} ${tasa.variable} ${notoDevanagari.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <SerwistProvider swUrl="/serwist/sw.js" disable={process.env.NODE_ENV !== "production"}>
          <I18nProvider initialLang={lang}>{children}</I18nProvider>
        </SerwistProvider>
      </body>
    </html>
  );
}
