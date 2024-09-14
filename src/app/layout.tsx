import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AaryaI",
  description: "Empower Your Learning Journey",
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
