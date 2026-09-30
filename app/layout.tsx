import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Devanagari, TASA_Orbiter } from "next/font/google";
import { SerwistProvider } from "@/components/serwist-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const tasa = TASA_Orbiter({
  variable: "--font-tasa",
  subsets: ["latin"],
});

const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${tasa.variable} ${notoDevanagari.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <SerwistProvider swUrl="/serwist/sw.js" disable={process.env.NODE_ENV !== "production"}>
          {children}
        </SerwistProvider>
      </body>
    </html>
  );
}
