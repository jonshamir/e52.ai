import type { Metadata } from "next";
import "../styles/main.css";

export const metadata: Metadata = {
  title: "Studio Normal",
  description: "Interactive Technology Studio",
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
