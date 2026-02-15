import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MovieFlix",
  description: "Browse top-rated movies by genre",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#141414] text-white min-h-screen">{children}</body>
    </html>
  );
}
