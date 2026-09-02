import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Civic Digest",
  description: "Open Civic Data (OCD-ID) scraper, NLP enrichment pipeline, and municipal transparency service.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
