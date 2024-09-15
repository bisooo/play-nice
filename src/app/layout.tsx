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
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </head>
      <body className={`${inter.className} bg-black text-white`}>
        <SessionLayout>
          <Navbar />
          {children}
        </SessionLayout>
      </body>
    </html>
  );
}
