import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import { AuthProvider } from "@/lib/auth/auth-context";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Authentication System",
  description: "Modern authentication system with login and registration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}> <AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}