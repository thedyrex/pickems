import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const posterGothic = localFont({
  src: [{
    path: "./fonts/Poster_Gothic_Round_ATF_Heavy.otf",
    weight: "400",
  }],
  variable: "--font-poster-gothic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PICK'EMS",
  description: "Tournament Pick'ems Bracket",
  icons: {
    icon: '/fonts/owcs.png',
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${posterGothic.variable} font-sans antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
