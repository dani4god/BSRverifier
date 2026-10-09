import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "BSRverifier | Certificate Verification",
  description: "Verify education certificate records in Benue State.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
