import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/header";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Cloudflare R2 Dashboard',
  description:
    'An intuitive dashboard to easily upload, view, and manage your files and buckets on Cloudflare R2.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favico-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favico-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favico-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favico-64x64.png', sizes: '64x64', type: 'image/png' },
      { url: '/favico-128x128.png', sizes: '128x128', type: 'image/png' },
      { url: '/favico-256x256.png', sizes: '256x256', type: 'image/png' },
    ],
    apple: '/favico-256x256.png', // Using 256x256 as a high-res fallback for apple-touch-icon
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
