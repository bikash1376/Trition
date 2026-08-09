import type { Metadata } from "next";
import { Geist, Geist_Mono, Yesteryear } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  title: "DaSpace",
  description: "A Notion-like workspace backed entirely by Trello.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${yesteryear.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider delay={300}>{children}</TooltipProvider>
      </body>
    </html>
  );
}
