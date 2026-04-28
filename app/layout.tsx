import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import QueryProvider from "@/components/providers/QueryProvider";
import ToastProvider from "@/components/ToastProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import GlobalAudioPlayer from "@/components/audio/GlobalAudioPlayer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BookWise",
    template: "%s | BookWise",
  },
  description:
    "BookWise helps readers discover professional book summaries, audio insights, and practical learning tools.",
  applicationName: "BookWise",
  keywords: ["book summaries", "audio books", "reading", "learning", "professional development"],
  authors: [{ name: "BookWise" }],
  openGraph: {
    title: "BookWise",
    description:
      "Discover professional book summaries, audio insights, and practical learning tools.",
    type: "website",
    siteName: "BookWise",
  },
  twitter: {
    card: "summary_large_image",
    title: "BookWise",
    description:
      "Discover professional book summaries, audio insights, and practical learning tools.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <SessionProvider>
            <QueryProvider>
              <ToastProvider />
              {children}
              <GlobalAudioPlayer />
            </QueryProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
