import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gate Pass System",
  description: "College project for managing student and staff gate passes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
