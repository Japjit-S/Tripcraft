import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/lib/auth/AuthContext";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Tripcraft",
  description: "A better journey begins with a plan that fits.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full antialiased ${plusJakartaSans.variable} ${playfairDisplay.variable}`}>
      <body className={`font-sans min-h-full flex flex-col`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
