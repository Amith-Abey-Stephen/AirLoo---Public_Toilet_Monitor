import type { Metadata, Viewport } from "next";
import { TopNav } from "@/components/top-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AirLoo | Public Toilet Monitor",
    template: "%s | AirLoo",
  },
  description:
    "Search public toilet locations and monitor sanitation sensor dashboards in real time. Find clean, monitored public restrooms near you.",
  openGraph: {
    title: "AirLoo | Public Toilet Monitor",
    description: "Find and monitor clean public toilet locations in real time.",
    siteName: "AirLoo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <TopNav />
        {children}
      </body>
    </html>
  );
}
