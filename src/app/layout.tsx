import type { Metadata } from "next";
import { Cousine, Geist, Geist_Mono, Newsreader, Yesteryear } from "next/font/google";
import Script from "next/script";
import { Databuddy } from "@databuddy/sdk/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { THEME_STORAGE_KEY } from "@/lib/theme-constants";
import { appUrl } from "@/lib/trello/env";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const yesteryear = Yesteryear({
  variable: "--font-yesteryear",
  subsets: ["latin"],
  weight: "400",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

const cousine = Cousine({
  variable: "--font-cousine",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const DESCRIPTION = "A Notion-style workspace that uses Trello as its database and storage.";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: {
    default: "Trition",
    template: "%s · Trition",
  },
  description: DESCRIPTION,
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
  openGraph: {
    title: "Trition",
    description: DESCRIPTION,
    siteName: "Trition",
    type: "website",
    images: [{ url: "/banner.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trition",
    description: DESCRIPTION,
    images: ["/banner.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${geistSans.variable} ${geistMono.variable} ${yesteryear.variable} ${newsreader.variable} ${cousine.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script id="theme-init" strategy="beforeInteractive">
          {`try {
            var root = document.documentElement;
            if (location.pathname === '/login') {
              root.classList.add('dark');
              root.classList.remove('theme-exp', 'theme-terminal');
            } else {
              var t = localStorage.getItem('${THEME_STORAGE_KEY}');
              if (t === 'light') {
                root.classList.remove('dark', 'theme-exp', 'theme-terminal');
              } else if (t === 'exp') {
                root.classList.remove('dark', 'theme-terminal');
                root.classList.add('theme-exp');
              } else if (t === 'terminal') {
                root.classList.remove('dark', 'theme-exp');
                root.classList.add('theme-terminal');
              }
            }
          } catch (e) {}`}
        </Script>
        <TooltipProvider delay={300}>{children}</TooltipProvider>
        {process.env.NEXT_PUBLIC_DATABUDDY_CLIENT_ID && (
          <Databuddy clientId={process.env.NEXT_PUBLIC_DATABUDDY_CLIENT_ID} trackWebVitals trackErrors />
        )}
      </body>
    </html>
  );
}
