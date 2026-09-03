import type { Metadata, Viewport } from "next";
import { Instrument_Serif, DM_Sans, Space_Mono } from "next/font/google";
import "./globals.css";
import { ApolloProvider } from "@/providers/apollo-provider";
import { AuthSessionProvider } from "@/providers/session-provider";
import { Toaster } from "@/components/ui/toaster";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument-serif",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const spaceMono = Space_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-space-mono",
});

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "HULU TRACK",
  description: "Disciplined, minimal attendance platform.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HULU TRACK",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${instrumentSerif.variable} ${dmSans.variable} ${spaceMono.variable} antialiased`}
      >
        <AuthSessionProvider>
          <ApolloProvider>
            {children}
            <Toaster />
          </ApolloProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
