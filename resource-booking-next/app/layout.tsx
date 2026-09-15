import type { Metadata } from "next";
import { Lato } from "next/font/google";

import "./globals.css";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-lato",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Resource Booking",
    template: "%s · Resource Booking",
  },
  description:
    "Book seminar halls, the auditorium and guest house rooms at Government College of Engineering, Erode.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={lato.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
