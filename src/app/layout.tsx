import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader, Yesteryear } from "next/font/google";
import Script from "next/script";
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
      className={`dark ${geistSans.variable} ${geistMono.variable} ${yesteryear.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script id="theme-init" strategy="beforeInteractive">
          {`try {
            var root = document.documentElement;
            if (location.pathname === '/login') {
              root.classList.add('dark');
              root.classList.remove('theme-exp');
            } else {
              var t = localStorage.getItem('${THEME_STORAGE_KEY}');
              if (t === 'light') {
                root.classList.remove('dark');
              } else if (t === 'exp') {
                root.classList.remove('dark');
                root.classList.add('theme-exp');
              }
            }
          } catch (e) {}`}
        </Script>
        <TooltipProvider delay={300}>{children}</TooltipProvider>
      </body>
    </html>
  );
}
