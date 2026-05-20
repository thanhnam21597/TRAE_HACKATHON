import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "TRAE Director",
  description: "From script to final cut, powered by one intelligent agent.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        {children}
        <Toaster
          richColors
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(15, 23, 42, 0.9)",
              border: "1px solid rgba(148, 163, 184, 0.3)",
              color: "#e2e8f0",
            },
          }}
        />
      </body>
    </html>
  );
}
