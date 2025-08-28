import type { Metadata } from "next";
import "../styles/main.css";

export const metadata: Metadata = {
  title: "e52 Technologies",
  description:
    "We are a data consultancy that partners with companies to build and leverage data assets for bottom line impact.",
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
