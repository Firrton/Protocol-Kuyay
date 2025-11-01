import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Kuyay Protocol - El Círculo que Multiplica tu Futuro",
  description: "Únete a un círculo de confianza. Aporta poco mensualmente, accede a capital grande cuando te toque. Tu comunidad te respalda.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
