import { Suspense } from "react";
import type { Metadata } from "next";
import MyCharts from "@/components/MyCharts";

export const metadata: Metadata = { title: "My Charts · PLAY-NICE" };

// MyCharts reads its filters from the URL, which needs a Suspense boundary in Next 14
export default function ChartsPage() {
  return (
    <Suspense>
      <MyCharts />
    </Suspense>
  );
}
