import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { QueryProvider } from "@/src/core/providers/query-provider";
import "./globals.css";

const defaultUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "TutorPAES",
  description: "Aplicación TutorPAES: frontend en Next.js con backend personalizado",
};

const bodySans = IBM_Plex_Sans({
  variable: "--font-body",
  display: "swap",
  subsets: ["latin"],
});

const displayMono = IBM_Plex_Mono({
  variable: "--font-display",
  display: "swap",
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${bodySans.variable} ${displayMono.variable} antialiased`}>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
