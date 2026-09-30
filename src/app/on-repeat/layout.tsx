import type { ReactNode } from "react";
import { OnRepeatLayout } from "@/components/OnRepeat";

export default function Layout({ children }: { children: ReactNode }) {
  return <OnRepeatLayout>{children}</OnRepeatLayout>;
}
