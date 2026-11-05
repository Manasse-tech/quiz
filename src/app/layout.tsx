import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

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
      </body>
    </html>
  );
}
