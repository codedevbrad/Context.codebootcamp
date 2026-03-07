import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { Header } from "@/app/(project)/_components/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ContextIO",
  description: "ContextIO is a platform for organizing your projects and contexts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <AuthSessionProvider>
          <main className="flex h-screen flex-col overflow-hidden">
            <Header />
            <div className="container mx-auto min-h-0 flex-1 overflow-hidden px-4 py-8">
              {children}
            </div>
          </main>

        </AuthSessionProvider>
      </body>
    </html>
  );
}
