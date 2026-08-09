import type { Metadata } from "next";
import { Geist, Geist_Mono, Yesteryear } from "next/font/google";
import Script from "next/script";
import { TooltipProvider } from "@/components/ui/tooltip";
import { THEME_STORAGE_KEY } from "@/lib/theme-constants";
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

export const metadata: Metadata = {
  title: "Trition",
  description: "A Notion-like workspace backed entirely by Trello.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${geistSans.variable} ${geistMono.variable} ${yesteryear.variable} h-full antialiased`}
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
