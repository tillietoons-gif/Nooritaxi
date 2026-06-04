import type { Metadata } from "next";
import { Inter, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/components/i18n-provider";
import { UserBehaviorProvider } from "@/components/user-behavior-provider";
import { SkipToContent } from "@/components/layout/skip-to-content";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Noori | Next-Gen Mobility & Logistics",
  description: "A world-class mobility and logistics ecosystem designed for the future.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans antialiased`}>
        <I18nProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <UserBehaviorProvider>
              <SkipToContent />
              {children}
            </UserBehaviorProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
