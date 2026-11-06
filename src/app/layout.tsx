import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { PWARegister } from "@/components/eval/pwa-register";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Évaluation Pentest Web — HARKSTUDENT",
  description:
    "Plateforme d'évaluation des connaissances avant la formation « Initiation au Pentest Web avec l'Intelligence Artificielle ».",
  manifest: "/manifest.webmanifest",
  applicationName: "HARKSTUDENT",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HARKSTUDENT",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0d1117",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className={`${plexSans.variable} ${plexMono.variable} min-h-full flex flex-col`}>
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
