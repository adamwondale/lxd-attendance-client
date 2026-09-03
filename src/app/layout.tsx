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

import { ThemeProvider } from "@/providers/theme-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var stored = localStorage.getItem('theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                var isDark = stored === 'dark' || (!stored && prefersDark);
                if (isDark) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${instrumentSerif.variable} ${dmSans.variable} ${spaceMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <ThemeProvider>
          <AuthSessionProvider>
            <ApolloProvider>
              {children}
              <Toaster />
            </ApolloProvider>
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
