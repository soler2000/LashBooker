import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Lashed and Lifted",
  description: "Eyelash booking with deposit protection",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
