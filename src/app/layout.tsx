import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "LXD Attendance | Studio",
  description: "Disciplined, minimal attendance platform.",
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
