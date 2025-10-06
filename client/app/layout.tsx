import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const lato = Lato({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "BlueRelief - Crisis Management & Response Platform",
    template: "%s | BlueRelief"
  },
  description: "Real-time crisis monitoring and management platform. Track incidents, analyze sentiment trends, and coordinate emergency response across global regions with advanced data visualization and analytics.",
  keywords: ["crisis management", "emergency response", "disaster monitoring", "incident tracking", "real-time alerts", "sentiment analysis", "data visualization", "global crisis tracking"],
  authors: [{ name: "BlueRelief Team" }],
  creator: "BlueRelief Team",
  publisher: "BlueRelief",
  applicationName: "BlueRelief",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "BlueRelief - Crisis Management Platform",
    description: "Real-time crisis monitoring and emergency response coordination",
    type: "website",
    locale: "en_US",
    siteName: "BlueRelief",
    images: [
      {
        url: "/bluerelief-logo.png",
        width: 512,
        height: 512,
        alt: "BlueRelief Logo"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "BlueRelief - Crisis Management Platform",
    description: "Real-time crisis monitoring and emergency response coordination",
    images: ["/bluerelief-logo.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/bluerelief-logo.png"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${lato.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
