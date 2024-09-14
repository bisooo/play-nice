import type { Metadata } from "next";
import "@/../styles/globals.css";
import { Inter } from "next/font/google";
import Navbar from "../components/Navbar";
import SessionLayout from "./SessionLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PLAY-NICE",
  description: "A web app for music discovery and playback",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionLayout>
          <Navbar />
          {children}
        </SessionLayout>
      </body>
    </html>
  );
}
