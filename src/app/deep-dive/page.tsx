import { Suspense } from "react";
import type { Metadata } from "next";
import DeepDive from "@/components/DeepDive";

export const metadata: Metadata = { title: "Deep Dive · PLAY-NICE" };

// DeepDive reads the artist from the URL, which needs a Suspense boundary in Next 14
export default function DeepDivePage() {
  return (
    <Suspense>
      <DeepDive />
    </Suspense>
  );
}
