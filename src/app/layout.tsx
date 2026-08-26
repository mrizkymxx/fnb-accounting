import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FnB AccountIQ - Purchasing & Cash Flow",
  description: "Manajemen purchasing, kas dipegang, tempo supplier, dan dana belanja FnB",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FnB AccountIQ",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#FFE600",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full flex flex-col antialiased text-black">
        {children}
      </body>
    </html>
  );
}
