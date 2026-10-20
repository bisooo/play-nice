import type { Metadata } from "next";
import GenreTurn from "@/components/GenreTurn";

export const metadata: Metadata = { title: "The Egyptian Turn · PLAY-NICE" };

export default function GenresPage() {
  return <GenreTurn />;
}
