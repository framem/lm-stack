import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "n8n",
  description: "n8n application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
