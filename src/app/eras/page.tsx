import type { Metadata } from "next";
import MyEras from "@/components/MyEras";

export const metadata: Metadata = { title: "My Eras · PLAY-NICE" };

export default function ErasPage() {
  return <MyEras />;
}
